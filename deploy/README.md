# Despliegue de Agent OS Console en un VPS (Docker)

Runbook integral para publicar la aplicación bajo una URL propia.
Todo el stack corre en Docker con un único comando de despliegue.

---

## 1. Arquitectura del stack

```
                      Internet
                         │
                    :80 / :443
                         │
                ┌────────┴────────┐
                │  caddy (host)   │  ← TLS automático (Let's Encrypt)
                │  deploy/Caddyfile│
                └────────┬────────┘
     ?XTransformPort=3003│      resto (/, /api/*)
           ┌─────────────┴──────────────┐
           ▼                            ▼
  ┌─────────────────┐          ┌──────────────────┐
  │ engine (bun)    │          │ app (node)       │
  │ topology-engine │          │ Next.js 16       │
  │ socket.io :3003 │          │ standalone :3000 │
  │ solo 127.0.0.1  │          │ solo 127.0.0.1   │
        │  read-only              │  read-write
        └──────────┬──────────────┘
              ┌────┴─────┐
              │ SQLite   │  data/db/custom.db (bind mount del host)
              └──────────┘
```

- **app** — la consola completa (Instanciador Zero-Shot incluido). Se construye
  multi-stage: `bun` compila (bun.lock + prisma generate + next build) y
  `node:22` ejecuta el standalone de forma nativa.
- **engine** — `mini-services/topology-engine` (socket.io :3003). Requiere bun
  en runtime porque usa `bun:sqlite` en modo lectura. Lee la MISMA base que
  app, montada read-only.
- **caddy** — gateway público. Réplica exacta del gateway del entorno de
  desarrollo: la query `?XTransformPort=<puerto>` enruta a ese mini-servicio
  (así funciona la Topología Viva en vivo); todo lo demás va a la app.
  Los puertos 3000/3003 solo escuchan en `127.0.0.1`: no se exponen a internet.

## 2. Requisitos

| Requisito | Detalle |
|---|---|
| VPS | Ubuntu 22.04/24.04 o Debian 12 · 2 vCPU · 2 GB RAM (con 2 GB de swap para el build) · 10 GB disco |
| Puertos abiertos | 22 (SSH), 80 y 443 (web) |
| Dominio (opcional) | Registro A `tu-sub.dominio.com` → IP del VPS. Sin dominio: HTTP directo sobre la IP |
| En la máquina que despliega | `ssh`, `rsync` y acceso al repo |

## 3. Despliegue (una línea)

Desde la raíz del repo (máquina con acceso SSH al VPS):

```bash
./deploy/deploy.sh usuario@IP-DEL-VPS [puerto]
```

El script hace todo: rsync del repo → siembra inicial (DB con el historial
real, plantilla `.z-ai-config`, `deploy/.env`) → instala Docker si falta →
`docker compose up -d --build` → verificación. Primer build: 2-5 min.

### Despliegue manual (equivalente)

```bash
# 1) Subir el repo
rsync -az --delete --exclude-from=deploy/rsync.exclude ./ usuario@IP:/opt/agent-os/

# 2) En el VPS
ssh usuario@IP
cd /opt/agent-os
mkdir -p data/db secrets
cp deploy/.env.example deploy/.env && nano deploy/.env   # SITE_ADDR + GITHUB_TOKEN
# colocar secrets/.z-ai-config (ver §5)
curl -fsSL https://get.docker.com | sh                    # solo si falta Docker
docker compose -f deploy/docker-compose.yml up -d --build
```

## 4. Publicar bajo tu URL (SITE_ADDR)

`deploy/.env` en el VPS define `SITE_ADDR`:

- **`SITE_ADDR=:80`** (default) → la app queda en `http://IP-DEL-VPS/`.
- **`SITE_ADDR=agentos.tudominio.com`** → crea el registro A
  `agentos.tudominio.com → IP` en tu proveedor DNS y reinicia el gateway:

```bash
docker compose -f deploy/docker-compose.yml restart caddy
docker compose -f deploy/docker-compose.yml logs -f caddy   # ver la emisión TLS
```

Caddy emite y renueva el certificado Let's Encrypt solo (80→443 redirect
automático). La Topología Viva (websocket) funciona igual bajo HTTPS: el
gateway reenvia `?XTransformPort=3003` al engine.

## 5. Layer L2 (LLM) en el VPS — importante

La app se apoya en `z-ai-web-dev-sdk`, que lee su credencial del archivo
`.z-ai-config` (JSON `{"baseUrl": "...", "apiKey": "..."}`) buscando en cwd,
`$HOME` o `/etc/`. En el stack Docker se monta desde **`secrets/.z-ai-config`**.

- El endpoint usado en el entorno de desarrollo (`internal-api.z.ai`) es una
  IP **interna de esa nube** (172.25.136.213): un VPS externo NO puede
  alcanzarlo. `deploy.sh` lo copia solo como plantilla.
