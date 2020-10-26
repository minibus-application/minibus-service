'use strict';

/**
 * Modules
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Local modules
 */

const {Route} = require('./route');
const {Vehicle} = require('./vehicle');

/**
 * Main
 */

const TripSchema = mongoose.Schema({
    _id: Schema.Types.ObjectId,
    cost: String,
    currency: String,
    seats: Schema.Types.Number,
    fromTime: String,
    toTime: String,
    duration: String,
    route: {
        type: Schema.Types.ObjectId,
        ref: Route.collection.name
    },
    vehicle: {
        type: Schema.Types.ObjectId,
        ref: Vehicle.collection.name
    }
}, {collection: 'trips', versionKey: false});

/**
 * Statics
 */

TripSchema.statics = {
    getLookup: (local, foreign) => {
        return {
            'from': Trip.collection.name,
            'let': {'var': `$${local}`},
            'pipeline': [
                {$match: {$expr: {$eq: [`$${foreign}`, '$$var']}}},
                {$lookup: Vehicle.getLookup('vehicle', '_id')},
                {$unwind: '$vehicle'},
                {$lookup: Route.getLookup('route', '_id')},
                {$unwind: '$route'}
            ],
            'as': local
        }
    }
};

const Trip = mongoose.model('Trip', TripSchema);

module.exports = {TripSchema, Trip};