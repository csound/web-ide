instr LoopControl
  iCount = 0

  while iCount < 8 do
    if iCount == 2 then
      iCount += 1
      continue
    endif

    if iCount == 6 then
      break
    endif

    printk2 iCount
    iCount += 1
  od
endin