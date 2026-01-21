# Vedika Dashboard - Dokumentasi Teknis

## Ringkasan

Dashboard Vedika adalah modul untuk monitoring dan pengelolaan klaim BPJS. Dashboard ini menampilkan ringkasan data klaim dalam periode aktif, termasuk rencana klaim, pengajuan klaim, dan tingkat maturasi.

## Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  VedikaDashboard.tsx                                             │
│  ├── VedikaSummaryCards.tsx (3 cards: Rencana, Pengajuan, Maturasi)
│  └── VedikaTrendChart.tsx (ApexCharts line chart)               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP API
┌─────────────────────────────────────────────────────────────────┐
│                         Backend (Go/Gin)                         │
├─────────────────────────────────────────────────────────────────┤
│  Handler Layer                                                   │
│  └── dashboard_handler.go                                        │
│       ├── GET /admin/vedika/dashboard                            │
│       └── GET /admin/vedika/dashboard/trend                      │
├─────────────────────────────────────────────────────────────────┤
│  Service Layer                                                   │
│  └── dashboard_service.go                                        │
│       ├── GetDashboardSummary() - parallel query execution       │
│       └── GetDashboardTrend()                                    │
├─────────────────────────────────────────────────────────────────┤
│  Repository Layer                                                │
│  └── dashboard_repository.go                                     │
│       ├── CountRencanaRalan()                                    │
│       ├── CountRencanaRanap()                                    │
│       ├── CountPengajuanByJenis()                                │
│       └── GetDailyTrend() - optimized single query               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ MySQL
┌─────────────────────────────────────────────────────────────────┐
│  Database Tables                                                 │
│  ├── reg_periksa (registrasi pasien)                             │
│  ├── kamar_inap (data rawat inap)                                │
│  ├── penjab (cara bayar/penjamin)                                │
│  ├── mlite_vedika (klaim yang sudah diajukan)                    │
│  └── mera_settings (konfigurasi periode aktif)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend

### Tech Stack
- **React 18** dengan TypeScript
- **Tailwind CSS v4** untuk styling  
- **ApexCharts** (react-apexcharts) untuk visualisasi chart
- **Vite** sebagai build tool

### File Structure

```
Frontend/src/
├── config/
│   └── api.ts                          # API endpoint configuration
├── services/
│   └── vedikaService.ts                # Vedika API service layer
├── pages/Vedika/
│   ├── VedikaDashboard.tsx             # Main dashboard page
│   └── components/
│       ├── VedikaSummaryCards.tsx      # Summary cards component
│       └── VedikaTrendChart.tsx        # Trend chart component
└── App.tsx                             # Route /vedika added
```

### Components

#### VedikaDashboard.tsx
Main page component yang menangani:
- **State Management**: Loading, Error (settings_missing, permission_denied, generic), No Data, Success
- **Data Fetching**: Parallel fetch untuk summary dan trend data
- **Period Display**: Badge read-only yang menampilkan periode klaim aktif

```typescript
type DashboardState = 
  | { status: 'loading' }
  | { status: 'error'; errorType: 'settings_missing' | 'permission_denied' | 'generic'; message: string }
  | { status: 'no_data' }
  | { status: 'success'; data: DashboardData };
```

#### VedikaSummaryCards.tsx
Menampilkan 3 kartu ringkasan:
1. **Rencana** - Total episode yang siap diklaim (Ralan + Ranap breakdown)
2. **Pengajuan** - Total klaim yang sudah diajukan
3. **Maturasi** - Persentase pengajuan vs rencana

Setiap kartu menampilkan breakdown Ralan (Rawat Jalan) dan Ranap (Rawat Inap).

#### VedikaTrendChart.tsx
Line chart menggunakan ApexCharts:
- **2 series**: Rencana dan Pengajuan
- **X-axis**: Tanggal dalam periode aktif
- **Tooltip**: Breakdown Ralan/Ranap per data point

### API Service

```typescript
// vedikaService.ts
export const vedikaService = {
  getDashboardSummary(): Promise<DashboardSummaryResponse>;
  getDashboardTrend(): Promise<DashboardTrendResponse>;
  // ... other methods
};

// Error handling utilities
export function isSettingsMissingError(error: unknown): boolean;
export function isPermissionDeniedError(error: unknown): boolean;
```

