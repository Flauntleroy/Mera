# Troubleshooting Guide

Dokumentasi masalah yang pernah ditemui dan cara mengatasinya.

---

## 1. Audit Log UI Menampilkan Data Kosong

**Tanggal**: 2026-01-11

**Gejala**: 
- Halaman `/audit-logs` menampilkan "Tidak ada data audit log"
- API `/admin/audit-logs` return 200 tapi `logs: null`

**Penyebab**:
File audit log dalam format **multi-line JSON** (pretty-printed):
```json
{
    "ts": "2026-01-11...",
    "level": "AUDIT"
}
```

Tapi handler Go membaca dengan `bufio.Scanner` yang expect **NDJSON** (1 JSON per line):
```json
{"ts":"2026-01-11...","level":"AUDIT",...}
{"ts":"2026-01-11...","level":"AUDIT",...}
```

**Solusi**:
Pastikan file audit log dalam format NDJSON. `AuditLogger` sudah menulis format yang benar secara otomatis.

**Catatan**: 
Masalah ini hanya terjadi jika membuat file log **manual**. Di production, `AuditLogger` selalu menulis format yang benar.

---

## 2. Route `/admin/audit-logs` Return 404

**Tanggal**: 2026-01-11

**Gejala**:
- Browser console menampilkan 404 Not Found
- Route tidak terdaftar di Gin

**Penyebab**:
Backend belum di-restart setelah menambahkan router baru.

**Solusi**:
```bash
# Stop backend (Ctrl+C)
# Restart
go run cmd/server/main.go
```

Verifikasi dengan melihat log startup:
```
Audit Logs:
  GET       /admin/audit-logs
  GET       /admin/audit-logs/:id
```

---

## 3. Permission Denied (403) untuk Audit Log

**Tanggal**: 2026-01-11

**Gejala**:
- API return 403 Forbidden
- User sudah login tapi tidak bisa akses

**Penyebab**:
Permission `auditlog.read` belum ada di database.

**Solusi**:
```sql
-- Tambah permission
INSERT IGNORE INTO permissions (id, code, domain, action, description) VALUES
    (UUID(), 'auditlog.read', 'auditlog', 'read', 'View audit logs');

-- Assign ke admin role
SET @admin_role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1);
INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
SELECT @admin_role_id, id, NOW() FROM permissions WHERE code = 'auditlog.read';
```

Kemudian **logout dan login ulang** agar permission ter-refresh.

---

## Template untuk Issue Baru

```markdown
## [Nomor]. [Judul Singkat]

**Tanggal**: YYYY-MM-DD

**Gejala**:
- Bullet point gejala yang terlihat

**Penyebab**:
Penjelasan root cause.

**Solusi**:
Langkah-langkah untuk fix.

**Catatan**:
Informasi tambahan jika ada.
```
