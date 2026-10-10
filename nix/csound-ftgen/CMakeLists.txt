# No parser, opcode registry, libsndfile or audio engine in this executable.
add_executable(csound-ftgen
  ${CMAKE_SOURCE_DIR}/ide-ftgen/main.c
  ${CMAKE_SOURCE_DIR}/ide-ftgen/fgens.c
  ${CMAKE_SOURCE_DIR}/OOps/cmath.c
  ${CMAKE_SOURCE_DIR}/OOps/random.c
  ${CMAKE_SOURCE_DIR}/OOps/fftlib.c
  ${CMAKE_SOURCE_DIR}/OOps/pffft.c
  ${CMAKE_SOURCE_DIR}/OOps/mxfft.c
  ${CMAKE_SOURCE_DIR}/OOps/pvsanal.c
  ${CMAKE_SOURCE_DIR}/Opcodes/ftest.c
  ${CMAKE_SOURCE_DIR}/Opcodes/quadbezier.c)
target_include_directories(csound-ftgen PRIVATE ${libcsound_private_include_dirs} ${libcsound_public_include_dirs})
target_compile_definitions(csound-ftgen PRIVATE __BUILDING_LIBCSOUND)
target_link_options(csound-ftgen PRIVATE -Wl,--error-limit=0,--strip-all,--gc-sections,--max-memory=33554432)

target_compile_options(csound-ftgen PRIVATE -Oz)
