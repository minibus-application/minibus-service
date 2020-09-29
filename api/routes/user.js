'use strict';

/**
 * Modules
 */

const express = require('express');
const router = express.Router();

/**
 * Local modules
 */

const UserController = require('./../controllers/user_controller');
const checkToken = require('../middlewares/check-auth');
const checkBookingStatus = require('../middlewares/check-booking-status');

/**
 * Routes
 */

// GET request to get user information: /user?history=
router.get('/', checkToken, UserController.getInfo);

// POST request to create a user
router.post('/create', UserController.create);

// POST request to authenticate a user
router.post('/auth', UserController.authenticate);

// DELETE request to revoke user booking: /revokeBooking?id=
router.delete('/revokeBooking', checkToken, checkBookingStatus, UserController.revokeBooking);

module.exports = router;