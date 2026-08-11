# Waduh — Backend API

REST API untuk aplikasi Waduh — aplikasi pencatatan stok barang, dibangun dengan Node.js, Express, dan MySQL.

Backend ini dibuat sebagai bagian dari migrasi aplikasi Android native (Kotlin) ke Flutter, menyediakan penyimpanan data persisten yang sebelumnya tidak ada di versi native-nya — data pada versi lama hanya hidup di memori dan hilang setiap aplikasi ditutup.

## Fitur

- Autentikasi JWT (register & login), password di-hash dengan bcrypt
- Isolasi data penuh per akun — setiap user hanya bisa mengakses datanya sendiri
- Input bulk (banyak baris sekaligus dalam satu request) dengan pelacakan sesi
- Riwayat data, dikelompokkan otomatis per tanggal
- Kalkulasi total pendapatan berdasarkan harga satuan per barang
- Validasi input & penanganan error konsisten di setiap endpoint

## Tech Stack

- Node.js + Express 5
- MySQL / MariaDB (via `mysql2`)
- JWT (`jsonwebtoken`) untuk autentikasi
- `bcrypt` untuk hashing password
- `dotenv` untuk konfigurasi environment

## Struktur Proyek

\`\`\`
waduh-backend/
├── config/
│   └── database.js         # koneksi pool MySQL
├── controllers/
│   ├── authController.js   # login, register
│   ├── itemController.js   # CRUD item, riwayat, sesi
│   └── priceController.js  # harga satuan per barang
├── routes/
│   ├── auth.js
│   ├── items.js
│   └── prices.js
├── server.js                # entry point + middleware verifyToken
├── schema.sql                # skema database lengkap
└── .env.example               # template environment variable
\`\`\`

## API Endpoints

Semua endpoint `/api/items/*` dan `/api/prices/*` memerlukan header `Authorization: Bearer <token>`.

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/auth/register` | Buat akun baru |
| POST | `/api/auth/login` | Login, dapatkan JWT token |
| POST | `/api/items` | Input banyak item sekaligus (bulk) |
| GET | `/api/items/totals?scope=today\|month\|all` | Total per barang sesuai cakupan waktu |
| DELETE | `/api/items` | Hapus semua data milik akun aktif |
| GET | `/api/items/history` | Riwayat, dikelompokkan per tanggal |
| DELETE | `/api/items/history/:date` | Hapus data satu tanggal tertentu |
| GET | `/api/items/session/:sessionId/totals` | Total dari satu sesi input yang masih berjalan |
| GET | `/api/items/rows?name=&scope=\|date=\|sessionId=` | Baris mentah di balik satu total (buat edit/hapus satuan) |
| PUT | `/api/items/:id` | Edit satu baris item |
| DELETE | `/api/items/:id` | Hapus satu baris item |
| GET | `/api/prices` | Daftar harga satuan tersimpan |
| PUT | `/api/prices` | Simpan/perbarui harga satuan satu barang |

## Setup

1. Clone repo ini.
2. `npm install`
3. Salin `.env.example` menjadi `.env`, isi sesuai environment lokal.
4. Buat database, lalu jalankan isi `schema.sql` di MySQL/MariaDB.
5. `npm run dev` (development, auto-restart via nodemon) atau `npm start`.

## Skema Database

Lihat [`schema.sql`](./schema.sql). Satu `users` punya banyak `items` dan banyak `item_prices`, keduanya diisolasi lewat `user_id` dengan `ON DELETE CASCADE`.

