<CsoundSynthesizer>
<CsOptions>
-o dac
-i adc
-Ma
--midi-key-cps=4
--midi-velocity-amp=5
-o csound_output.wav
</CsOptions>
<CsInstruments>
instr 1
  asig oscil 0.5, 440
  out asig
endin
</CsInstruments>
<CsScore>
i 1 0 2
</CsScore>
</CsoundSynthesizer>
