# Audit Log API Documentation

Dokumentasi API untuk melihat riwayat audit log sistem SIMRS.

---

## Autentikasi

Semua endpoint memerlukan:
- Header: `Authorization: Bearer <access_token>`
- Permission: `auditlog.read`

---

## Endpoints

### List Audit Logs
```http
GET /admin/audit-logs
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | date | Tanggal awal (YYYY-MM-DD), default 7 hari lalu |
| `to` | date | Tanggal akhir (YYYY-MM-DD), default hari ini |
| `module` | string | Filter by module (auth, usermanagement, farmasi, billing, pasien) |
| `user` | string | Filter by username (partial match) |
| `action` | string | Filter by action (INSERT, UPDATE, DELETE) |
| `business_key` | string | Filter by business key (partial match) |
| `page` | int | Page number, default 1 |
| `limit` | int | Items per page (25, 50, 100), default 25 |

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "1736574000-0",
        "ts": "2026-01-11T09:00:00+08:00",
        "level": "AUDIT",
        "module": "usermanagement",
        "action": "INSERT",
        "entity": {
          "table": "users",
          "primary_key": {"id": "uuid"}
        },
        "business_key": "admin",
        "actor": {
          "user_id": "uuid",
          "username": "admin"
        },
        "ip": "192.168.1.100",
        "summary": "Pengguna baru admin berhasil dibuat"
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 25
  }
}
```

---

### Get Audit Log Detail
```http
GET /admin/audit-logs/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1736574000-0",
    "ts": "2026-01-11T09:00:00+08:00",
    "level": "AUDIT",
    "module": "usermanagement",
    "action": "UPDATE",
    "entity": {
      "table": "users",
      "primary_key": {"id": "uuid"}
    },
    "sql_context": {
      "operation": "UPDATE",
      "changed_columns": {
        "is_active": {"old": true, "new": false},
        "email": {"old": "old@email.com", "new": "new@email.com"}
      },
      "where": {"id": "uuid"}
    },
    "business_key": "admin",
    "actor": {
      "user_id": "uuid",
      "username": "superadmin"
    },
    "ip": "192.168.1.100",
    "summary": "Data pengguna admin diperbarui: is_active, email"
  }
}
```

---

### Get Available Modules
```http
GET /admin/audit-logs/modules
```

**Response:**
```json
{
  "success": true,
  "data": ["auth", "usermanagement", "farmasi", "billing", "pasien", "inventory"]
}
```

---

## Permission Requirements

| Permission | Description |
|------------|-------------|
| `auditlog.read` | Required to access audit log endpoints |
| `auditlog.read.sensitive` | Required to view IP address in frontend |

---

## SQL Context by Action

### INSERT
```json
{
  "operation": "INSERT",
  "inserted_data": {
    "id": "uuid",
    "username": "newuser",
    "email": "new@email.com"
  }
}
```

### UPDATE
```json
{
  "operation": "UPDATE",
  "changed_columns": {
    "field1": {"old": "value1", "new": "value2"}
  },
  "where": {"id": "uuid"}
}
```

### DELETE
```json
{
  "operation": "DELETE",
  "deleted_data": {
    "id": "uuid",
    "username": "olduser"
  },
  "where": {"id": "uuid"}
}
```

---

## File Storage

Audit logs disimpan di:
```
backend/storage/logs/audit/audit-YYYY-MM-DD.json
```

Format: NDJSON (1 JSON per line)

---

## Error Responses

| Code | Message |
|------|---------|
| `VALIDATION_ERROR` | Format tanggal tidak valid |
| `UNAUTHORIZED` | Token tidak valid atau expired |
| `FORBIDDEN` | Tidak memiliki permission `auditlog.read` |

---

## Notes

> **READ-ONLY**: Audit log hanya bisa dibaca, tidak bisa diedit atau dihapus.

> **Retention**: File log dirotasi harian dan harus di-backup secara berkala.

> **Admin tetap diaudit**: Semua aksi admin tercatat, tidak ada pengecualian.
