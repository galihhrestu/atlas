# Uji Endpoint Backend

Setelah server berjalan:

## 1. Health check

Buka:

`http://localhost:3000/api/health`

Hasil yang benar memiliki:

```json
{
  "success": true,
  "status": "ok",
  "service": "INSIGHTK3 API"
}
```

## 2. Status database

Buka:

`http://localhost:3000/api/database-status`

Hasil yang benar memiliki:

```json
{
  "success": true,
  "status": "ok",
  "database": "connected",
  "provider": "postgresql"
}
```

Jika endpoint kedua menghasilkan HTTP 503, periksa `DATABASE_URL` dan status PostgreSQL.
