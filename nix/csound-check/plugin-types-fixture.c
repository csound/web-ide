/* Local regression fixture: an opaque object and a struct with a nested array. */
#include "csdl.h"

static CS_VARIABLE *voice(void *data, const CS_TYPE *type,
                          const void *arg, INSDS *ctx) {
  CSOUND *cs = data;
  CS_VARIABLE *var = cs->Calloc(cs, sizeof(CS_VARIABLE));
  var->memBlockSize = sizeof(cs_float);
  return var;
}
static const CS_TYPE voice_type = {
  .varTypeName = "PluginVoice", .varDescription = "Test object",
  .argtype = CS_ARG_TYPE_BOTH, .createVariable = voice
};

PUBLIC int32_t csoundModuleCreate(CSOUND *cs) {
  const CSOUND_STRUCT_MEMBER fields[] = {{"level", "k"}, {"notes", "i[]"}};
  return cs->AddVariableType(cs, cs->GetTypePool(cs), &voice_type) &&
         cs->RegisterStruct(cs, "PluginPair", fields, 2) ? OK : NOTOK;
}
PUBLIC int32_t csoundModuleInit(CSOUND *cs) {
  static OENTRY opcodes[] = {
    {.opname = "plugin_voice", .outypes = ":PluginVoice;", .intypes = "k"},
    {.opname = "plugin_read", .outypes = "k", .intypes = ":PluginVoice;"},
    {.opname = "plugin_pair", .outypes = ":PluginPair;", .intypes = ""}
  };
  return cs->AppendOpcodes(cs, opcodes, 3);
}
PUBLIC int32_t csoundModuleInfo(void) { return CSOUND_MODULE_INFO; }