---

## Backend

### Tech Stack
- **Go 1.21+**
- **Gin** web framework
- **database/sql** dengan MySQL driver

### API Endpoints

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/admin/vedika/dashboard` | Dashboard summary | `vedika.read` |
| GET | `/admin/vedika/dashboard/trend` | Daily trend data | `vedika.read` |

### Response Format

#### GET /admin/vedika/dashboard
```json
{
  "success": true,
  "data": {
    "period": "2026-01",
    "summary": {
      "period": "2026-01",
      "rencana": { "ralan": 1250, "ranap": 340 },
      "pengajuan": { "ralan": 980, "ranap": 280 },
      "maturasi": { "ralan": 78.4, "ranap": 82.35 }
    }
  }
}
```

#### GET /admin/vedika/dashboard/trend
```json
{
  "success": true,
  "data": {
    "trend": [
      {
        "date": "2026-01-01",
        "rencana": { "ralan": 45, "ranap": 12 },
        "pengajuan": { "ralan": 38, "ranap": 10 }
      }
    ]
  }
}
```

---

## Optimasi Performa

### Masalah Awal
- Response time: **~49 detik** ❌
- Penyebab:
  1. N+1 query problem di `GetDailyTrend` (94+ queries per request)
  2. Sequential query execution
  3. Slow `NOT IN` subqueries

### Solusi yang Diterapkan

#### 1. Parallel Query Execution (Service Layer)
```go
// Sebelum: Sequential (4 queries × ~10s = 40s)
rencanaRalan, _ := repo.CountRencanaRalan(...)
rencanaRanap, _ := repo.CountRencanaRanap(...)
pengajuanRalan, _ := repo.CountPengajuanByJenis(...)
pengajuanRanap, _ := repo.CountPengajuanByJenis(...)

// Sesudah: Parallel dengan goroutines (~10s total)
var wg sync.WaitGroup
wg.Add(4)
go func() { rencanaRalan, _ = repo.CountRencanaRalan(...); wg.Done() }()
go func() { rencanaRanap, _ = repo.CountRencanaRanap(...); wg.Done() }()
go func() { pengajuanRalan, _ = repo.CountPengajuanByJenis(...); wg.Done() }()
go func() { pengajuanRanap, _ = repo.CountPengajuanByJenis(...); wg.Done() }()
wg.Wait()
```

#### 2. Single Aggregated Query for Trend (Repository Layer)
```sql
-- Sebelum: 1 + (31 × 3) = 94 queries per bulan
SELECT COUNT(*) FROM reg_periksa WHERE DATE(tgl_registrasi) = '2026-01-01'...
SELECT COUNT(*) FROM mlite_vedika WHERE DATE(tgl_registrasi) = '2026-01-01'...
-- repeat for each day...

-- Sesudah: 1 query dengan UNION ALL + GROUP BY
SELECT day, SUM(rencana_ralan), SUM(pengajuan_ralan), ...
FROM (
  SELECT DATE(tgl_registrasi) as day, COUNT(*) as rencana_ralan, 0, 0, 0
  FROM reg_periksa ... GROUP BY DATE(tgl_registrasi)
  UNION ALL
  SELECT DATE(tgl_registrasi), 0, 0, COUNT(*), 0
  FROM mlite_vedika WHERE jenis='2' GROUP BY DATE(tgl_registrasi)
  UNION ALL
  ...
) GROUP BY day ORDER BY day
```

#### 3. LEFT JOIN Instead of NOT IN
```sql
-- Sebelum: Slow NOT IN subquery
WHERE no_rawat NOT IN (SELECT no_rawat FROM mlite_vedika WHERE jenis = '2')

-- Sesudah: Fast LEFT JOIN + NULL check
LEFT JOIN mlite_vedika mv ON rp.no_rawat = mv.no_rawat AND mv.jenis = '2'
WHERE mv.no_rawat IS NULL
```

### Hasil Optimasi
| Metric | Sebelum | Sesudah | Improvement |
|--------|---------|---------|-------------|
| Response time | ~49s | ~6s | **8x lebih cepat** |
| Queries per request | 94+ | 5 | **95% reduction** |

---

## Rekomendasi Index Database

Untuk performa optimal, tambahkan index berikut:

```sql
-- reg_periksa
CREATE INDEX idx_reg_periksa_tgl_registrasi ON reg_periksa(tgl_registrasi);
CREATE INDEX idx_reg_periksa_status_lanjut ON reg_periksa(status_lanjut);
CREATE INDEX idx_reg_periksa_kd_pj ON reg_periksa(kd_pj);

