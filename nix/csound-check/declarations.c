/* Metadata leaves the parser on stdout; diagnostics use stderr.
   Headers survive a bad body and are emitted before semantic lowering. */
#include "csoundCore.h"
#include "csound_orc.h"
#include "csound_compiler.h"
#include "csound_data_structures.h"

static FILE *output;
static unsigned count;
static CS_HASH_TABLE *identifiers;
static unsigned identifier_count, call_count;
static int lex_complete;
OENTRY *find_opcode(CSOUND *csound, char *name);
static struct {
  char *name;
  uint64_t location;
  int line, column;
} calls[256];

static void quote(const char *text, size_t length) {
  fputc('"', output);
  for (size_t i = 0; i < length; i++) {
    unsigned char c = text[i];
    if (c == '"' || c == '\\') fputc('\\', output);
    if (c < 32) fprintf(output, "\\u%04x", c);
    else fputc(c, output);
  }
  fputc('"', output);
}

static void string(const char *text) { quote(text, strlen(text)); }

static void location(CSOUND *csound, uint64_t location, int line) {
  const char *filename = csound->filedir[location & 0xff];
  fputs(",\"filename\":", output); string(filename ? filename : "");
  fputs(",\"origins\":[", output);
  unsigned separator = 0;
  for (; location; location >>= 8) {
    const char *origin = csound->filedir[location & 0xff];
    if (!origin) continue;
    if (separator++) fputc(',', output);
    string(origin);
  }
  fprintf(output, "],\"line\":%d", line);
}

/* Collect names while lexing, never inspect a recovered tree. A bare name may
   be a variable, opcode reference, constructor or declaration. Treat it as
   known anywhere in this check to avoid making claims about scope or types. */
void csoundIdeIdentifier(CSOUND *csound, ORCTOKEN *token, int call,
                         int line, uint64_t locn) {
  char *name = token->lexeme;
  if (!call) {
    if (identifier_count >= 8192) return;
    if (!identifiers) identifiers = cs_hash_table_create(csound);
    if (!cs_hash_table_get_key(csound, identifiers, name)) {
      cs_hash_table_put_key(csound, identifiers, name);
      identifier_count++;
    }
    return;
  }
  if (call_count >= 256 || strlen(name) > 256 || find_opcode(csound, name)) return;
  calls[call_count].name = strdup(name);
  calls[call_count].location = locn;
  calls[call_count].line = line;
  calls[call_count++].column = token->first_column;
}

void csoundIdeLexEnd(void) { lex_complete = 1; }

void csoundIdeUnknownCalls(CSOUND *csound) {
  /* At the identifier cap, absence from the set no longer means unknown. */
  if (!lex_complete || identifier_count >= 8192) return;
  output = stdout;
  for (unsigned i = 0; i < call_count; i++) {
    char *name = calls[i].name;
    if (identifiers && cs_hash_table_get_key(csound, identifiers, name)) continue;
    if (find_opcode(csound, name)) continue;
    fputs("{\"kind\":\"unknownCall\",\"name\":", output); string(name);
    location(csound, calls[i].location, calls[i].line);
    fprintf(output, ",\"column\":%d}\n", calls[i].column);
  }
  fflush(output);
}

static void arguments(TREE *list, int legacy, int input) {
  fputc('[', output);
  int separator = 0;
  if (legacy) {
    const char *p = list->value->lexeme;
    while (*p && strcmp(p, "0")) {
      const char *start = p++;
      while (p[0] == '[' && p[1] == ']') p += 2;
      if (separator++) fputc(',', output);
      if (input) fputs("{\"name\":\"\",\"type\":", output);
      quote(start, p - start);
      if (input) fputc('}', output);
    }
  } else {
    for (TREE *arg = list; arg; arg = arg->next) {
      if (!arg->value || !arg->value->lexeme) continue;
      const char *name = arg->value->lexeme;
      if (!strcmp(name, "0")) continue;
      const char *type = input ? arg->value->optype : name;
      char inferred[2] = { name[0], 0 };
      if (!type) type = inferred;
      if (separator++) fputc(',', output);
      if (input) {
        fputs("{\"name\":", output); string(name);
        fputs(",\"type\":", output);
      }
      /* Explicit annotations keep [] in optype; legacy array syntax uses nodes. */
      size_t size = strlen(type);
      unsigned dimensions = 0;
      if (arg->type == T_ARRAY_IDENT)
        for (TREE *dimension = arg->right; dimension; dimension = dimension->next)
          dimensions++;
      char *array_type = malloc(size + dimensions * 2 + 1);
      memcpy(array_type, type, size);
      for (unsigned i = 0; i < dimensions; i++) {
        array_type[size++] = '['; array_type[size++] = ']';
      }
      array_type[size] = 0;
      string(array_type); free(array_type);
      if (input) fputc('}', output);
    }
  }
  fputc(']', output);
}

void csoundIdeUdo(CSOUND *csound, TREE *tree) {
  if (count++ >= 2048) return;
  output = stdout;
  TREE *header = tree->left;
  fputs("{\"name\":", output); string(header->value->lexeme);
  location(csound, header->locn, header->line);
  fputs(",\"inputs\":", output);
  int legacy = header->left && header->left->type == UDO_ANS_TOKEN;
  arguments(header->right, legacy, 1);
  fputs(",\"outputs\":", output);
  arguments(header->left, legacy, 0);
  fputs("}\n", output);
  fflush(output);
}
