const express = require('express');
const router = express.Router();
const { addItems, getTotals, deleteAll } = require('../controllers/itemController');

router.post('/', addItems);
router.get('/totals', getTotals);
router.delete('/', deleteAll);

module.exports = router;