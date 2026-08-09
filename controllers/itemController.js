const pool = require('../config/database');
const crypto = require('crypto');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function addItems(req, res) {
  try {
    const items = req.body.items;
    const userId = req.user.id;
    let sessionId = req.body.sessionId;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items harus berupa array dan tidak boleh kosong' });
    }

    if (!sessionId || !UUID_PATTERN.test(sessionId)) {
      sessionId = crypto.randomUUID();
    }

    const validItems = [];
    const skippedLines = [];

    items.forEach((item, index) => {
      const name = String(item.name || '').trim();
      const quantity = Number(item.quantity);

      if (name && Number.isInteger(quantity) && quantity > 0) {
        validItems.push([userId, name, quantity, sessionId]);
      } else {
        skippedLines.push(index + 1);
      }
    });

    if (validItems.length > 0) {
      await pool.query('INSERT INTO items (user_id, name, quantity, session_id) VALUES ?', [validItems]);
    }

    res.status(201).json({
      inserted: validItems.length,
      skipped: skippedLines.length,
      skippedLines,
      sessionId: validItems.length > 0 ? sessionId : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan data' });
  }
}

async function getSessionTotals(req, res) {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const [rows] = await pool.query(
      'SELECT name, SUM(quantity) AS total FROM items WHERE user_id = ? AND session_id = ? GROUP BY name ORDER BY name',
      [userId, sessionId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil total sesi' });
  }
}

async function getTotals(req, res) {
  try {
    const userId = req.user.id;
    const scope = req.query.scope || 'today';

    let dateFilter = '';
    if (scope === 'today') {
      dateFilter = 'AND DATE(created_at) = CURDATE()';
    } else if (scope === 'month') {
      dateFilter = 'AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())';
    } else if (scope === 'all') {
      dateFilter = '';
    } else {
      return res.status(400).json({ error: 'scope harus today, month, atau all' });
    }

    const [rows] = await pool.query(
      `SELECT name, SUM(quantity) AS total FROM items WHERE user_id = ? ${dateFilter} GROUP BY name ORDER BY name`,
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

async function getHistory(req, res) {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS date, name, SUM(quantity) AS total
       FROM items WHERE user_id = ?
       GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d'), name
       ORDER BY date DESC, name ASC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil riwayat' });
  }
}

async function deleteByDate(req, res) {
  try {
    const userId = req.user.id;
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Format tanggal tidak valid' });
    }
    await pool.query('DELETE FROM items WHERE user_id = ? AND DATE(created_at) = ?', [userId, date]);
    res.json({ message: `Data tanggal ${date} berhasil dihapus` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus data' });
  }
}

async function getItemRows(req, res) {
  try {
    const userId = req.user.id;
    const { name, sessionId, scope, date } = req.query;

    if (!name) {
      return res.status(400).json({ error: 'Parameter name wajib diisi' });
    }

    let filterClause = '';
    const params = [userId, name];

    if (sessionId) {
      filterClause = 'AND session_id = ?';
      params.push(sessionId);
    } else if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Format tanggal tidak valid' });
      }
      filterClause = 'AND DATE(created_at) = ?';
      params.push(date);
    } else if (scope === 'today') {
      filterClause = 'AND DATE(created_at) = CURDATE()';
    } else if (scope === 'month') {
      filterClause = 'AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())';
    } else if (scope === 'all') {
      filterClause = '';
    } else {
      return res.status(400).json({ error: 'Harus sertakan salah satu: sessionId, date, atau scope' });
    }

    const [rows] = await pool.query(
      `SELECT id, name, quantity, created_at FROM items WHERE user_id = ? AND name = ? ${filterClause} ORDER BY created_at ASC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil detail item' });
  }
}

async function updateItem(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const name = String(req.body.name || '').trim();
    const quantity = Number(req.body.quantity);

    if (!name || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Nama dan jumlah harus valid' });
    }

    const [result] = await pool.query(
      'UPDATE items SET name = ?, quantity = ? WHERE id = ? AND user_id = ?',
      [name, quantity, id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item tidak ditemukan' });
    }
    res.json({ message: 'Item berhasil diperbarui' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memperbarui item' });
  }
}

async function deleteItem(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM items WHERE id = ? AND user_id = ?', [id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item tidak ditemukan' });
    }
    res.json({ message: 'Item berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus item' });
  }
}

module.exports = { addItems, getTotals, deleteAll, getHistory, deleteByDate, getSessionTotals, getItemRows, updateItem, deleteItem };