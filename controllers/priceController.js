const pool = require('../config/database');

async function getPrices(req, res) {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query('SELECT name, price FROM item_prices WHERE user_id = ?', [userId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data harga' });
  }
}

async function setPrice(req, res) {
  try {
    const userId = req.user.id;
    const name = String(req.body.name || '').trim();
    const price = Number(req.body.price);

    if (!name || !Number.isInteger(price) || price < 0) {
      return res.status(400).json({ error: 'Nama dan harga harus valid' });
    }

    await pool.query(
      'INSERT INTO item_prices (user_id, name, price) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE price = ?',
      [userId, name, price, price]
    );

    res.json({ message: 'Harga berhasil disimpan' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan harga' });
  }
}

module.exports = { getPrices, setPrice };