/* A command instance owns one parse. Its host discards the complete memory
   afterwards, including allocations left by fatal parser errors. */
#include "csoundCore.h"
#include "csound_compiler.h"
#include "csound_standard_types.h"
#include "csound_data_structures.h"
#include "corfile.h"
#include "signatures.h"
void csoundIdeUnknownCalls(CSOUND *csound);

static void *allocate(CSOUND *cs, size_t n) { return malloc(n); }
static void *zero_allocate(CSOUND *cs, size_t n) { return calloc(1, n); }
static void *resize(CSOUND *cs, void *p, size_t n) { return realloc(p, n); }
static void release(CSOUND *cs, void *p) { free(p); }
static char *duplicate(CSOUND *cs, const char *p) { return strdup(p); }
static void message(CSOUND *cs, const char *fmt, ...) {
  va_list args; va_start(args, fmt); vfprintf(stderr, fmt, args); va_end(args);
}
static void __attribute__((noreturn)) fatal(CSOUND *cs, const char *fmt, ...) {
  va_list args; va_start(args, fmt); vfprintf(stderr, fmt, args); va_end(args);
  longjmp(cs->exitjmp, 1);
}
static void __attribute__((noreturn)) jump(CSOUND *cs, int value) { longjmp(cs->exitjmp, 1); }
static void quiet(CSOUND *cs, const char *fmt, ...) {}
static void callback(CSOUND *cs, int32_t attr, const char *fmt, va_list args) { vfprintf(stderr, fmt, args); }
/* A validator never loads executable plugins or starts an instrument. */

/* Semantic checks need a variable descriptor, not its runtime representation.
   Never copy or invoke a constructor from the inspected plugin. */
static CS_VARIABLE *metadata_variable(void *data, const CS_TYPE *type,
                                     const void *arg, INSDS *context) {
  CS_VARIABLE *var = calloc(1, sizeof(CS_VARIABLE));
  var->memBlockSize = sizeof(cs_float);
  var->ctx = context;
  return var;
}

/* The host sends all type headers, then members, then opcode signatures.
   Empty input/output fields remain valid for zero-argument opcodes. */
static int plugin_signatures(CSOUND *cs) {
  char record[1400];
  unsigned opcodes = 0, types = 0, members = 0;
  while (fgets(record, sizeof(record), stdin)) {
    char *newline = strchr(record, '\n');
    if (!newline) return 0;
    *newline = 0;
    char *fields[5] = { record };
    unsigned count = 1;
    for (char *p = record; *p; p++) {
      if (*p == '\t') {
        if (count == 5) return 0;
        *p = 0; fields[count++] = p + 1;
      }
    }
    if (count < 4 || !*fields[1] || strlen(fields[1]) > 255) return 0;
    if (!strcmp(fields[0], "T") && count == 4) {
      if (++types > 256 || strlen(fields[2]) != 1 ||
          fields[2][0] < '0' || fields[2][0] > '2' ||
          (strcmp(fields[3], "0") && strcmp(fields[3], "1")) ||
          csoundGetTypeWithVarTypeName(cs->typePool, fields[1])) return 0;
      CS_TYPE *type = calloc(1, sizeof(CS_TYPE));
      type->varTypeName = strdup(fields[1]);
      type->varDescription = type->varTypeName;
      type->argtype = fields[2][0] - '0';
      type->userDefinedType = fields[3][0] == '1' ? CS_TYPE_PLUGIN_DEFINED : 0;
      type->createVariable = metadata_variable;
      if (!csoundAddVariableType(cs, cs->typePool, type)) return 0;
    } else if (!strcmp(fields[0], "M") && count == 5) {
      if (++members > 2048 || !*fields[2] || strlen(fields[2]) > 255 ||
          !*fields[3] || strlen(fields[3]) > 255 || !*fields[4]) return 0;
      CS_TYPE *owner = (CS_TYPE *)csoundGetTypeWithVarTypeName(cs->typePool, fields[1]);
      const CS_TYPE *type = csoundGetTypeWithVarTypeName(cs->typePool, fields[3]);
      char *end;
      long dimensions = strtol(fields[4], &end, 10);
      if (!owner || owner->createVariable != metadata_variable ||
          !owner->userDefinedType || !type || *end || dimensions < 0 || dimensions > 32)
        return 0;
      CS_VARIABLE *member = metadata_variable(cs, type, NULL, NULL);
      member->varName = strdup(fields[2]);
      member->varType = dimensions ? &CS_VAR_TYPE_ARRAY : type;
      member->subType = dimensions ? type : NULL;
      member->dimensions = dimensions;
      CONS_CELL *cell = calloc(1, sizeof(CONS_CELL));
      cell->value = member;
      CONS_CELL **tail = &owner->members;
      while (*tail) tail = &(*tail)->next;
      *tail = cell;
    } else if (!strcmp(fields[0], "O") && count == 4) {
      if (++opcodes > 2048 || strlen(fields[2]) > 512 || strlen(fields[3]) > 512) return 0;
      OENTRY entry = { .opname = strdup(fields[1]), .outypes = strdup(fields[2]),
                       .intypes = strdup(fields[3]) };
      if (csoundAppendOpcodes(cs, &entry, 1) != 0) return 0;
    } else return 0;
  }
  return !ferror(stdin);
}


