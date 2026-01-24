---
description: how global loading works and when to disable it
---

# Global Loading System

## Overview

Semua API calls via `apiRequest()` otomatis trigger global loading overlay **by default**.

## When Loading Shows

| Scenario | Global Loading | Reason |
|----------|----------------|--------|
| Button click (Detail, Edit, Delete) | ✅ Yes | Tidak ada skeleton, perlu block UI |
| Page data load (list) | ❌ No | Halaman punya loading skeleton |
| Mutation (POST/PUT/DELETE) | ✅ Yes | Block UI untuk mencegah double submit |

## Disable Global Loading

Untuk API calls yang load data di page mount (sudah ada skeleton):

```typescript
// Di service file
const response = await apiRequest<Response>(url, {}, { showGlobalLoading: false });
```

## Rule of Thumb

- **Button click → Keep loading** (default)
- **Page mount dengan skeleton → Disable loading**

## Files

| File | Purpose |
|------|---------|
| `services/authService.ts` | `apiRequest()` dengan loading option |
| `context/UIContext.tsx` | `LoadingBar` component |
| `utils/loadingEventBus.ts` | Event bus untuk non-React loading |

## Auto Token Refresh

Saat dapat 401:
1. Try refresh token
2. Jika berhasil → retry request
3. Jika gagal → redirect ke `/signin`
