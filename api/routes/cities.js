'use strict';

/**
 * Modules
 */

const express = require('express');
const router = express.Router();

/**
 * Local modules
 */

const CitiesController = require('./../controllers/cities_controller');

/**
 * Routers
 */

// GET request for all cities
router.get("/", CitiesController.getAll);

// GET request for cities filtered excluding given city: /exclude?id=
router.get("/exclude", CitiesController.getWithoutCity);

module.exports = router;