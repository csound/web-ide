#include "csoundCore.h"
#include "csound_data_structures.h"
static void quote(const char *s) {
  putchar('"');
  for (; s && *s; s++) {
    if (*s == '"' || *s == '\\') putchar('\\');
    if (*s == '\n') fputs("\\n", stdout); else putchar(*s);
  }
  putchar('"');
}
int main(void) {
  CSOUND *cs = csoundCreate(NULL, NULL);
  puts("static const OENTRY signatures[] = {");
  for (int i = 0; i < cs->opcodes->table_size; i++) {
    for (CS_HASH_TABLE_ITEM *bucket = cs->opcodes->buckets[i]; bucket; bucket = bucket->next) {
      for (CONS_CELL *cell = bucket->value; cell; cell = cell->next) {
        OENTRY *op = cell->value;
        fputs("{.opname=", stdout); quote(op->opname);
        fputs(",.outypes=", stdout); quote(op->outypes);
        fputs(",.intypes=", stdout); quote(op->intypes);
        printf(",.flags=%d},\n", op->flags);
      }
    }
  }
  puts("};");
  return 0;
}
