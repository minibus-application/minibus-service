'use strict';

/**
 * Modules
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Main
 */

const CarrierSchema = mongoose.Schema({
    _id: Schema.Types.ObjectId,
    name: String,
    rating: String,
    tripCostFactor: String
}, {collection: 'carriers', versionKey: false});

/**
 * Statics
 */

CarrierSchema.statics = {
    getLookup: (local, foreign) => {
        return {
            'from': Carrier.collection.name,
            'let': {'var': `$${local}`},
            'pipeline': [{$match: {$expr: {$eq: [`$${foreign}`, '$$var']}}}],
            'as': local
        }
    }
};

const Carrier = mongoose.model('Carrier', CarrierSchema);

module.exports = {CarrierSchema, Carrier};