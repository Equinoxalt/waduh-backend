const express = require('express');
const router = express.Router();
const { getPrices, setPrice } = require('../controllers/priceController');

router.get('/', getPrices);
router.put('/', setPrice);

module.exports = router;