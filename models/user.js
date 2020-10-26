'use strict';

require('dotenv').config();

/**
 * Modules
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const moment = require('moment');
const ObjectId = mongoose.Types.ObjectId;
const _ = require('lodash');
const Schema = mongoose.Schema;

/**
 * Local modules
 */

const {Trip} = require('./trip');
const AppError = require('../helpers/error');

/**
 * Main
 */

const UserSchema = new mongoose.Schema({
    _id: Schema.Types.ObjectId,
    name: {
        type: String,
        trim: true,
        required: [true, 'User name is required']
    },
    phone: {
        type: String,
        trim: true,
        match: /^[+][0-9]{12}$/,
        required: [true, 'User phone number is required']
    },
    password: {
        type: String,
        trim: true,
        required: [true, 'User password is required']
    },
    enRouteBookingsCount: {
        type: Schema.Types.Number,
        min: 0,
        default: 0
    },
    activeBookingsCount: {
        type: Schema.Types.Number,
        min: 0,
        default: 0
    },
    totalBookingsCount: {
        type: Schema.Types.Number,
        min: 0,
        default: 0
    },
    createdAt: {
        type: Schema.Types.Date,
        default: new Date()
    }
}, {versionKey: false, collection: 'users'});

/**
 * Validations
 */

UserSchema.path('phone').validate(async (phone) => {
    const count = await mongoose.models.User.countDocuments({phone: phone});
    return !count;
}, 'User with such phone number already exists');

/**
 * Methods
 */

UserSchema.methods = {

    getAuthToken: function () {
        return jwt.sign({
            userId: this._id,
            userPhone: this.phone
        }, process.env.JWT_SECRET);
    },

    comparePassword: function (plainPassword, cb) {
        bcrypt.compare(plainPassword, this.password, function (err, result) {
            cb(result)
        });
    },

    encryptPassword: function (plainPassword) {
        if (!plainPassword) return '';
        return bcrypt.hashSync(plainPassword, bcrypt.genSaltSync(10));
    }
};

/**
 * Statics
 */

UserSchema.statics = {

    findWithBookings: function (opts, cb) {
        return this.aggregate([
            {$match: {'_id': ObjectId(opts._id)}},
            {$group: {'_id': 0, 'user': {$push: '$$ROOT'}}},
            {$project: {'_id': 0, 'user': 1}},
            {$unwind: '$user'},
            {
                $lookup: {
                    'from': 'bookings',
                    'let': {'user_id': '$user._id'},
                    'pipeline': [
                        {$match: {$expr: {$eq: ['$user', '$$user_id']}}},
                        {$lookup: Trip.getLookup('trip', '_id')},
                        {$unwind: '$trip'}
                    ],
                    'as': 'bookings'
                }
            },
            {$unset: ['bookings.user']}
        ]).exec((err, results) => {
            if (err || results.length === 0) throw new AppError(err.statusCode, err.status);

            const result = results[0];

            if (result.bookings.length > 0) {
                // filtering user bookings depending on 'history' query
                if (opts.history === 'true') {
                    result.bookings = _.filter(result.bookings, (b) => !b.active)
                        .sort((o1, o2) => moment(o2.startDate) - moment(o1.startDate));
                }  else {
                    result.bookings = _.filter(result.bookings, (b) => b.active)
                        .sort((o1, o2) => {
                            return o1.enRoute === o2.enRoute ? moment(o1.startDate) - moment(o2.startDate) : o2.enRoute - o1.enRoute;
                        });
                }
            }

            result.user = _.omit(result.user, 'password');

            cb(result);
        })
    }
};

const User = new mongoose.model('User', UserSchema);

module.exports = {UserSchema, User};