# Deploy SmartGuard (Vercel + Render)

## Arquitetura

| Peça | Onde |
|------|------|
| Frontend | Vercel |
| API Spring | Render (`smartguard-api`) |
| Postgres | Render (`smartguard-db`) |
| Vision (RTSP/detecção) | Render (`smartguard-vision`) |

> Câmeras RTSP na rede local da loja **não** ficam acessíveis da nuvem sem VPN/túnel. Na nuvem você testa cadastro, login, simulador e webcam (HTTPS). RTSP real: local ou VPS na mesma rede.

## 1) Backend no Render

1. Abra [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
2. Conecte o GitHub `g-nat4n/Sistena-de-seguran-a` e use o `render.yaml`
3. Após o deploy, anote a URL da API, ex.: `https://smartguard-api.onrender.com`
4. Em **smartguard-api** → Environment:
   - `CORS_ORIGINS` = URL da Vercel (ex.: `https://seu-app.vercel.app`)
5. Em **smartguard-vision** → Environment:
   - `VISION_SERVICE_TOKEN` = **o mesmo** valor da API
   - `SMARTGUARD_API_URL` = `https://smartguard-api.onrender.com/api`
6. Health checks:
   - API: `GET /api/health`
   - Vision: `GET /health`

Free tier do Render pode “dormir” após inatividade (cold start ~1 min).

## 2) Frontend na Vercel

```bash
cd frontend
npx vercel login
npx vercel
```

Environment Variable na Vercel:

| Name | Value |
|------|--------|
| `VITE_API_BASE_URL` | `https://smartguard-api.onrender.com/api` |

Redeploy depois de salvar a variável.

Ou pelo dashboard: Import Git Repo → root `frontend` → add env → Deploy.

## 3) Alternativa VPS (tudo junto)

```bash
export CORS_ORIGINS=https://seu-front.vercel.app
export JWT_SECRET=...
export CRYPTO_SECRET=...
export VISION_SERVICE_TOKEN=...
docker compose -f docker-compose.prod.yml up -d --build
```

## Contas demo

- `admin@smartguard.local` / `admin123`
