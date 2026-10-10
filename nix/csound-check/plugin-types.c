/* Read descriptors only. Never invoke a plugin's variable constructor. */
#include "csdl.h"

static int safe_name(const char *s) {
  if (!s || !*s) return 0;
  unsigned n = 0;
  for (; *s; s++, n++)
    if (n >= 255 || *s < 32 || *s > 126) return 0;
  return 1;
}

static int32_t read_types(CSOUND *cs, void *unused) {
  unsigned types = 0, members = 0;
  TYPE_POOL *pool = cs->GetTypePool(cs);
  if (!pool) return NOTOK;
  for (CS_TYPE_ITEM *item = pool->head; item; item = item->next) {
    const CS_TYPE *type = item->cstype;
    if (++types > 256 || !type || !safe_name(type->varTypeName)) return NOTOK;
    cs->Message(cs, "@ide-type\t%s\t%d\t%d\n", type->varTypeName,
                type->argtype, !!type->userDefinedType);
    for (CONS_CELL *cell = type->members; cell; cell = cell->next) {
      const CS_VARIABLE *member = cell->value;
      if (++members > 2048 || !member || !safe_name(member->varName) ||
          !member->varType) return NOTOK;
      int array = member->varType->varTypeName[0] == '[';
      const CS_TYPE *member_type = array ? member->subType : member->varType;
      if (!member_type || !safe_name(member_type->varTypeName)) return NOTOK;
      cs->Message(cs, "@ide-member\t%s\t%s\t%s\t%d\n", type->varTypeName,
                  member->varName, member_type->varTypeName,
                  array ? member->dimensions : 0);
    }
  }
  cs->Message(cs, "@ide-types-end\n");
  return OK;
}

PUBLIC int32_t csoundModuleCreate(CSOUND *cs) { return OK; }
PUBLIC int32_t csoundModuleInit(CSOUND *cs) {
  static OENTRY opcode = { .opname = "__ide_read_types", .dsblksiz = sizeof(OPDS),
    .outypes = "", .intypes = "", .init = (SUBR)read_types };
  return cs->AppendOpcodes(cs, &opcode, 1);
}
PUBLIC int32_t csoundModuleInfo(void) { return CSOUND_MODULE_INFO; }
