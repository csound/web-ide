sr = 44100 ; sample rate
0dbfs = 1 ; full-scale amplitude
nchnls = 2 ; stereo output
ksmps = 64 ; control rate block size

; Instrument 1 plays a simple sawtooth tone.
; p4 is amplitude and p5 is frequency.
instr 1
    iAmp = p4
    iFreq = p5
    aOut = vco2:a(iAmp, iFreq)
    outall(aOut)
endin