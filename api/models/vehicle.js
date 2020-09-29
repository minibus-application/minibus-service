'use strict';

/**
 * Modules
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Local modules
 */

const {Carrier} = require('../models/carrier');

/**
 * Main
 */

const VehicleSchema = mongoose.Schema({
    _id: Schema.Types.ObjectId,
    plateNum: String,
    color: String,
    make: String,
    model: String,
    capacity: Schema.Types.Number,
    carrier: {
        type: Schema.Types.ObjectId,
        ref: Carrier.collection.name
    }
}, {collection: 'vehicles', versionKey: false});

/**
 * Statics
 */

VehicleSchema.statics = {
    getLookup: (local, foreign) => {
        return {
            'from': Vehicle.collection.name,
            'let': {'var': `$${local}`},
            'pipeline': [
                {$match: {$expr: {$eq: [`$${foreign}`, '$$var']}}},
                {$lookup: Carrier.getLookup('carrier', '_id')},
                {$unwind: '$carrier'},
            ],
            'as': local
        }
    }
};

const Vehicle = mongoose.model('Vehicle', VehicleSchema);

module.exports = {VehicleSchema, Vehicle};