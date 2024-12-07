<CsoundSynthesizer>
<CsOptions>
</CsOptions>
<CsInstruments>
0dbfs=1
nchnls=2

instr 1
  asig vco2 p4, p5
  aenv linenr asig,0.01,0.1,0.01
  out aenv, aenv
endin

event_i "i", 1, 0, 2, 0dbfs/2, A4
event_i "e", 0, 2.5

</CsInstruments>
<CsScore>
</CsScore>
</CsoundSynthesizer>