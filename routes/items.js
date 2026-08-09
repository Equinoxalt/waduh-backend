const express = require('express');
const router = express.Router();
const { addItems, getTotals, deleteAll, getHistory, deleteByDate, getSessionTotals, getItemRows, updateItem, deleteItem } = require('../controllers/itemController');

router.post('/', addItems);
router.get('/totals', getTotals);
router.delete('/', deleteAll);
router.get('/history', getHistory);
router.delete('/history/:date', deleteByDate);
router.get('/session/:sessionId/totals', getSessionTotals);
router.get('/rows', getItemRows);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

module.exports = router;