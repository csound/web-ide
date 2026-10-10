"""Keep only the host helpers used by the parser from the pinned Csound source.

The normal host object refers to every DSP opcode and pulls their C++ startup
constructors into the link even when the entry point never creates an engine.
"""
from pathlib import Path
import re
source = Path('Top/csound.c').read_text()
names = ['opcode_list_new_oentry', 'csoundAppendOpcode', 'csoundAppendOpcodes',
         'csoundPrependOpcodes', 'csoundGetDebug', 'csoundGetType',
         'csoundGetSr', 'csoundGetKr',
         'csoundGet0dBFS', 'csoundGetA4', 'csoundGetNchnls', 'csoundGetNchnlsInput',
         'csoundGetTypeForArg', 'csoundGetHostData', 'csoundGetSizeOfCsFloat']
output = [source[:source.index('*/') + 2], '#include "csoundCore.h"',
          '#include "csound_orc.h"', '#include "csound_orc_semantics.h"',
          'void (*msgcallback_)(CSOUND *, int32_t, const char *, va_list);']
# Ignore braces inside comments or literals when finding each function's end.
tokens = re.compile(r'/\*[\s\S]*?\*/|//[^\n]*|"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|[{}]')
for name in names:
    pattern = r'^[ \t]*(?:static )?(?:CS_NOINLINE )?[\w *]+\b' + name + r'\([^;]*?\)\s*\{'
    match = re.search(pattern, source, re.M)
    if not match:
        raise ValueError('Missing pinned function: ' + name)
    depth = 1
    for token in tokens.finditer(source, match.end()):
        if token[0] == '{': depth += 1
        if token[0] == '}': depth -= 1
        if depth == 0:
            output.append(source[match.start():token.end()])
            break
    else:
        raise ValueError('Unclosed function: ' + name)
Path('ide-check/runtime.c').write_text('\n'.join(output) + '\n')
