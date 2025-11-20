const express = require('express');
const router = express.Router();
const { getMunicipalities } = require('../controllers/locationController'); 

router.get('/municipalities', getMunicipalities);

module.exports = router;