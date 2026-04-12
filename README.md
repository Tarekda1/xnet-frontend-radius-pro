# Xnet Frontend (Radius Pro)

Frontend UI built with **Next.js**, React, and TypeScript. All application code lives under `next-app/` (`app/` routes plus `components/`, `screens/`, `lib/`, etc.).

## Windows 11 quickstart (recommended)

Prereqs:
- Node.js 20+
- npm

Steps (PowerShell):

```powershell
Copy-Item env.example next-app\.env.local
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

Dev container (Next.js on port 5173):

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

- Local dev: `next-app/.env.local` (not committed)
- Example/template: `env.example` (safe to commit)

Important: `docker-compose.yml` no longer hardcodes NAS credentials; set these in `.env` / `.env.local` when needed (see `env.example` — `VITE_DEFAULT_NAS_*` keys for Compose).
