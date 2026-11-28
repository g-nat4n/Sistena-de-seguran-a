# Instalação macOS — SmartGuard AI

Aplicativo **standalone** para MacBook **Apple Silicon** (M1/M2/M3/M4): Electron + API + Vision embutidos.

## Download

Release mais recente (DMG):

https://github.com/g-nat4n/Sistena-de-seguran-a/releases

Arquivo: **`SmartGuard-AI-Mac.dmg`** (arm64)

## Instalação

1. Baixe o `.dmg` e abra
2. Arraste **SmartGuard AI** para a pasta **Aplicativos**
3. Na **primeira abertura**, o macOS pode bloquear (app sem assinatura Apple):
   - Clique com o botão direito no app → **Abrir** → **Abrir**
   - Ou: Ajustes do Sistema → Privacidade e Segurança → **Abrir mesmo assim**
4. No primeiro acesso, cadastre o administrador local
5. Cadastre as câmeras RTSP e inicie o stream

## Pré-requisitos

- macOS 13 Ventura ou superior
- Apple Silicon (arm64) — **não** há build Intel nesta versão
- ~3 GB livres em disco
- Portas livres `8080` e `8090` (loopback)
- Rede local até as câmeras

## Dados locais

Ficam em:

`~/Library/Application Support/smartguard-desktop/SmartGuard/instances/{id}/data/`

Banco SQLite com SQLCipher (chave em `.dbkey` no data dir).

## Observações

- Sem certificado Apple Developer, o Gatekeeper exige “Abrir” manual na 1ª vez
- Detecção YOLO/pose pode exigir `ultralytics` (pesado); o pacote base usa OpenCV HOG
- Telegram/e-mail: configure em **Configurações** (ADMIN)

## Atualização

Baixe o novo DMG e substitua o app em Aplicativos. Os dados da instância local permanecem.
