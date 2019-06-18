# A shellfile for nixos users
with import <nixpkgs> {};

stdenv.mkDerivation {
  name = "web-ide";
  buildInputs = with pkgs; [ electron ];
  shellHook = ''
  # cmd: sh -c patchElectron
  patchElectron () {
    stat node_modules/electron/dist/electron &>/dev/null
    cp -f ${electron}/bin/electron node_modules/electron/dist/electron
  }
  export -f patchElectron
  '';
}
