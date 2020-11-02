'use strict';

require("dotenv").config();

/**
 * Modules
 */

const ObjectId = require('mongoose').Types.ObjectId;
const moment = require('moment');
const _ = require('lodash');

/**
 * Local modules
 */

const AppError = require('../helpers/error');
const {Trip} = require('../models/trip');
const {User} = require('../models/user');
const {Route} = require('../models/route');
const {Vehicle} = require('../models/vehicle');
const {Carrier} = require('../models/carrier');
const {City} = require('../models/city');
const {Booking} = require('../models/booking');

/**
 * Exports
 */

exports.bookTrip = (req, res, next) => {
    const userId = req.userData.userId;
    const tripDate = req.query.tripDate;
    const tripId = req.query.tripId;
    const seats = Number(req.query.seats);

    Trip.findById(tripId)
        .populate({path: 'vehicle', model: Vehicle})
        .exec()
        .then(trip => {
            if (trip) {
                if (moment().isSame(moment(tripDate), 'day') && moment().isAfter(moment(trip.fromTime, 'h:mm a'))) {
                    throw new AppError(400, 'Booking is already closed for selected trip')
                }

                Booking.countByTripId(trip._id, tripDate, (err, result) => {
                    if (err) next(new AppError(err.statusCode, err.status));

                    if ((trip.vehicle.capacity - result) >= seats) {
                        const bookings = new Array(seats).fill(null).map(()=> (new Booking({
                            user: userId,
                            trip: tripId,
                            tripDate: tripDate,
                            startDate: moment(`${tripDate} ${trip.fromTime}`).toISOString(),
                            endDate:  moment(`${tripDate} ${trip.toTime}`).toISOString(),
                        })));

                        Booking.insertMany(bookings, {ordered: true})
                            .then(result => {
                                User.findWithBookings({_id: userId}, (result) => {
                                    res.status(200).json(_.defaults(result, {token: null}));
                                });
                            })
                            .catch(err => next(new AppError(err.statusCode, err.status)))
                    } else {
                        next(new AppError(400, 'There are no available seats for booking'));
                    }
                })
            } else {
                next(new AppError(404, 'The trip was not found'))
            }
        })
        .catch(err => next(new AppError(err.statusCode, err.status)))
};

exports.getSchedule = (req, res, next) => {
    const tripDate = req.query.tripDate;
    const routeId = req.query.routeId;

    Trip.aggregate([
        {$match: {'route': ObjectId(routeId)}},
        {
            $lookup: {
                'from': Vehicle.collection.name,
                'let': {'vehicle_id': '$vehicle'},
                'pipeline': [
                    {$match: {$expr: {$eq: ['$_id', '$$vehicle_id']}}},
                    {
                        $lookup: {
                            'from': Carrier.collection.name,
                            'let': {'carrier_id': '$carrier'},
                            'pipeline': [
                                {$match: {$expr: {$eq: ['$_id', '$$carrier_id']}}}
                            ],
                            'as': 'carrier'
                        }
                    },
                    {$unwind: '$carrier'},
                ],
                'as': 'vehicle'
            }
        },
        {$unwind: '$vehicle'},
        {
            $lookup: {
                'from': Booking.collection.name,
                'let': {'date': tripDate, 'trip_id': '$_id'},
                'pipeline': [{
                    $match: {
                        $expr: {
                            $and: [
                                {$eq: ['$tripDate', '$$date']},
                                {$eq: ['$trip', '$$trip_id']}
                            ]
                        }
                    }
                }],
                'as': 'seatsBooked'
            }
        },
        {$addFields: {'seatsBooked': {$size: '$seatsBooked'}}},
        {$sort: {'fromTime': 1}},
        {
            $lookup: {
                'from': Route.collection.name,
                'let': {'route_id': '$route'},
                'pipeline': [
                    {$match: {$expr: {$eq: ['$_id', '$$route_id']}}},
                    {
                        $lookup: {
                            'from': City.collection.name,
                            'let': {'from_id': '$from'},
                            'pipeline': [
                                {$match: {$expr: {$eq: ['$_id', '$$from_id']}}}
                            ],
                            'as': 'from'
                        }
                    },
                    {$unwind: '$from'},
                    {
                        $lookup: {
                            'from': City.collection.name,
                            'let': {'to_id': '$to'},
                            'pipeline': [
                                {$match: {$expr: {$eq: ['$_id', '$$to_id']}}}
                            ],
                            'as': 'to'
                        }
                    },
                    {$unwind: '$to'},
                ],
                'as': 'route'
            }
        },
        {$group: {'_id': '$route', 'timeline': {$push: '$$ROOT'}}},
        {$project: {'_id': 0, 'route': '$_id', 'timeline': 1}},
        {$unwind: '$route'},
        {$unset: ['timeline.route']}
    ])
        .exec()
        .then(results => {
            let result = results[0];

            if (result.timeline) {
                if (moment().isSame(moment(tripDate), 'day')) {
                    // filtering the timeline by the current Belarus time
                    result.timeline = _.filter(result.timeline, function(trip) {
                        return moment().isBefore(moment(trip.fromTime, 'h:mm a'));
                    });
                }
            }
            res.status(200).json(result)
        })
        .catch(err => next(new AppError(err.statusCode, err.status)))
};
