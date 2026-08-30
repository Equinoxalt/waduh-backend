require('dotenv').config();
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET belum di-set di file .env');
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET belum di-set di file .env');
}
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // Import JWT untuk middleware
const itemsRouter = require('./routes/items');
const authRouter = require('./routes/auth'); // Import route auth
const pricesRouter = require('./routes/prices');
const warehouseRouter = require('./routes/warehouse');

const app = express();

app.use(cors());
app.use(express.json());

// 1. Daftarkan route login (Publik, bisa diakses siapa saja)
app.use('/api/auth', authRouter);

// 2. Middleware untuk memproteksi route Items
// Fungsi ini akan mengecek apakah request membawa token yang valid
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Tidak ada token' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Unauthorized: Token tidak valid' });
    }
    req.user = user; // Simpan data user di request untuk dipakai di controller
    next(); // Lanjutkan ke route berikutnya
  });
};

// 3. Daftarkan route items dengan proteksi middleware
app.use('/api/items', verifyToken, itemsRouter);
app.use('/api/prices', verifyToken, pricesRouter);
app.use('/api/warehouse', verifyToken, warehouseRouter);

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
  console.log(`Menunggu koneksi di port ${PORT}...`); // Tambahan log
});

// Tangkap error jika server gagal start
server.on('error', (err) => {
  console.error('GAGAL START SERVER:', err);
}); 