- Para el **L2 completo** (Instanciador con generación LLM real, `mejorate`
  synthesize, `investiga`, `radiografia`, inferencia del engine), coloca en el
  VPS un endpoint **público** con tu propia API key:

```bash
# en el VPS
echo '{"baseUrl":"https://api.z.ai/api/paas/v4","apiKey":"TU-API-KEY"}' \
  > /opt/agent-os/secrets/.z-ai-config
chmod 600 /opt/agent-os/secrets/.z-ai-config
docker compose -f /opt/agent-os/deploy/docker-compose.yml restart app engine
```

- Sin este archivo (o con endpoint inalcanzable), la app **funciona igual**
  (UI, topología, bucle con fallbacks deterministas, ZIP del Instanciador con
  degradación declarada por archivo): cada pérdida se declara honestamente
  (Regla P2), nada se inventa.

## 6. Operación

```bash
cd /opt/agent-os
DC="docker compose -f deploy/docker-compose.yml"

$DC ps                       # estado
$DC logs -f app              # logs de la app (Ctrl+C para salir)
$DC logs -f engine           # logs del engine
$DC logs -f caddy            # logs del gateway (TLS incluido)
$DC restart                  # reiniciar todo

# Actualizar a una nueva versión del repo
./deploy/deploy.sh usuario@IP   # re-sincroniza y reconstruye

# Backup de la base (con la app corriendo, SQLite en hot-backup)
sqlite3 data/db/custom.db ".backup data/backup-$(date +%F).db" \
  || docker run --rm -v $PWD/data:/data alpine \
       cp /data/custom.db /data/backup-$(date +%F).db

# Empezar con base vacía (borra TODO el historial)
$DC down && rm data/db/custom.db && $DC up -d
docker compose -f deploy/docker-compose.yml exec app \
  bun scripts/seed-agent-os.ts   # opcional: constitución + catálogo base
```

### Qué persiste y qué no

| Ruta en el host | Contenido |
|---|---|
| `data/db/custom.db` | Toda la base SQLite (runs, memoria, findings). **Backup regular** |
| `secrets/.z-ai-config` | Credencial L2. Solo lectura para los contenedores |
| `deploy/.env` | SITE_ADDR + GITHUB_TOKEN |
| volumen `caddy_data` | Certificados TLS (no re-emite en cada rebuild) |

`node_modules`, `.next` y las imágenes se reconstruyen: nunca editarlos a mano.

## 7. Endurecimiento recomendado (post-despliegue)

```bash
# en el VPS
ufw default deny incoming && ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw enable
apt-get install -y fail2ban && systemctl enable --now fail2ban
adduser --disabled-password deploy && usermod -aG docker deploy   # si usaste root
```

- Usa un usuario dedicado (o root inicial + usuario propio después) y **rota
  las credenciales SSH** compartidas durante el despliegue.
- `GITHUB_TOKEN`: un PAT read-only (sin scopes de escritura) es suficiente.
- La API key de `secrets/.z-ai-config` es tuya: `chmod 600` y nunca al repo
  (`.gitignore` ya cubre `secrets/`, `data/` y `deploy/.env`).

## 8. Solución de problemas

| Síntoma | Causa probable | Remedio |
|---|---|---|
| `app` reinicia en loop | `prisma db push` falló por drift destructivo del schema | `$DC logs app`; con backup hecho, `npx prisma db push --accept-data-loss` dentro del contenedor |
| Build muere por OOM | VPS de 1 GB sin swap | `fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile` y re-desplegar |
| HTTPS no emite certificado | DNS aún no propaga / puerto 80 cerrado | `dig +short agentos.tudominio.com`; `ufw allow 80/tcp`; `$DC logs caddy` |
| Topología Viva sin eventos | Engine no arrancó antes que la DB existiera | `$DC restart engine` (depende de `app: service_healthy`) |
| Instanciador genera "VERSIÓN DEGRADADA" en todo | `secrets/.z-ai-config` ausente o endpoint inalcanzable | §5 de este README |
| `mejorate` aborta con 403 | GITHUB_TOKEN sin cuota/inválido | PAT read-only nuevo en `deploy/.env`; `$DC restart app` |

## 9. Trazabilidad

- Gateway VPS = réplica literal del `Caddyfile` del entorno de desarrollo
  (`?XTransformPort`), por lo que el frontend no requiere ningún cambio.
- El arranque aplica el schema con `prisma db push` SIN `--accept-data-loss`
  (Regla P2: un drift destructivo detiene el arranque con diagnóstico, jamás
  borra historial en silencio).
- `deploy.sh` siembra la DB del entorno de desarrollo la primera vez: el VPS
  nace con el historial real (runs del bucle, instanciador, memoria P9).
