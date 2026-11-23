## SmartGuard AI 1.2.1

Correcao da conexao RTSP / Vision.

### O que mudou
- Corrige erro 422 ao testar cameras (body JSON para o Vision)
- Bloqueia Host invalido tipo RSV/serie (pede IP local)
- Mensagens de erro mais claras

### Como preencher RTSP
- Host: IP da camera/DVR na rede (ex.: 192.168.1.50) — NAO use codigo RSV
- Porta: normalmente 554
- Path: /cam/realmonitor?channel=1&subtype=0
- Usuario/Senha: login da camera Intelbras

Baixe SmartGuard-AI-Setup.exe, instale por cima e teste de novo.