int main(int argc, char **argv) {
  if (argc != 2) return 2;
  CSOUND *cs = calloc(1, sizeof(CSOUND));
  cs->Malloc = allocate; cs->Calloc = zero_allocate; cs->ReAlloc = resize;
  cs->Free = release; cs->Strdup = duplicate;
  cs->Message = message; cs->Warning = message; cs->ErrorMsg = message;
  cs->DebugMsg = quiet; cs->orcLineOffset = 1;
  cs->MessageS = csoundMessageS; cs->MessageV = csoundMessageV;
  cs->Die = fatal; cs->LongJmp = jump;
  cs->csoundMessageCallback_ = callback;
  cs->oparms = &cs->oparms_;
  cs->oparms->msglevel = 0;
  cs->ksmps = 32; cs->esr = 48000; cs->ekr = 1500;
  cs->e0dbfs = 1; cs->A4 = 440;
  if (setjmp(cs->exitjmp)) {
    csoundIdeUnknownCalls(cs);
    return 1;
  }
  cs->typePool = calloc(1, sizeof(TYPE_POOL));
  add_standard_types(cs, cs->typePool);
  cs->engineState.varPool = csoundCreateVarPool(cs);
  cs->engineState.stringPool = cs_hash_table_create(cs);
  cs->engineState.constantsPool = cs_hash_table_create(cs);
  cs->opcodes = cs_hash_table_create(cs);
  csoundAppendOpcodes(cs, signatures, sizeof(signatures) / sizeof(signatures[0]));
  if (!plugin_signatures(cs)) return 2;
  cs->orchname = argv[1]; cs->csdname = argv[1];
  cs->orchstr = copy_to_corefile(cs, argv[1], NULL, 0);
  if (!cs->orchstr) return 2;
  corfile_puts(cs, "\n#exit\n", cs->orchstr);
  corfile_putc(cs, 0, cs->orchstr); corfile_putc(cs, 0, cs->orchstr);
  TREE *tree = csoundParseOrc(cs, NULL);
  if (!tree) csoundIdeUnknownCalls(cs);
  return tree == NULL ? 1 : 0;
}

/* Only source text is exposed in the worker's read-only filesystem. This cuts
   the engine's audio-file and asynchronous I/O code out of the link. */
void *fopen_path(CSOUND *cs, FILE **fp, const char *name,
                       const char *base, char *env, int32_t score) {
  *fp = fopen(name, "r");
  if (!base) base = cs->orchname;
  if (!*fp && base) {
    const char *slash = strrchr(base, '/');
    if (slash) {
      size_t n = slash - base + 1;
      char *path = malloc(n + strlen(name) + 1);
      memcpy(path, base, n); strcpy(path + n, name);
      *fp = fopen(path, "r"); free(path);
    }
  }
  return *fp;
}
int32_t csoundFileClose(CSOUND *cs, void *fd, uint32_t flags) {
  return fclose(fd);
}

CSOUND *csoundCreate(void *data, const char *directory) { abort(); }

void csoundLongJmp(CSOUND *cs, int32_t value) { jump(cs, value); }
char *strNcpy(char *dest, const char *src, size_t size) {
  if (size) { size_t n = strnlen(src, size - 1); memcpy(dest, src, n); dest[n] = 0; }
  return dest;
}
/* Score string lookup belongs to execution, never source validation. */
char *csoundGetArgString(CSOUND *cs, cs_float value) { abort(); }
static CS_VARIABLE *create_csobj_type(void *data, const CS_TYPE *type,
                                     const void *arg, INSDS *context) {
  CSOUND *cs = data;
  CS_VARIABLE *var = cs->Calloc(cs, sizeof(CS_VARIABLE));
  var->memBlockSize = CS_FLOAT_ALIGN(sizeof(void *) * 3 + sizeof(int32_t));
  var->ctx = context;
  return var;
}
void add_csobj(CSOUND *cs, TYPE_POOL *pool) {
  static const CS_TYPE type = { "Csound", "Csound", CS_ARG_TYPE_BOTH,
                               create_csobj_type, NULL, NULL, NULL, 0 };
  csoundAddVariableType(cs, pool, &type);
}
