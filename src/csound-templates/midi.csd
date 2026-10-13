<CsoundSynthesizer>
<CsOptions>
-odac -M0
</CsOptions>
<CsInstruments>
sr = 48000
ksmps = 32
nchnls = 2
0dbfs = 1

; Press Play, then use the Virtual MIDI Keyboard or a MIDI controller.
; Route every MIDI channel to instrument 1. Each note gets its own voice.
massign 0, 1

instr 1
    iFreq = cpsmidi()
    iAmp = ampmidi(0.15)
    aEnvelope = madsr:a(0.01, 0.12, 0.6, 0.25)
    aTone = vco2:a(iAmp, iFreq)
    aFiltered = moogladder:a(aTone, 2400, 0.15)
    outall(aFiltered * aEnvelope)
endin
</CsInstruments>
<CsScore>
; Wait for MIDI notes until you press Stop. No score notes are needed.
f 0 z
</CsScore>
</CsoundSynthesizer>