-- mlite_vedika
CREATE INDEX idx_mlite_vedika_tgl_registrasi ON mlite_vedika(tgl_registrasi);
CREATE INDEX idx_mlite_vedika_jenis ON mlite_vedika(jenis);
CREATE INDEX idx_mlite_vedika_no_rawat_jenis ON mlite_vedika(no_rawat, jenis);

-- kamar_inap
CREATE INDEX idx_kamar_inap_tgl_keluar ON kamar_inap(tgl_keluar);
```

---

## UI States

Dashboard menghandle semua kemungkinan state:

| State | Kondisi | UI |
|-------|---------|-----|
| Loading | Initial fetch | Skeleton cards + chart placeholder |
| Settings Missing | `active_period` not configured | Warning alert + link to settings |
| Permission Denied | User lacks `vedika.read` | Error alert |
| No Data | Empty response | Info message |
| Success | Data available | Summary cards + trend chart |

---

## Design Decisions

1. **Policy-Driven Period**: Periode klaim adalah read-only badge, bukan dropdown yang bisa dipilih user. Ini sesuai dengan kebijakan BPJS yang menentukan periode klaim.

2. **Ralan/Ranap Breakdown**: Setiap metrik menampilkan breakdown Rawat Jalan dan Rawat Inap, bukan hanya total. Ini memberikan domain clarity untuk user BPJS.

3. **Simple Line Chart**: Menggunakan line chart sederhana (bukan stacked) untuk menghindari misleading visualization.

4. **Consistent Theming**: Menggunakan warna dari theme CSS project (`--color-brand-*`, `--color-success-*`, dll) untuk konsistensi visual.

---

## Testing

### Manual Testing
1. Start backend: `go run .\cmd\server\main.go`
2. Start frontend: `npm run dev` (di folder Frontend)
3. Login dan navigate ke `/vedika`
4. Verify:
   - Summary cards menampilkan data yang benar
   - Chart menampilkan trend harian
   - Response time < 10 detik

### Checklist
- [ ] Loading state muncul saat fetch
- [ ] Error state muncul jika API gagal
- [ ] Period badge menampilkan periode aktif
- [ ] Summary cards breakdown Ralan/Ranap correct
- [ ] Chart menampilkan 2 series (Rencana, Pengajuan)
- [ ] Tooltip chart menampilkan breakdown

---

## Files Changed

### Frontend
| File | Change |
|------|--------|
| `src/config/api.ts` | Added Vedika endpoints |
| `src/services/vedikaService.ts` | **NEW** - Service layer |
| `src/pages/Vedika/VedikaDashboard.tsx` | **NEW** - Main page |
| `src/pages/Vedika/components/VedikaSummaryCards.tsx` | **NEW** |
| `src/pages/Vedika/components/VedikaTrendChart.tsx` | **NEW** |
| `src/App.tsx` | Added `/vedika` route |
| `src/index.css` | Fixed Tailwind v4 syntax errors |

### Backend
| File | Change |
|------|--------|
| `internal/vedika/handler/dashboard_handler.go` | Fixed getActor() panic |
| `internal/vedika/service/dashboard_service.go` | Added parallel execution |
| `internal/vedika/repository/dashboard_repository.go` | Optimized queries |

---

## Troubleshooting

### "Settings missing" error
**Cause**: `active_period` belum dikonfigurasi di `mera_settings`
**Solution**: Set `active_period` di admin settings, format: `YYYY-MM`

### "Permission denied" error
**Cause**: User tidak memiliki permission `vedika.read`
**Solution**: Assign role dengan permission `vedika.read` ke user

### Slow response time
**Cause**: Missing database indexes
**Solution**: Run SQL index creation commands (lihat section Rekomendasi Index)

### CSS errors di frontend
**Cause**: Pre-existing Tailwind v4 syntax errors
**Solution**: Sudah diperbaiki - pastikan `dark:!` tanpa spasi (bukan `dark: !`)
