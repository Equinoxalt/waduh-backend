const express = require('express');
const router = express.Router();
const { addItems, getTotals, deleteAll, getHistory, deleteByDate } = require('../controllers/itemController');

router.post('/', addItems);
router.get('/totals', getTotals);
router.delete('/', deleteAll);
router.get('/history', getHistory);
router.delete('/history/:date', deleteByDate);

module.exports = router;