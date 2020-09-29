'use strict';

require('dotenv').config();

/**
 * Local modules
 */

const AppError = require('./../helpers/error');
const {Booking} = require('./../models/booking');

/**
 * Exports
 */

module.exports = (req, res, next) => {
    const userId = req.userData.userId;
    const seats = Number(req.query.seats);
    const activeBookingsLimit = 3;

    Booking.countActiveByUserId(userId, (err, result) => {
        if (result === activeBookingsLimit || seats > (activeBookingsLimit - result)) {
            next(new AppError(400, `Active bookings limit exceeded: ${activeBookingsLimit} max`));
        } else {
            next();
        }
    });
};