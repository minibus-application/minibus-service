'use strict';

require('dotenv').config();

/**
 * Modules
 */

const moment = require('moment');

/**
 * Local modules
 */

const AppError = require('./../helpers/error');
const {Route} = require('./../models/route');

/**
 * Exports
 */

module.exports = (req, res, next) => {
    const tripDate = moment(req.query.tripDate);
    let routeId = req.query.routeId;

    if (tripDate.diff(moment(), 'days') < 0) {
        next(new AppError(400, 'Departure date cannot be in past'));
    } else {
        Route.getOperationalDaysById(routeId, (err, opDays) => {
            if (err) next(new AppError(400, 'An error while finding the route'));

            if (opDays.length > 0) {
                if (opDays.includes(tripDate.isoWeekday())) {
                    next();
                } else {
                    next(new AppError(400, 'The route is closed for selected day'));
                }
            } else {
                next(new AppError());
            }
        })
    }
};