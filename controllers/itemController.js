const pool = require('../config/database');

async function addItems(req, res) {
  try {
    const items = req.body.items;
    const userId = req.user.id;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items harus berupa array dan tidak boleh kosong' });
    }

    const validItems = [];
    const skippedLines = [];

    items.forEach((item, index) => {
      const name = String(item.name || '').trim();
      const quantity = Number(item.quantity);

      if (name && Number.isInteger(quantity) && quantity > 0) {
        validItems.push([userId, name, quantity]);
      } else {
        skippedLines.push(index + 1);
      }
    });

    if (validItems.length > 0) {
      await pool.query('INSERT INTO items (user_id, name, quantity) VALUES ?', [validItems]);
    }

    res.status(201).json({ inserted: validItems.length, skipped: skippedLines.length, skippedLines });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan data' });
  }
}

async function getTotals(req, res) {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      'SELECT name, SUM(quantity) AS total FROM items WHERE user_id = ? GROUP BY name ORDER BY name',
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
}

async function deleteAll(req, res) {
  try {
    const userId = req.user.id;
    await pool.query('DELETE FROM items WHERE user_id = ?', [userId]);
    res.json({ message: 'Semua data berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus data' });
  }
}

module.exports = { addItems, getTotals, deleteAll };