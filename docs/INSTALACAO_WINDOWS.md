# Instalação Windows — SmartGuard AI

Aplicativo **standalone** para Windows: interface Electron + API + Vision embutidos.  
Cada instalação tem **banco SQLite criptografado (SQLCipher) próprio**.

## Download (cliente)

1. Baixe o instalador na Release do GitHub: **`SmartGuard-AI-Setup.exe`**
2. Se o SmartScreen aparecer (“Windows protegeu o PC”): **Mais informações → Executar assim mesmo** (o exe ainda não é assinado digitalmente)
3. Instale e abra **SmartGuard AI**
4. Aguarde o splash subir a API (porta `8080`) e o Vision (porta `8090`)
5. No **primeiro acesso**, cadastre o administrador deste PC (e-mail + senha)
6. Não use login demo antigo (`admin@…` / `admin123`) — o Setup atual começa **sem usuários**

Release atual: [GitHub Releases](https://github.com/g-nat4n/Sistena-de-seguran-a/releases) (use a tag mais recente, ex.: v1.3.0).

Download direto do instalador (exemplo 1.3.0):  
`https://github.com/g-nat4n/Sistena-de-seguran-a/releases/download/v1.3.0/SmartGuard-AI-Setup.exe`

## Arquitetura (local independente)

| Neste PC | O que existe |
|----------|--------------|
| App Electron | Interface + login + notificações |
| API local | Sobe junto com o app (`127.0.0.1:8080`) |
| Vision | RTSP / saúde em `127.0.0.1:8090` |
| Banco SQLCipher | `%ProgramData%\SmartGuard\instances\{id}\data\seguranca_inteligente.db` |
| Usuários | Só desta instalação |

Não há sincronização automática entre PCs. Instalar em outro computador cria **outro banco** e **outros logins**.

## Pré-requisitos (PC do cliente)

- Windows 10/11
- **Não** precisa instalar Java nem Python (vêm no Setup)
- Portas livres: `8080` e `8090` (loopback; firewall de LAN normalmente não é necessário)

## O que o Setup inclui

- JRE Temurin 21
- `smartguard-api.jar`
- Pacote Vision + Python embutido
- Interface (renderer) + toast de alerta + centro de notificações (sino)

## Notificações, detecção e evidência

- Toast flutuante no canto do Windows (estilo SmartGuard, com **ATENÇÃO**)
- Dentro do app: ícone de **sino** no topo (lista estilo Facebook)
- Central de Alertas: tela completa de eventos
- Com stream RTSP **iniciado**, a detecção fica ligada (permanência / comportamento anônimo)
- No alerta real: **snapshot** + **clip curto (~6s)** quando houver buffer de frames
- Sem YOLO embutido, o Vision usa fallback HOG (mais fraco que YOLO, mas gera alerta)

## Backup e restauração

- Pela UI: **Status do servidor** → Backup agora (ADMIN)
- Arquivos sob `%ProgramData%\SmartGuard\instances\{id}\data\`
- O arquivo do banco já é SQLCipher (criptografado)

## Atualização

A partir da **1.3.0**, o app verifica atualizações no GitHub Releases automaticamente (banner no topo + botão em **Este PC**).  
Quando a versão baixar: **Reiniciar e atualizar**.

Também funciona o jeito manual:
1. Feche o SmartGuard AI
2. Instale a nova versão do `SmartGuard-AI-Setup.exe` por cima
3. Dados em `ProgramData\SmartGuard\instances\…` **permanecem**

Assinatura digital (SmartScreen): veja `docs/ASSINATURA_CODIGO.md`.

## Encerrar

- Com o padrão atual (`keepApiOnExit: false`), fechar o app **encerra** API e Vision iniciados por ele
- Só uma instância do app fica aberta (segunda abertura foca a janela existente)

## Gerar o instalador (desenvolvimento)

```powershell
.\windows\scripts\package-api.ps1

cd frontend
npm ci
npm run build:electron

cd ..\desktop
Remove-Item -Recurse -Force renderer -ErrorAction SilentlyContinue
Copy-Item -Recurse ..\frontend\dist renderer
npm ci
npm run dist
```

Saída: `desktop\dist\SmartGuard-AI-Setup.exe`

## Serviços Windows (opcional / legado)

Os scripts `install-services.ps1` / WinSW ainda existem para cenários avançados.  
No fluxo recomendado do Setup, **não são obrigatórios** — o Electron sobe API e Vision sozinho.

## Checklist de testes (outro PC)

1. Instalar `SmartGuard-AI-Setup.exe` em Windows limpo  
2. Passar pelo SmartScreen se aparecer  
3. Splash → API/Vision UP  
4. Cadastrar primeiro admin e entrar  
5. Cadastrar câmera RTSP (se houver)  
6. Ver toast + sino de notificação  
7. Fechar e reabrir o app → mesma instalação / mesmos usuários  
8. Desinstalar → dados em `ProgramData` podem permanecer (backup seguro)

## Desinstalação

Desinstale pelo Painel do Windows / atalho do instalador.  
Pastas em `%ProgramData%\SmartGuard` **não** são apagadas automaticamente.
