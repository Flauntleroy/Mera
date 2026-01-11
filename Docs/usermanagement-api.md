# User Management API Documentation

Dokumentasi API untuk manajemen pengguna, role, dan permission SIMRS.

---

## Autentikasi

Semua endpoint memerlukan:
- Header: `Authorization: Bearer <access_token>`
- Permission: `usermanagement.read` atau `usermanagement.write`

### Permission Scope

| Permission | Scope |
|------------|-------|
| `usermanagement.read` | GET endpoints (list, detail) |
| `usermanagement.write` | POST, PUT, DELETE (create, update, assign, copy, delete) |

> **PENTING**: `usermanagement.write` BUKAN berarti "admin absolut tanpa audit". 
> **Semua aksi admin TETAP diaudit** sesuai regulasi rumah sakit.

---

## User Management

### List Users
```http
GET /admin/users?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "username": "admin",
        "email": "admin@hospital.com",
        "is_active": true,
        "last_login_at": "2026-01-11T10:00:00Z",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-11T10:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

---

### Get User Detail
```http
GET /admin/users/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@hospital.com",
    "is_active": true,
    "roles": [
      {"id": "uuid", "name": "admin"}
    ],
    "permission_overrides": [
      {"permission_id": "uuid", "permission_code": "billing.refund", "effect": "grant"}
    ]
  }
}
```

---

### Create User
```http
POST /admin/users
```

**Request:**
```json
{
  "username": "newuser",
  "email": "newuser@hospital.com",
  "password": "SecurePass123!",
  "is_active": true
}
```

---

### Update User
```http
PUT /admin/users/:id
```

**Request:**
```json
{
  "username": "updatedname",
  "email": "updated@email.com",
  "is_active": false
}
```

---

### Activate/Deactivate User
```http
POST /admin/users/:id/activate
POST /admin/users/:id/deactivate
```

---

### Reset Password
```http
POST /admin/users/:id/reset-password
```

**Request:**
```json
{
  "new_password": "NewSecurePass123!"
}
```

---

### Assign Roles
```http
PUT /admin/users/:id/roles
```

**Request:**
```json
{
  "role_ids": ["role-uuid-1", "role-uuid-2"]
}
```

---

### Assign Permission Overrides
```http
PUT /admin/users/:id/permissions
```

**Request:**
```json
{
  "overrides": [
    {"permission_id": "perm-uuid", "effect": "grant"},
    {"permission_id": "perm-uuid-2", "effect": "revoke"}
  ]
}
```

Effect: `grant` atau `revoke`

---

### Copy Access
```http
POST /admin/users/:id/copy-access
```

**Request:**
```json
{
  "source_user_id": "source-user-uuid"
}
```

Menyalin semua roles dan permission overrides dari user sumber ke user target.

---

### Delete User (Soft Delete)
```http
DELETE /admin/users/:id
```

> **PENTING**: User deletion adalah **soft delete only**.
> - Hanya set `deleted_at` dan `is_active = false`
> - Data historis dan audit logs **TIDAK dihapus**
> - Roles dan permission overrides **TETAP tersimpan** di database

---

## Role Management

### List Roles
```http
GET /admin/roles
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "uuid",
        "name": "admin",
        "description": "Administrator",
        "is_system": true
      }
    ]
  }
}
```

---

### Get Role Detail
```http
GET /admin/roles/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "billing",
    "description": "Billing staff",
    "is_system": false,
    "permissions": [
      {"id": "uuid", "code": "billing.read"},
      {"id": "uuid", "code": "billing.write"}
    ]
  }
}
```

---

### Create Role
```http
POST /admin/roles
```

**Request:**
```json
{
  "name": "pharmacist",
  "description": "Pharmacist role"
}
```

---

### Update Role
```http
PUT /admin/roles/:id
```

**Request:**
```json
{
  "name": "senior_pharmacist",
  "description": "Senior pharmacist with more access"
}
```

---

### Delete Role
```http
DELETE /admin/roles/:id
```

> ⚠️ System roles (admin, doctor, nurse, billing) tidak dapat dihapus.

---

### Assign Permissions to Role
```http
PUT /admin/roles/:id/permissions
```

**Request:**
```json
{
  "permission_ids": ["perm-uuid-1", "perm-uuid-2"]
}
```

---

## Permission Management

### List Permissions
```http
GET /admin/permissions
GET /admin/permissions?domain=billing
```

**Response:**
```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "id": "uuid",
        "code": "billing.read",
        "domain": "billing",
        "action": "read",
        "description": "View billing data"
      }
    ]
  }
}
```

---

### Create Permission
```http
POST /admin/permissions
```

**Request:**
```json
{
  "code": "pharmacy.return.create",
  "domain": "pharmacy",
  "action": "return.create",
  "description": "Create pharmacy return"
}
```

> **KONTROL KETAT**: Endpoint ini hanya untuk system administrator.
> - Permissions baru harus sesuai dengan fitur yang dikembangkan
> - Format kode: `domain.action` (e.g., `billing.refund.approve`)
> - Setiap permission baru WAJIB di-review sebelum production
> - Semua pembuatan permission tercatat di audit log

---

## Error Responses

| Code | Message |
|------|---------|
| `USER_EXISTS` | Username atau email sudah digunakan |
| `ROLE_EXISTS` | Role sudah ada |
| `PERMISSION_EXISTS` | Permission code sudah ada |
| `SYSTEM_ROLE` | Tidak dapat menghapus role sistem |
| `VALIDATION_ERROR` | Format data tidak valid |

---

## Audit Logging

Semua operasi yang memodifikasi data akan tercatat di:
```
storage/logs/audit/audit-YYYY-MM-DD.json
```

Format: NDJSON dengan summary dalam Bahasa Indonesia.

> **Admin tetap diaudit.** Tidak ada pengecualian.
> Ini penting secara regulasi rumah sakit (akreditasi, keamanan data pasien).
