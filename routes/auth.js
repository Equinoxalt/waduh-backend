const express = require('express');
const router = express.Router();
const { login, register, refreshAccessToken } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refreshAccessToken);

module.exports = router;