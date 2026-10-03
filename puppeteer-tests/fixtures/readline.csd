<CsoundSynthesizer>
<CsOptions>
-odac -m0
</CsOptions>
<CsInstruments>
sr = 48000
ksmps = 32
nchnls = 1
0dbfs = 1

instr 1
  kLine init 0
  Sline, kstatus readline "input> "
  if kstatus == 1 then
    kLine += 1
    printf "Received: [%s]\n", kLine, Sline
  endif
  aSilence init 0
  out aSilence
endin
</CsInstruments>
<CsScore>
i 1 0.2 3600
e
</CsScore>
</CsoundSynthesizer>
