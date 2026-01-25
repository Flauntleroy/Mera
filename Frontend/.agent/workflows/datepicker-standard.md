---
description: how to implement premium DatePicker/Calendar surfaces
---

# Premium DatePicker Standard

Standard implementasi kalender di Clinova menggunakan `flatpickr` dengan kustomisasi header premium.

## Core Component
Silahkan gunakan komponen dasar di [date-picker.tsx](file:///f:/Work/laragon/www/Clinova/Frontend/src/components/form/date-picker.tsx).

## Styling Rules
Semua kustomisasi CSS terpusat di `src/index.css` di bawah section `Flatpickr Standard`.

### 1. Header Kustom (Mandatory)
Native header flatpickr diperbolehkan tapi harus disembunyikan. Gunakan `createPortal` untuk menyuntikkan unit kustom ke dalam `.flatpickr-months`.

- **Width Ratio**: 60 (Month) : 40 (Year)
- **Navigation**: Gunakan `AngleLeftIcon` & `AngleRightIcon` dengan wrapper button rounded-xl.
- **Month**: Gunakan standard `Combobox` dengan `disablePortal={true}`.
- **Year**: Gunakan numeric input dengan `no-spinner` class, kustom stepper (ChevronUp/Down), dan styling identik dengan Combobox (h-10, rounded-xl).

### 2. Layout & Centering
Calendar grid HARUS berada di tengah.
```css
.flatpickr-calendar {
  @apply !flex !flex-col !items-center !justify-center;
}
.flatpickr-days {
  @apply !w-full !flex !justify-center !mx-auto;
}
```

### 3. Hiding Native Elements
Gunakan selector agresif untuk mencegah duplikasi:
```css
.flatpickr-months .flatpickr-prev-month,
.flatpickr-months .flatpickr-next-month,
.flatpickr-current-month {
  @apply !hidden !opacity-0 !pointer-events-none;
  display: none !important;
}
```

## Interaction Protection
Untuk mencegah kalender menutup otomatis saat berinteraksi dengan header:
1. Bungkus header kustom dengan `e.stopPropagation()` pada event `onMouseDown` dan `onClick`.
2. Jika menggunakan `Combobox` di dalam header, set `disablePortal={true}` agar dropdown-nya tidak "melayang" di luar DOM kalender.
3. Jalankan logika penyembunyian native elements pada hook `onReady` DAN `onOpen`.
