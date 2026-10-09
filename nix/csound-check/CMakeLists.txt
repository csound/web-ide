# Included after the pinned Csound project has configured its static library.
add_executable(csound-metadata ${CMAKE_SOURCE_DIR}/ide-check/metadata.c)
target_link_libraries(csound-metadata PRIVATE ${CSOUNDLIB})
target_include_directories(csound-metadata PRIVATE ${libcsound_private_include_dirs} ${libcsound_public_include_dirs})
target_compile_definitions(csound-metadata PRIVATE __BUILDING_LIBCSOUND)

set(parser_objects
  csound_messages.c.obj getstring.c.obj threads.c.obj corfiles.c.obj
  csound_type_system.c.obj csound_standard_types.c.obj csound_data_structures.c.obj
  csound_orclex.c.obj csound_orcparse.c.obj csound_prelex.c.obj
  csound_orc_semantics.c.obj csound_orc_expressions.c.obj csound_orc_optimize.c.obj
  csound_orc_structs.c.obj new_orc_parser.c.obj symbtab.c.obj opcode.c.obj
  opcode_deprecation.c.obj memalloc.c.obj environ.c.obj namedins.c.obj csound_orc_compile.c.obj)
add_custom_command(OUTPUT ${CMAKE_BINARY_DIR}/checker-core.a
  COMMAND ${CMAKE_COMMAND} -E make_directory ${CMAKE_BINARY_DIR}/parser-objects
  COMMAND ${CMAKE_COMMAND} -E chdir ${CMAKE_BINARY_DIR}/parser-objects ${CMAKE_AR} x $<TARGET_FILE:${CSOUNDLIB}> ${parser_objects}
  COMMAND ${CMAKE_COMMAND} -E chdir ${CMAKE_BINARY_DIR}/parser-objects ${CMAKE_AR} qc ${CMAKE_BINARY_DIR}/checker-core.a ${parser_objects}
  DEPENDS ${CSOUNDLIB})
add_custom_target(checker-core DEPENDS ${CMAKE_BINARY_DIR}/checker-core.a)
add_executable(csound-check ${CMAKE_SOURCE_DIR}/ide-check/check.c ${CMAKE_SOURCE_DIR}/ide-check/runtime.c ${CMAKE_SOURCE_DIR}/ide-check/declarations.c)
add_dependencies(csound-check checker-core)
target_include_directories(csound-check PRIVATE ${libcsound_private_include_dirs} ${libcsound_public_include_dirs} ${CMAKE_BINARY_DIR})
target_compile_definitions(csound-check PRIVATE __BUILDING_LIBCSOUND)
target_link_libraries(csound-check PRIVATE ${CMAKE_BINARY_DIR}/checker-core.a ${libcsound_LIBS})
target_link_options(csound-check PRIVATE
  -Wl,--strip-all,--max-memory=67108864)

# Small metadata reader and a test plugin, using the same Csound ABI as the checker.
foreach(plugin plugin-types plugin-types-fixture)
  add_executable(${plugin} ${CMAKE_SOURCE_DIR}/ide-check/${plugin}.c)
  target_include_directories(${plugin} PRIVATE ${libcsound_public_include_dirs})
  target_compile_options(${plugin} PRIVATE -fPIC)
  target_link_options(${plugin} PRIVATE -nostdlib -nostartfiles
    -Wl,--shared,--experimental-pic,--no-entry,--import-table,--import-memory,--import-undefined
    -Wl,--export=__wasm_call_ctors,--export=csoundModuleInit,--export=csoundModuleInfo
    -Wl,--export-if-defined=csoundModuleCreate,--strip-all)
endforeach()
