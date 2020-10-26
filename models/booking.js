'use strict';

/**
 * Modules
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Local modules
 */

const {Trip} = require('.//trip');
const {User} = require('.//user');

/**
 * Main
 */

const BookingSchema = mongoose.Schema({
    _id: Schema.Types.ObjectId,
    user: {
        type: Schema.Types.ObjectId,
        ref: User.collection.name,
        required: true
    },
    trip: {
        type: Schema.Types.ObjectId,
        ref: Trip.collection.name,
        required: true
    },
    tripDate: String,
    startDate: Schema.Types.Date,
    endDate: Schema.Types.Date,
    enRoute: {
        type: Schema.Types.Boolean,
        required: true,
        default: false
    },
    active: {
        type: Schema.Types.Boolean,
        required: true,
        default: true
    }
}, {versionKey: false, collection: 'bookings'});

/**
 * Statics
 */

BookingSchema.statics = {
    getLookup: (local, foreign) => {
        return {
            'from': Booking.collection.name,
            'let': {'var': `$${local}`},
            'pipeline': [
                {$match: {$expr: {$eq: [`$${foreign}`, '$$var']}}},
                {$lookup: Vehicle.getLookup('vehicle')},
                {$unwind: '$vehicle'},
            ],
            'as': local
        }
    },

    countByTripId: function (tripId, date, cb) {
        return this.countDocuments({$expr: {$and: [{$eq: ['$tripDate', date]}, {$eq: ['$trip', tripId]}]}}).exec(cb)
    },

    countActiveByUserId: function (userId, cb) {
        return this.countDocuments({user: userId, active: {$eq: true}}).exec(cb)
    }
};

/**
 * Post hooks
 */

BookingSchema.post('findOneAndRemove', async function(result) {
    await User.findByIdAndUpdate(result.user, {$inc: {totalBookingsCount: -1, activeBookingsCount: -1}}).exec();
});

BookingSchema.post('insertMany', async function(result) {
    const userId = result[0].user;
    await User.findByIdAndUpdate(userId, {$inc: {totalBookingsCount: result.length, activeBookingsCount: result.length}}).exec();
});

const Booking = mongoose.model('Booking', BookingSchema);

module.exports = {BookingSchema, Booking};