"""Keep the native numeric GEN routines, without file readers or graph windows.

Fail on source drift. No GEN mathematics is rewritten: the pinned Csound source
and its LGPL headers remain in the generated translation units.
"""
from pathlib import Path
import re
source = Path('Engine/fgens.c').read_text()
tokens = re.compile(r'/\*[\s\S]*?\*/|//[^\n]*|"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|[{}]')
def replace_body(source, name, replacement):
    pattern = r'^[ \t]*(?:static )?(?:CS_NOINLINE )?[\w *]+\b' + name + r'\([^;]*?\)\s*(?:/\*[\s\S]*?\*/\s*)*\{'
    match = re.search(pattern, source, re.M)
    if not match: raise ValueError('Missing function: ' + name)
    depth = 1
    for token in tokens.finditer(source, match.end()):
        if token[0] == '{': depth += 1
        if token[0] == '}': depth -= 1
        if depth == 0:
            return source[:match.end()] + '\n' + replacement + '\n}' + source[token.end():]
    raise ValueError('Unclosed function: ' + name)
for name in ['gen01', 'gen23', 'gen28', 'gen43', 'gen44', 'gen49']:
    source = replace_body(source, name, 'return csoundFtError(ff, "File-based GEN routines are not available in this preview.");')
source = replace_body(source, 'gen01_defer_load', 'return NULL;')
# Named GENs read their optional slots directly. Preserve the event's actual
# argument count but give its copied pfield buffer zero-filled trailing slots.
allocation = 'sizeof(cs_float) * (evtblkp->pcnt + 2)'
assert source.count(allocation) == 1
source = source.replace(allocation, 'sizeof(cs_float) * (evtblkp->pcnt + 8)')
start = source.index('    if (!csound->oparms->displays)')
end = source.index('\n}', start)
source = source[:start] + source[end:]
Path('ide-ftgen/fgens.c').write_text(source)
