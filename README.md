# SmartGuard AI

Sistema web de monitoramento inteligente para lojas — MVP com dados e câmeras **simulados**, preparado para futura integração com câmeras IP (RTSP/ONVIF) e visão computacional (YOLO/OpenCV).

> O sistema analisa **eventos e comportamentos**. Não há reconhecimento facial nem declaração automática de crime.

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Lucide, Recharts |
| Backend | Java 21, Spring Boot 4, Spring Security, JPA, Flyway |
| Banco | PostgreSQL 16 |
| IA | Python (estrutura + contrato; simulador na Fase 3) |

## Pré-requisitos

- Node.js 20+
- Java 21+ (ambiente atual: Java 22)
- Docker Desktop (PostgreSQL)
- (Opcional) Python 3.11+ para o módulo `ai/`

## Subir o banco

```bash
docker compose up -d
```

Credenciais padrão (apenas desenvolvimento local):

- DB: `smartguard`
- User: `smartguard`
- Password: `smartguard`
- Porta host: `55432` (mapeada para `5432` no container; evita conflito com Postgres local)

## Backend

```bash
cd backend
./mvnw.cmd spring-boot:run
```

API: `http://localhost:8080`

Endpoints da Fase 1:

- `GET /api/health`
- `GET /api/dashboard/summary`
- `GET /api/cameras`
- `GET /api/cameras/{id}`

Variáveis: veja `backend/.env.example`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

Variáveis: veja `frontend/.env.example`.

## Estrutura

```text
frontend/   # React + Vite
backend/    # Spring Boot API
ai/         # Visão computacional (preparado)
docker-compose.yml
```

## Fases

1. **Fase 1:** estrutura, banco, layout, dashboard via API
2. **Fase 2 (atual):** monitoramento, central de alertas, histórico, CRUD de câmeras
3. **Fase 3:** simulador de eventos + integração + quase tempo real
4. **Fase 4:** login/perfis, testes e documentação final

### Endpoints adicionais (Fase 2)

- `GET /api/alerts` (filtros: type, priority, status, cameraId, from, to, search)
- `GET /api/alerts/{id}`
- `PATCH /api/alerts/{id}/status`
- `POST /api/cameras`
- `PUT /api/cameras/{id}`
- `DELETE /api/cameras/{id}`

## Observações de segurança

- Não versione arquivos `.env` com segredos reais
- Autenticação JWT e controle por perfil entram na Fase 4
- No MVP, `SECURITY_PERMIT_ALL=true` deixa as APIs abertas para desenvolvimento
