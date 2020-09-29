'use strict';

/**
 * Modules
 */

const express = require('express');
const router = express.Router();

/**
 * Local modules
 */

const RoutesController = require('./../controllers/routes_controller');

/**
 * Routers
 */

// GET request for finding a route by departure and arrival cities: filterBy?fromId=&toId=
router.get('/filterBy', RoutesController.getByCities);

// GET request for finding all routes
router.get('/', RoutesController.getAll);

module.exports = router;