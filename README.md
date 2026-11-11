# SmartGuard AI

Sistema web de monitoramento inteligente para lojas — MVP com dados e câmeras **simulados**, preparado para futura integração com câmeras IP (RTSP/ONVIF) e visão computacional (YOLO/OpenCV).

> O sistema analisa **eventos e comportamentos**. Não há reconhecimento facial nem declaração automática de crime.

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Lucide, Recharts |
| Backend | Java 21, Spring Boot 4, Spring Security (JWT), JPA, Flyway |
| Banco | PostgreSQL 16 |
| IA | Python (simulador + stubs YOLO/OpenCV) |

## Pré-requisitos

- Node.js 20+
- Java 21+
- Docker Desktop (PostgreSQL)
- (Opcional) Python 3.11+ para o módulo `ai/`

## Subir o banco

```bash
docker compose up -d
```

Credenciais padrão (apenas desenvolvimento local):

- DB: `smartguard`
- User / Password: `smartguard` / `smartguard`
- Porta host: `55432`

## Backend

```bash
cd backend
./mvnw.cmd spring-boot:run
```

API: `http://localhost:8080`

### Contas demo

Senha de todos: `admin123`

| E-mail | Perfil |
|--------|--------|
| admin@smartguard.local | ADMIN |
| gerente@smartguard.local | MANAGER |
| operador@smartguard.local | OPERATOR |

## Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

## Simulador Python

```bash
cd ai
python -m venv .venv
.venv\Scripts\activate
pip install requests python-dotenv
python src/simulation/event_generator.py --count 2 --camera CAM-ENT-01
```

## Estrutura

```text
frontend/   # React + Vite
backend/    # Spring Boot API
ai/         # Visão computacional (preparado) + simulador
docker-compose.yml
```

## Fases

1. Estrutura, banco, layout, dashboard
2. Monitoramento, alertas, histórico, CRUD de câmeras
3. Simulador de eventos + ingestão Python + polling
4. Login JWT, perfis, configurações e documentação

## Segurança

- JWT nas APIs protegidas
- Senhas com BCrypt
- Perfis: ADMIN, MANAGER, OPERATOR
- Não versione `.env` com segredos reais
- Defina `JWT_SECRET` próprio em produção

## Endpoints principais

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard/summary`
- `GET /api/alerts` / `PATCH /api/alerts/{id}/status`
- `GET|POST|PUT|DELETE /api/cameras`
- `POST /api/simulation/events` / `ingest` / `events/batch`
- `GET /api/settings/store`
