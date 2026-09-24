# rscm-fais

Fire Alarm Integration System for **RSCM**.

## Included modules

- JWT login with the existing authentication flow
- FAIS dashboard
- MQTT configuration
- Location monitoring
- Sensor log buffer
- System settings
- MySQL schema and starter data

## Project structure

- `Frontend` - JavaScript/Next.js frontend application
- `Backend` - C#/.NET API, domain/persistence projects, database script, and backend assets

## Default demo access

```text
Username: root
Password: root_native
```

## Database

MySQL 8 is required. From the repository root, run:

```powershell
mysql -u root -p -e "source Backend/database/rscm-fais.sql"
```

The script creates `rscm_fais`, the login user, FAIS tables, and starter records.

## Run locally

API:

```powershell
$env:ConnectionStrings__DefaultConnection="Server=127.0.0.1;Port=3306;User ID=root;Password=YOUR_PASSWORD;Database=rscm_fais;SslMode=None;AllowPublicKeyRetrieval=True;"
dotnet run --project Backend\Web.API\Web.API.csproj
```

Frontend, in another terminal:

```powershell
Set-Location Frontend
npm install
$env:NEXT_PUBLIC_API_BASE_URL="http://localhost:5241"
npm run dev
```

Open `http://localhost:3000`.

## Core API

Core endpoints:

- `POST /api/auth/login`
- `GET /api/rscm-fais/status`
- `GET|PUT /api/rscm-fais/mqtt-configuration`
- `GET /api/rscm-fais/log-buffer`
- `GET|PUT /api/rscm-fais/settings`
