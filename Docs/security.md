# Security Documentation - SIMRS

Dokumentasi keamanan sistem autentikasi SIMRS.

---

## Security Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                          │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1: Transport Security      │  HTTPS (TLS 1.2+)          │
│  Layer 2: Authentication          │  JWT + Session Validation   │
│  Layer 3: Authorization           │  RBAC + Permissions         │
│  Layer 4: Data Protection         │  bcrypt + Token Hashing     │
│  Layer 5: Audit Trail             │  Session Logging            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Password Security

### bcrypt Hashing
- **Algorithm**: bcrypt
- **Cost Factor**: 12 (configurable via `BCRYPT_COST`)
- **Salt**: Automatically generated per password

```go
// Password never stored in plain text
hash, _ := bcrypt.GenerateFromPassword([]byte(password), 12)
```

### Password Validation
```go
// Constant-time comparison prevents timing attacks
err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
```

### Rehash Detection
```go
// Automatically detect if password needs rehashing (cost upgrade)
func (h *Hasher) NeedsRehash(hash string) bool {
    hashCost, _ := bcrypt.Cost([]byte(hash))
    return hashCost < h.cost
}
```

---

## 2. JWT Token Security

### Token Types

| Type | Expiry | Purpose |
|------|--------|---------|
| Access Token | 15 minutes | API authentication |
| Refresh Token | 7 days | Get new access tokens |

### Token Structure (Claims)
```json
{
  "jti": "unique-token-id",      // Prevent replay
  "sub": "user-id",              // User identifier
  "uid": "user-id",              // User ID (redundant for compat)
  "sid": "session-id",           // Links to login_sessions
  "typ": "access|refresh",       // Token type
  "iat": 1704931200,             // Issued at
  "exp": 1704932100,             // Expires at
  "nbf": 1704931200              // Not valid before
}
```

### Token Security Measures

| Measure | Implementation |
|---------|---------------|
| **Signing** | HMAC-SHA256 |
| **Secret** | 256-bit minimum (environment variable) |
| **Expiry** | Short-lived access tokens |
| **Binding** | Token bound to session ID |
| **Validation** | Algorithm whitelisting (only HS256) |

### Refresh Token Storage
```go
// Refresh tokens are HASHED before storage
// Even if DB is compromised, tokens can't be reused
hash := sha256.Sum256([]byte(refreshToken))
session.RefreshTokenHash = hex.EncodeToString(hash[:])
```

---

## 3. Session Security

### Session Binding
- Each login creates unique session
- Token linked to session via `session_id` claim
- Session validation on EVERY authenticated request

### Session Validation Flow
```
Request → Extract JWT → Validate Signature → Check Expiry
                                                  ↓
                                         Lookup Session by ID
                                                  ↓
                                         Check session.revoked_at IS NULL
                                                  ↓
                                         ✓ Allow / ✗ Reject
```

### Session Revocation
- **Logout**: Revoke current session
- **Security Event**: Revoke all sessions
- **Admin Action**: Force logout any user

```sql
-- Sessions are NEVER deleted (audit trail)
-- Only marked as revoked
UPDATE login_sessions 
SET revoked_at = NOW() 
WHERE id = ?;
```

### Multi-Device Support
- Each device gets unique session
- User can view all active sessions
- Individual session revocation

---

## 4. Authorization (RBAC)

### Permission Model
```
User ──┬── Role ────── Permission (via role_permissions)
       │
       └── Permission (via user_permissions - override)
```

### Permission Resolution
```
1. Collect ALL permissions from user's roles
2. Apply user_permissions overrides:
   - type='grant' → ADD permission
   - type='revoke' → REMOVE permission
3. Result = effective permissions
```

### Permission Caching
```go
// Request-scoped cache prevents repeated DB queries
type PermissionCache struct {
    mu          sync.RWMutex
    permissions map[string]map[string]bool  // userID -> code -> allowed
}
```

### Permission Middleware
```go
// Applied to protected routes
router.GET("/billing", 
    jwtMiddleware.Authenticate(),
    permMiddleware.RequirePermission("billing.read"),
    handler.GetBilling,
)
```

---

## 5. Request Protection

### Rate Limiting (last_seen_at)
```go
// Throttle DB updates to max once per minute
if throttle.shouldUpdate(sessionID) {
    // Update last_seen_at
}
```

### Context Timeout
```go
// Background operations have timeout
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
```

