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

A implementação do simulador e da integração ocorre na **Fase 3**.
