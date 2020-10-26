'use strict';

/**
 * Modules
 */

const express = require('express');
const router = express.Router();

/**
 * Local modules
 */

const TripsController = require('../controllers/trips_controller');
const checkToken = require('../middlewares/check-auth');
const checkTripDate = require('../middlewares/check-trip-date');
const checkBookingLimit = require('../middlewares/check-booking-limit');

/**
 * Routers
 */

// GET request for fetching route schedule for a given date: ?tripDate=&routeId=
router.get('/filterBy', checkTripDate, TripsController.getSchedule);

// POST request to book a trip: ?tripDate=&routeId=&tripId=&seats=
router.post('/', checkToken, checkTripDate, checkBookingLimit, TripsController.bookTrip);

module.exports = router;