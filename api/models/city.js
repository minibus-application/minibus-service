'use strict';

/**
 * Modules
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Main
 */

const CitySchema = mongoose.Schema({
    _id: Schema.Types.ObjectId,
    name: String,
    region: String,
    station: String,
    lat: Schema.Types.Number,
    lng: Schema.Types.Number
}, {collection: 'cities', versionKey: false});

/**
 * Statics
 */

CitySchema.statics = {
    getLookup: (local, foreign) => {
        return {
            'from': City.collection.name,
            'let': {'var': `$${local}`},
            'pipeline': [{$match: {$expr: {$eq: [`$${foreign}`, '$$var']}}}],
            'as': local
        }
    }
};

const City = mongoose.model('City', CitySchema);

module.exports = {CitySchema, City};