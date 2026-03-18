const express = require('express');
const router = express.Router();
const {
  getDepartments
} = require('../controllers/departmentController');

router.get('/departments', getDepartments);

module.exports = router;
