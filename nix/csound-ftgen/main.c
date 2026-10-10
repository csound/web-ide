/* A command instance produces one table, then the host discards its memory.
   Input: count, sample rate, followed by count records of (pfield count,
   named GEN or '-', p1 ... pn). Output: uint32 length then Float64 samples,
   including the guard point. All binary data is little endian (WASM). */
#include "csoundCore.h"
#include "fgens.h"
#include "fftlib.h"
#include <math.h>
#include <stdio.h>

#define MAX_SAMPLES 262144
#define MAX_FIELDS 1024
#define MAX_TABLES 32

char *csoundLocalizeString(const char *s) { return (char *)s; }

static void __attribute__((noreturn)) fail(const char *reason) { fprintf(stderr, "%s\n", reason); exit(1); }
static void *allocate(CSOUND *cs, size_t n) {
  if (n > 16 * 1024 * 1024) fail("Preview allocation limit exceeded.");
  void *p = malloc(n); if (!p) fail("Preview memory limit exceeded."); return p;
}
static void *zero_allocate(CSOUND *cs, size_t n) {
  void *p = allocate(cs, n); memset(p, 0, n); return p;
}
static void *resize(CSOUND *cs, void *p, size_t n) {
  if (n > 16 * 1024 * 1024) fail("Preview allocation limit exceeded.");
  p = realloc(p, n); if (!p) fail("Preview memory limit exceeded."); return p;
}
static void release(CSOUND *cs, void *p) { free(p); }
static void message(CSOUND *cs, const char *fmt, ...) {
  va_list args; va_start(args, fmt); vfprintf(stderr, fmt, args); va_end(args);
}
void csoundMessage(CSOUND *cs, const char *fmt, ...) {
  va_list args; va_start(args, fmt); vfprintf(stderr, fmt, args); va_end(args);
}
void csoundErrorMsg(CSOUND *cs, const char *fmt, ...) {
  va_list args; va_start(args, fmt); vfprintf(stderr, fmt, args); va_end(args);
}
static void error(CSOUND *cs, const char *prefix, const char *fmt, va_list args) {
  fputs(prefix, stderr); vfprintf(stderr, fmt, args); fputc('\n', stderr);
}
static int32_t init_error(CSOUND *cs, const char *fmt, ...) {
  va_list args; va_start(args, fmt); vfprintf(stderr, fmt, args); va_end(args); return -1;
}
static void __attribute__((noreturn)) fatal(CSOUND *cs, const char *fmt, ...) { fail(fmt); }
static void __attribute__((noreturn)) jump(CSOUND *cs, int32_t code) { fail("GEN failed."); }
extern int32_t csoundFtError(const FGDATA *, const char *, ...);
extern int32_t allocgen(CSOUND *, char *, GEN);
extern NGFENS *ftest_fgens_init(CSOUND *);
extern NGFENS *quadbezier_fgens_init(CSOUND *);

int main(void) {
  unsigned count, fields;
  double sr;
  if (scanf("%u %lf", &count, &sr) != 2 || !count || count > MAX_TABLES ||
      !isfinite(sr) || sr < 8000 || sr > 384000) fail("Invalid preview request.");
  CSOUND *cs = calloc(1, sizeof(CSOUND));
  if (!cs) fail("Preview memory limit exceeded.");
  cs->Malloc = allocate; cs->Calloc = zero_allocate; cs->ReAlloc = resize; cs->Free = release;
  cs->Message = message; cs->Warning = message; cs->ErrorMsg = message;
  cs->ErrMsgV = error; cs->InitError = init_error; cs->Die = fatal; cs->LongJmp = jump;
  cs->FtError = csoundFtError; cs->FTFind = csoundFTFind;
  cs->oparms = &cs->oparms_; cs->esr = sr; cs->onedsr = 1 / sr;
  cs->e0dbfs = 1; cs->A4 = 440; cs->sinelength = 16384; cs->genmax = GENMAX + 1;
  cs->randSeed1 = 15937; cs->randSeed2 = 12345; cs->csRandState = &cs->randState_;
  csoundSeedRandMT(&cs->randState_, NULL, 5489);
  cs->Rand31 = csoundRand31; cs->RandMT = csoundRandMT;
  cs->RealFFT = csoundRealFFT2; cs->RealFFTSetup = csoundRealFFT2Setup;
  cs->GetInverseRealFFTScale = csoundGetInverseRealFFTScale;
  NGFENS *lists[] = { ftest_fgens_init(cs), quadbezier_fgens_init(cs) };
  for (unsigned l = 0; l < 2; l++)
    for (NGFENS *g = lists[l]; g->name; g++) allocgen(cs, g->name, g->fn);
  FUNC *table = NULL;
  for (unsigned i = 0; i < count; i++) {
    char name[32];
    cs_float p[MAX_FIELDS + 2] = {0};
    if (scanf("%u %31s", &fields, name) != 2 || fields < 5 || fields > MAX_FIELDS)
      fail("Invalid GEN parameters.");
    for (unsigned j = 1; j <= fields; j++) {
      double value;
      if (scanf("%lf", &value) != 1 || !isfinite(value) || fabs(value) > 1e9)
        fail("Use finite numeric GEN parameters within the preview limits.");
      p[j] = value;
    }
    if (p[1] < 0 || p[1] > 65535 || p[1] != floor(p[1]) ||
        fabs(p[3]) > MAX_SAMPLES || p[3] != floor(p[3]) ||
        (p[3] == 0 && abs((int)p[4]) != 2) || p[4] != floor(p[4]) || fabs(p[4]) > GENMAX)
      fail("Preview supports table numbers 0–65535 and up to 262144 samples.");
    /* Named routines access optional fields directly; the zero-filled array
       supplies the same defaults as a score event. Whitelist the small set. */
    if (strcmp(name, "-")) {
      if (strcmp(name, "tanh") && strcmp(name, "exp") && strcmp(name, "sone") && strcmp(name, "quadbezier"))
        fail("This named GEN is not available in the preview.");
      p[4] = SSTRCOD;
    }
    EVTBLK event = {0}; event.opcod = 'f'; event.pcnt = fields; event.p = p;
    event.strarg = strcmp(name, "-") ? name : NULL;
    event.p2orig = p[2]; event.p3orig = p[3];
    if (csoundFTCreate(cs, &table, &event, 1) || !table) return 1;
    if (!table->flen || table->flen > MAX_SAMPLES) fail("Table exceeds the preview limit.");
  }
  uint32_t length = table->flen;
  for (unsigned i = 0; i <= length; i++)
    if (!isfinite(table->ftable[i])) fail("GEN produced a non-finite sample.");
  fwrite(&length, sizeof(length), 1, stdout);
  for (unsigned i = 0; i <= length; i++) {
    double value = table->ftable[i]; fwrite(&value, sizeof(value), 1, stdout);
  }
  return ferror(stdout) ? 1 : 0;
}
