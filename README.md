# Xnet Frontend (Radius Pro)

Frontend UI built with React + TypeScript + Vite.

## Windows 11 quickstart (recommended)

Prereqs:
- Node.js 20+
- npm

Steps (PowerShell):

```powershell
Copy-Item env.example .env.local
npm ci
npm run dev
```

If you want a single command that also scaffolds `.env.local` for you:

```powershell
.\scripts\dev.ps1
```

Note: if PowerShell blocks scripts, run one of:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
# or for a one-off:
powershell -ExecutionPolicy Bypass -File .\scripts\dev.ps1
```

## Docker (Windows 11 + Docker Desktop)

Dev container (Vite inside Docker):

```powershell
.\scripts\docker-dev.ps1
```

Stop containers:

```powershell
.\scripts\docker-down.ps1
```

Or via npm scripts:

```powershell
npm run docker:dev
npm run docker:stop
```

## Environment variables

- Local dev: use `.env.local` (not committed)
- Example/template: `env.example` (safe to commit)

Important: `docker-compose.yml` no longer hardcodes NAS credentials; set these in `.env.local` when needed:
- `VITE_DEFAULT_NAS_SECRET`

