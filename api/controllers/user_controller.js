'use strict';

/**
 * Modules
 */

const _ = require('lodash');

/**
 * Local modules
 */

const AppError = require('./../helpers/error');
const ObjectId = require('mongoose').Types.ObjectId;
const {User} = require('../models/user');
const {Booking} = require('../models/booking');

/**
 * Exports
 */

exports.authenticate = (req, res, next) => {
    User.findOne({phone: req.body.phone})
        .exec()
        .then(user => {
            if (user) {
                user.comparePassword(req.body.password, function(match) {
                    if (match) {
                        User.findWithBookings({_id: user._id}, (result) => {
                            res.status(200).json(_.defaults(result, {token: user.getAuthToken()}));
                        });
                    } else {
                        next(new AppError(401, 'User password is incorrect'))
                    }
                });
            } else {
                next(new AppError(401, 'User does not exist'))
            }
        })
        .catch(err => next(new AppError(err.statusCode, err.message)))
};

exports.create = (req, res, next) => {
    const user = new User(_.pick(req.body, ['name', 'phone']));
    user.password = user.encryptPassword(req.body.password);
    user._id = new ObjectId;

    user.save()
        .then(user => {
            User.findWithBookings({_id: user._id}, (result) => {
                res.status(200).json(_.defaults(result, {token: user.getAuthToken()}));
            });
        })
        .catch(err => next(new AppError(err.statusCode, err.message)));
};

exports.getInfo = (req, res, next) => {
    User.findById(req.userData.userId)
        .exec()
        .then(user => {
            User.findWithBookings({_id: user._id, history: req.query.history}, (result) => {
                res.status(200).json(_.defaults(result, {token: null}));
            });
        })
        .catch(err => next(new AppError(err.statusCode, err.message)))
};

exports.revokeBooking = (req, res, next) => {
    const userId = req.userData.userId;
    const bookingId = req.query.id;

    Booking.findOneAndRemove({_id: bookingId, user: userId})
        .exec()
        .then(result => {
            User.findWithBookings({_id: req.userData.userId}, (result) => {
                res.status(200).json(_.defaults(result, {token: null}));
            });
        })
        .catch(err => next(new AppError(err.statusCode, err.message)))
};
