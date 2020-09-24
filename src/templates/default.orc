sr=44100
ksmps=32
0dbfs=1
nchnls=2

instr 1

  iamp = ampdbfs(p5)
  ipch = cps2pch(p4,12)
  ipan = 0.5
  
  asig = vco2(iamp, ipch)
  al, ar pan2 asig, ipan
  
  out(al, ar)
endin
