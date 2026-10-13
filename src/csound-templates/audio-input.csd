<CsoundSynthesizer>
<CsOptions>
-odac -iadc
</CsOptions>
<CsInstruments>
sr = 48000
ksmps = 32
nchnls = 2
nchnls_i = 1
0dbfs = 1

; Use headphones and a low listening level to avoid microphone feedback.
; Press Play and allow microphone access when the browser asks.
instr 1
    aInput = inch:a(1)
    aClean = dcblock2:a(aInput)

    ; Adjust the cutoff (Hz) and output gain to change the sound.
    kCutoff = 1800
    kGain = 0.3
    aFiltered = tone:a(aClean, kCutoff)
    aOutput = limit:a(aFiltered * kGain, -0.8, 0.8)
    outall(aOutput)
endin
</CsInstruments>
<CsScore>
; Process live input until you press Stop.
i 1 0 -1
f 0 z
</CsScore>
</CsoundSynthesizer>