### Input Validation
```go
type LoginRequest struct {
    Username string `json:"username" binding:"required,min=1"`
    Password string `json:"password" binding:"required,min=1"`
}
```

---

## 6. CORS Security

### Current Configuration (Development)
```go
c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
```

### Production Recommendation
```go
// Restrict to specific origins
allowedOrigins := []string{
    "https://simrs.hospital.com",
    "https://admin.hospital.com",
}
```

---

## 7. Error Handling

### Safe Error Messages
```go
// Generic messages - don't reveal internal details
response.Unauthorized(c, "INVALID_CREDENTIALS", "Invalid username or password")

// Never expose:
// - "User 'admin' not found" (reveals valid usernames)
// - "Password incorrect" (confirms username exists)
// - Stack traces
```

### Error Codes
| Code | When Used |
|------|-----------|
| INVALID_CREDENTIALS | Wrong username OR password |
| USER_INACTIVE | Account disabled |
| INVALID_TOKEN | Malformed/invalid JWT |
| EXPIRED_TOKEN | JWT expired |
| SESSION_REVOKED | Session was revoked |
| PERMISSION_DENIED | Missing permission |

---

## 8. Audit Trail

### What's Logged

| Event | Data Captured |
|-------|---------------|
| Login | user_id, ip_address, device_info, timestamp |
| Activity | session.last_seen_at (per minute) |
| Logout | session.revoked_at |

### Data Retention
```sql
-- Sessions are NEVER deleted
-- revoked_at NULL = active
-- revoked_at NOT NULL = ended (logout/revoke)
-- Allows complete audit history
```

---

## 9. Environment Security

### .env Protection
```gitignore
# .gitignore
.env
.env.local
.env.*.local
```

### Required Secrets
| Variable | Security Level | Notes |
|----------|---------------|-------|
| JWT_SECRET | **CRITICAL** | Min 256-bit, random |
| DB_PASSWORD | HIGH | Database access |

### Secret Generation
```powershell
# Generate 64-byte random secret
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
```

---

## 10. Security Checklist

### Before Production

- [ ] Change `JWT_SECRET` to strong random value
- [ ] Set `SERVER_MODE=release`
- [ ] Enable HTTPS (TLS)
- [ ] Restrict CORS origins
- [ ] Set strong `DB_PASSWORD`
- [ ] Review all permissions
- [ ] Enable rate limiting (nginx/cloudflare)
- [ ] Set up log monitoring
- [ ] Configure backup strategy

### Ongoing

- [ ] Rotate JWT_SECRET periodically
- [ ] Review active sessions regularly
- [ ] Monitor failed login attempts
- [ ] Update dependencies (go mod tidy)
- [ ] Audit permission assignments

---

## 11. Login Rate Limiting

### Implementation
- **Limit**: Max 10 attempts per 5 minutes
- **Key**: `login:{username}:{ip}`
- **Storage**: In-memory (development), Redis-ready interface

### Behavior
```
Attempt 1-10  → Normal login flow
Attempt 11+   → HTTP 429 Too Many Requests
After 5 min   → Counter resets automatically
```

### Response on Rate Limit Exceeded
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many login attempts. Please try again later."
  }
}
```

### Design
```go
// Interface - swap in Redis for production
type RateLimitStore interface {
    Increment(key string) (int, error)
    GetCount(key string) (int, error)
}
```

---

## 12. Known Limitations

| Limitation | Mitigation |
|------------|------------|
| No 2FA yet | Planned for future |
| No password complexity rules | Add validation in frontend/backend |
| Rate limit in-memory only | Replace with Redis for multi-instance |

---

## 13. Security Headers (Recommended)

Add to nginx or backend:

```go
// Add security headers middleware
c.Header("X-Content-Type-Options", "nosniff")
c.Header("X-Frame-Options", "DENY")
c.Header("X-XSS-Protection", "1; mode=block")
c.Header("Strict-Transport-Security", "max-age=31536000")
c.Header("Content-Security-Policy", "default-src 'self'")
```

---

## Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Password Hashing | ✅ | bcrypt cost 12 |
| JWT Security | ✅ | HS256, short expiry |
| Session Management | ✅ | Bound, revocable |
| RBAC | ✅ | Role + user overrides |
| Audit Trail | ✅ | Never-delete sessions |
| Input Validation | ✅ | Gin binding |
| Login Rate Limiting | ✅ | 10/5min per user+IP |
| CORS | ⚠️ | Needs production config |
| 2FA | ❌ | Not implemented |
