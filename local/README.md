# SmartGuard AI — App local no PC

Pacote para instalar e rodar **tudo no computador da loja**: banco, API, IA e interface.

## Pré-requisito

1. Instale o [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Abra o Docker Desktop e espere ficar **Running**

## Instalação (primeira vez)

1. Clique duas vezes em `INSTALAR.bat`
2. Aguarde o build (pode demorar na 1ª vez)
3. O navegador abre em **http://localhost:3080**
4. Um atalho **SmartGuard AI** é criado na Área de Trabalho

### Login demo

| E-mail | Senha |
|--------|-------|
| `admin@smartguard.local` | `admin123` |

## Uso diário

| Arquivo | Função |
|---------|--------|
| `INICIAR.bat` (ou atalho) | Sobe o app e abre no navegador |
| `PARAR.bat` | Para o app (dados ficam salvos) |
| `DESINSTALAR.bat` | Remove containers (opcional: apaga banco) |

## O que sobe sozinho

- PostgreSQL (banco criado automaticamente + migrações Flyway)
- API Spring Boot
- Serviço de visão (RTSP / detecção)
- Interface web em `http://localhost:3080`

## Câmeras RTSP

Use o IP da câmera na rede local (ex.: `rtsp://admin:senha@192.168.1.64:554/...`).

## YOLO (opcional)

Detecção mais forte (build mais lento/pesado):

```bat
set INSTALL_YOLO=true
docker compose -f docker-compose.local.yml build --no-cache vision
docker compose -f docker-compose.local.yml up -d
```

## Problemas comuns

- **Docker não encontrado** → instale/abra o Docker Desktop
- **Porta 3080 em uso** → feche o outro programa ou altere a porta em `docker-compose.local.yml`
- **Primeira abertura lenta** → aguarde a API ficar saudável (~1 min)
