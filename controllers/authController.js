require('dotenv').config();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Cari user
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // 2. DEFINISIKAN VARIABEL USER (Ini yang tadi hilang)
    const user = rows[0];

    // 3. Cek Password
    const match = await bcrypt.compare(password, user.password);
    
    if (!match) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // 4. Buat Token (Tanpa fallback, akan error jika .env tidak ada)
    // Pastikan JWT_SECRET ada di .env Anda
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.json({ 
      message: 'Login berhasil', 
      token: token,
      user: { id: user.id, email: user.email } 
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error); // Ini akan muncul jika JWT_SECRET hilang di .env
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = { login };   