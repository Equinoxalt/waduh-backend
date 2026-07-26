const pool = require('../config/database');

// POST /api/items - terima banyak item sekaligus (persis tombol "Hitung" di app lama)
async function addItems(req, res) {
  try {
    const items = req.body.items; // array of { name, quantity }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items harus berupa array dan tidak boleh kosong' });
    }

    // validasi tiap baris - di app lama baris yang salah dilewati diam-diam,
    // sekarang kita catat baris mana saja yang dilewati supaya bisa ditampilkan ke user
    const validItems = [];
    const skippedLines = [];

    items.forEach((item, index) => {
      const name = String(item.name || '').trim();
      const quantity = Number(item.quantity);

      if (name && Number.isInteger(quantity) && quantity > 0) {
        validItems.push([name, quantity]);
      } else {
        skippedLines.push(index + 1);
      }
    });

    if (validItems.length > 0) {
      await pool.query('INSERT INTO items (name, quantity) VALUES ?', [validItems]);
    }

    res.status(201).json({
      inserted: validItems.length,
      skipped: skippedLines.length,
      skippedLines,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan data' });
  }
}

// GET /api/items/totals - rekap total per nama (padanan calculateTotal() lama)
async function getTotals(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT name, SUM(quantity) AS total FROM items GROUP BY name ORDER BY name'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
}

// DELETE /api/items - hapus semua (padanan tombol "Hapus Hasil")
async function deleteAll(req, res) {
  try {
    await pool.query('DELETE FROM items');
    res.json({ message: 'Semua data berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus data' });
  }
}

module.exports = { addItems, getTotals, deleteAll };