const express = require('express');
const router = express.Router();
const { getCountries } = require('../controllers/countryController'); 

router.get('/', getCountries); 

module.exports = router;