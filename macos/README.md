# SmartGuard — empacote macOS (Apple Silicon)

Scripts para gerar o **SmartGuard-AI-Mac.dmg** (arm64).

## No Mac / CI

```bash
chmod +x macos/scripts/*.sh
./macos/scripts/build-dmg.sh
```

Ou dispare o workflow **Release Mac (arm64)** no GitHub Actions.

## Saída

`desktop/dist/SmartGuard-AI-Mac.dmg`

## Instalação pelo usuário

Ver [docs/INSTALACAO_MAC.md](../docs/INSTALACAO_MAC.md).
