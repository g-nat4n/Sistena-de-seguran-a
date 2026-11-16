# SmartGuard AI — Módulo de Visão Computacional

Este módulo é **independente** do backend Java e do frontend React.

## Escopo atual

- **Fase A:** FastAPI para testar/iniciar/parar RTSP Intelbras
- **Fase B:** detecção anônima de pessoas (YOLO/HOG) + tracking + ingestão de alertas
- Simulador de eventos comportamentais
- Protótipo de movimento (webcam local)
- ByteTrack avançado e áreas restritas: próxima fase

## O que este módulo NÃO faz

- Não realiza reconhecimento facial
- Não identifica pessoas por biometria
- Não declara automaticamente que alguém cometeu um crime
- Ainda não faz preview HLS/WebRTC no painel (só status de conexão na Fase A)

## Estrutura

```text
ai/
  app/                 # FastAPI (Vision Service)
    main.py
    rtsp/              # probe + stream manager
  src/
    detection/         # motion / stubs YOLO
    simulation/        # gerador de eventos fictícios
    integrations/      # cliente HTTP
```

## Vision Service (RTSP)

```bash
cd ai
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8090
```

Health: `http://127.0.0.1:8090/health`

Guia Intelbras: `docs/INTELBRAS_RTSP.md`

## Como rodar o simulador (Fase 3)

```bash
cd ai
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install requests python-dotenv
python src/simulation/event_generator.py --count 2 --camera CAM-ENT-01
```

O script envia eventos para `POST /api/simulation/ingest` no backend.

## Protótipo de movimento (OpenCV)

Detecta movimento anônimo na webcam — **sem rostos / sem identificar pessoas**.

```bash
cd ai
.venv\Scripts\activate
pip install opencv-python numpy requests python-dotenv
python src/detection/webcam_motion_watch.py --show
```

No frontend, em **Monitoramento → Câmera deste dispositivo**, ative
**Detecção automática de movimento** para o protótipo no navegador.

## Endpoints relacionados no backend

- `POST /api/simulation/events`
- `POST /api/simulation/events/batch`
- `POST /api/simulation/ingest`

