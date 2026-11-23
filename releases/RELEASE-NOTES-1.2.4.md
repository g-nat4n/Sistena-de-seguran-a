## SmartGuard AI 1.2.4

Corrige tela branca ao abrir o app no Windows.

### Causa
O frontend estava com caminhos absolutos (`/assets/...`), que nao funcionam no Electron (`file://`).

### Correcao
- Build Electron com base relativa (`./assets/...`)
- Service worker desligado no app desktop
- HashRouter no modo arquivo local

Reinstale esta versao e abra o atalho SmartGuard AI.
