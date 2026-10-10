{ system ? builtins.currentSystem }:
let
  pkgs = import (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/4db2c220f32fd162658ed1b7bb2f46a82996ddbe.tar.gz";
    sha256 = "08b1k0zrbal2if94bph2ap9f73zlplsh05a65jbdkp5ipycmg92s";
  }) { inherit system; };
  source = builtins.fetchTarball {
    url = "https://github.com/csound/csound/archive/1908f26f51f08b21e69d5f083a63d0a15033feff.tar.gz";
    sha256 = "0dn5b17hp5z2f2bsgs2b06n7k9j60ch827g40dgyjiv8bqk5c4v7";
  };
  base = import "${source}/platform/wasm-wasi/src/csound.nix" { inherit pkgs system; };
in base.overrideAttrs (old: {
  pname = "csound-check";
  patches = (old.patches or []) ++ [ ./csound-check/editor-parser.patch ];
  nativeBuildInputs = old.nativeBuildInputs ++ [ pkgs.python3 ];
  postPatch = ''
    cp -r ${./csound-check} ide-check
    chmod -R u+w ide-check
    python ide-check/runtime.py
    cat ide-check/CMakeLists.txt >> CMakeLists.txt
    cp -r ${./csound-ftgen} ide-ftgen
    chmod -R u+w ide-ftgen
    python ide-ftgen/prepare.py
    cat ide-ftgen/CMakeLists.txt >> CMakeLists.txt
    substituteInPlace Engine/new_orc_parser.c \
      --replace-fail 'csoundLoadRequestedPlugins(csound)' '0'
  '';
  cmakeFlags = old.cmakeFlags ++ [ "-DBUILD_MULTI_CORE=OFF" ];
  NIX_CFLAGS_COMPILE = old.NIX_CFLAGS_COMPILE ++ [ "-Os" "-ffunction-sections" "-fdata-sections" ];
  buildPhase = ''
    runHook preBuild
    cmake --build . --parallel "$NIX_BUILD_CORES" --target csound-metadata
    wasmtime run -Wexceptions=y -Ccache=n ./csound-metadata > signatures.h
    test "$(wc -l < signatures.h)" -gt 1000
    cmake --build . --parallel "$NIX_BUILD_CORES" --target csound-check plugin-types plugin-types-fixture csound-ftgen
    printf 'prints "MUST NOT RUN"\ninstr 1\na1 = oscili(0.1, 440)\nendin\n' > valid.orc
    wasmtime run -Wexceptions=y -Ccache=n --dir=. ./csound-check valid.orc > valid.log 2>&1
    ! grep -q 'MUST NOT RUN' valid.log
    printf 'instr 1\na1 = oscili(0.1, )\nendin\n' > invalid.orc
    status=0
    wasmtime run -Wexceptions=y -Ccache=n --dir=. ./csound-check invalid.orc > invalid.log 2>&1 || status=$?
    test "$status" -eq 1
    grep -q 'line 2' invalid.log
    printf '1 48000\n5 - 1 0 8 10 1\n' | wasmtime run -Wexceptions=y -Ccache=n ./csound-ftgen > table.bin
    python -c 'import struct; b=open("table.bin", "rb").read(); assert len(b)==76; assert struct.unpack_from("<I", b)[0]==8; assert abs(struct.unpack_from("<d", b, 20)[0]-1)<1e-12'
    test "$(wc -c < csound-ftgen)" -lt 200000
    runHook postBuild
  '';
  installPhase = ''
    mkdir -p $out
    cp csound-ftgen $out/csound-ftgen.wasm
    cp csound-check $out/csound-check.wasm
    cp plugin-types $out/plugin-types.wasm
    cp plugin-types-fixture $out/plugin-types-fixture.wasm
  '';
  postInstall = "";
})
