{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.bun
    pkgs.libreoffice
    pkgs.python3
    pkgs.python3Packages.pip
  ];
}
