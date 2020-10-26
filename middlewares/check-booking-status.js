'use strict';

require('dotenv').config();

/**
 * Local modules
 */

const AppError = require('../helpers/error');
const {Booking} = require('../models/booking');

/**
 * Exports
 */

module.exports = (req, res, next) => {
    const userId = req.userData.userId;
    const bookingId = req.query.id;

    Booking.findOne({_id: bookingId, user: userId})
        .exec()
        .then(booking => {
            if (booking.enRoute) {
                next(new AppError(400, 'Can not revoke the booking which is en route'))
            } else {
                next();
            }
        })
        .catch(err => next(new AppError(err.statusCode, 'The booking was not found')));
};