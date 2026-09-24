# rscm-fais Backend

Layered .NET 8 backend for the RSCM rscm-fais system.

## Projects

- `Web.API`: ASP.NET Core Web API.
- `Web.API.Domain`: authentication, response, and FAIS domain models.
- `Web.API.Persistence`: EF Core context, auth service, and FAIS database mappings.

## Database

Use the on-premise MySQL database:

```text
Server=127.0.0.1;Port=3306;User ID=root;Password=YOUR_PASSWORD;Database=rscm_fais;SslMode=None;AllowPublicKeyRetrieval=True;
```

Apply the FAIS schema from:

```text
Backend/database/rscm-fais.sql
```

For an existing database that still has legacy production-control tables, run:

```text
Web.API.Persistence/Migrations/20260730_001_drop_unused_tables.sql
```

## API Modules

- `POST /api/auth/login`
- `GET /api/rscm-fais/status`
- `GET|PUT /api/rscm-fais/mqtt-configuration`
- `GET /api/rscm-fais/log-buffer`
- `GET|PUT /api/rscm-fais/settings`

## Run

```powershell
$env:ConnectionStrings__DefaultConnection="Server=127.0.0.1;Port=3306;User ID=root;Password=YOUR_PASSWORD;Database=rscm_fais;SslMode=None;AllowPublicKeyRetrieval=True;"
dotnet run --project Web.API\Web.API.csproj --urls http://localhost:5241
```
