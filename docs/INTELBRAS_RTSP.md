# Configurar câmera Intelbras via RTSP no SmartGuard

## Visão geral

O SmartGuard guarda host/path/usuário e **senha criptografada** no backend.  
A senha **nunca** volta para o frontend nem aparece em logs.

O serviço Python (`ai/app`) testa e mantém o stream RTSP.

## Pré-requisitos

1. Câmera/DVR/NVR Intelbras na mesma rede (ou VPN)
2. RTSP habilitado no equipamento
3. Usuário com permissão de streaming
4. Serviços no ar:
   - PostgreSQL (`docker compose up -d`)
   - Backend Spring (`8080`)
   - Vision Service FastAPI (`8090`)
   - Frontend (`5173`)

## Path RTSP típico (Intelbras)

Exemplos comuns (confirme no manual do modelo):

```text
rtsp://USUARIO:SENHA@IP:554/cam/realmonitor?channel=1&subtype=0
```

- `channel=1` → canal da câmera
- `subtype=0` → stream principal
- `subtype=1` → substream (mais leve, bom para teste)

No formulário do SmartGuard, separe assim:

| Campo | Exemplo |
|-------|---------|
| Host | `192.168.1.50` |
| Porta | `554` |
| Path | `/cam/realmonitor?channel=1&subtype=0` |
| Usuário | `admin` |
| Senha | (sua senha) |

## Passo a passo no sistema

1. Faça login (`admin@smartguard.local` / `admin123`)
2. Em **Câmeras**, cadastre a câmera (nome, identificação, localização)
3. Em **Monitoramento → Abrir** a câmera
4. Preencha o bloco **RTSP Intelbras** e clique em **Salvar RTSP**
5. Clique em **Testar conexão**
6. Se OK, clique em **Iniciar stream**
7. Acompanhe o status: `CONNECTED`, `RECONNECTING`, `ERROR`, etc.

## Subir o Vision Service

```bash
cd ai
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8090
```

Variáveis (opcional, `.env` em `ai/`):

```env
VISION_SERVICE_TOKEN=smartguard-vision-dev-token
SMARTGUARD_API_URL=http://localhost:8080/api
```

No backend (`backend/.env` ou ambiente):

```env
VISION_BASE_URL=http://127.0.0.1:8090
VISION_SERVICE_TOKEN=smartguard-vision-dev-token
CRYPTO_SECRET=SmartGuardCryptoDevKey_ChangeInProd_32b
```

## Troubleshooting

| Sintoma | O que verificar |
|---------|-----------------|
| Serviço de visão indisponível | FastAPI na porta 8090 |
| Não foi possível abrir o stream | IP/porta/path/usuário/senha |
| Timeout | Firewall, VLAN, RTSP TCP |
| Funciona no VLC e falha aqui | Teste com `subtype=1` (substream) |
| Reconectando sempre | Cabo/rede/câmera sobrecarregada |

### Teste rápido no VLC

Abra o VLC → Mídia → Abrir localização de rede e cole a URL RTSP completa.  
Se o VLC não abrir, o SmartGuard também não conseguirá.

## Fase B/C — Detecção anônima + comportamento

Com o stream **iniciado**, o Vision Service:

1. Lê frames do RTSP
2. Detecta pessoas + pose com YOLO (`yolov8n-pose`) — fallback caixa/HOG
3. Tracking anônimo por centróide
4. Regras comportamentais:
   - `UNUSUAL_DWELL` — muito tempo quase parado (loitering)
   - `POSSIBLE_CONCEALMENT` — padrão mão→tronco/quadril (suspeita de ocultação)
   - `SUSPICIOUS_MOVEMENT` — presença de pessoa (cooldown maior)
5. Snapshot anotado em `ai/data/evidence` → backend (`simulated=false`)

**Não** há reconhecimento facial. **Não** declara furto/crime automaticamente — só sinaliza para revisão humana.

Variáveis úteis:

```env
DETECTION_ENABLED=true
DETECTION_EVERY_N_FRAMES=5
YOLO_POSE_MODEL=yolov8n-pose.pt
YOLO_CONFIDENCE=0.45
LOITERING_SECONDS=25
LOITERING_MAX_DISPLACEMENT_PX=70
CONCEALMENT_MIN_FRAMES=3
ALERT_COOLDOWN_SECONDS=45
```

## Segurança

- Não versione senhas reais
- Troque `CRYPTO_SECRET` e `VISION_SERVICE_TOKEN` em produção
- Prefira usuário RTSP dedicado (não o admin global, se possível)
- Não compartilhe prints com URL completa contendo senha

