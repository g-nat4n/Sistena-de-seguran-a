# SmartGuard AI — Módulo de Visão Computacional

Este módulo é **independente** do backend Java e do frontend React.

## Escopo atual (MVP)

- Estrutura preparada para detecção com YOLO + OpenCV + ByteTrack
- Simulador de eventos comportamentais (sem câmeras físicas)
- Interface de integração para enviar resultados ao backend

## O que este módulo NÃO faz

- Não realiza reconhecimento facial
- Não identifica pessoas por biometria
- Não declara automaticamente que alguém cometeu um crime
- Não conecta a streams RTSP reais nesta etapa

## Estrutura

```text
ai/
  src/
    detection/      # stubs YOLO / tracking
    simulation/     # gerador de eventos fictícios
    services/       # orquestração
    models/         # contratos de dados
    integrations/   # cliente HTTP para o backend
```

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

