# Frontend Styling Guidelines - Clinova

To maintain UI/UX consistency with the **TailAdmin** dashboard theme, all developers and AI assistants must follow these guidelines when creating or modifying frontend components.

## Core Component Usage

### 1. Date Picker
Always use the specialized `DatePicker` component instead of native HTML `<input type="date">`.
- **Import**: `import DatePicker from '../../components/form/date-picker';`
- **Features**: Includes Flatpickr integration, premium styling, and dark mode support.
- **Props**: `id`, `label`, `defaultDate`, `onChange`, `mode` (single/range).

### 2. Select / Combo Box
Use the `Select` component for standard dropdowns to ensure consistent appearance with the TailAdmin theme.
- **Import**: `import Select from '../../components/form/Select';`
- **Props**: `options` (Array of {value, label}), `defaultValue`, `onChange`, `placeholder`.
- **Note**: The `Select` component handles the custom arrow icon and TailAdmin styling (borders, shadows, dark mode) out of the box.

### 3. Typography & Colors
- **Fonts**: Use the project's default font (Inter/Outfit as configured in `index.css`).
- **Primary Color**: Use the `brand` color family (e.g., `text-brand-600`, `bg-brand-500`).
- **Secondary Colors**: Use `gray` for neutral elements, `success` for completions, and `error` for destructive actions.


### 4. Global Scrolling & Custom Indicators
Semua area yang membutuhkan scroll vertikal **WAJIB** menggunakan standar premium berikut:
- **Global Reset**: Scrollbar standar browser telah di-reset dI `index.css` menjadi lebih tipis dan rounded. Jangan gunakan class `no-scrollbar` kecuali sangat diperlukan.
- **ScrollArea Component**: Gunakan `ScrollArea` component untuk area konten yang dinamis (seperti Sidebar, Modals, atau Page Content).
- **Import**: `import ScrollArea from '../../components/ui/ScrollArea';`
- **Fitur**: `ScrollArea` secara otomatis menambahkan indikator bayangan (top/bottom shadow) saat konten melampaui batas container.
- **Usage**:
  ```tsx
  <ScrollArea className="p-6 space-y-4" containerClassName="max-h-[70vh]">
    {/* Content */}
  </ScrollArea>
  ```

## Patterns

### Form Layouts
- Use the `Label` component for all input labels.
- Group filters in responsive grids (e.g., `grid-cols-1 sm:grid-cols-2 lg:grid-cols-5`).

### Pagination & Limit Selection
Semua tabel yang menggunakan paginasi **WAJIB** menyertakan pilihan limit data (Page Size Selection).
- **Opsi Limit**: Wajib menyertakan opsi `10, 25, 50, dan 100`.
- **Layout**: Dropdown limit dIletakkan dI area pagination sebelah kiri, sejajar dengan informasi total data.
- **Navigasi**: Gunakan icon SVG (chevron) untuk tombol Previous/Next, bukan teks.
- **Logic**: Mengubah limit harus me-reset halaman (page) kembali ke 1.
- **Styling**: Gunakan Tailwind classes yang konsisten dengan `VedikaIndex` atau `UserManagement`.

### Modals & Panels
- Selalu bungkus konten modal dI dalam `ScrollArea` untuk memberikan visual cue saat ada overflow.
- Gunakan `max-h-[...vh]` pada `containerClassName` milik `ScrollArea` untuk membatasi tinggi modal dI layar kecil.

### Dark Mode
Ensure all components have `dark:` variant classes to support the dashboard's appearance toggling.
