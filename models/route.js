'use strict';

/**
 * Modules
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Local modules
 */

const {City} = require('./city');

/**
 * Main
 */

const RouteSchema = mongoose.Schema({
    _id: Schema.Types.ObjectId,
    from: {
        type: Schema.Types.ObjectId,
        ref: City.collection.name
    },
    to: {
        type: Schema.Types.ObjectId,
        ref: City.collection.name
    },
    opDays: Array,
    desc: String
}, {collection: 'routes', versionKey: false});

/**
 * Statics
 */

RouteSchema.statics = {
    getLookup: (local, foreign) => {
        return {
            'from': 'routes',
            'let': {'var': `$${local}`},
            'pipeline': [
                {$match: {$expr: {$eq: [`$${foreign}`, '$$var']}}},
                {$lookup: City.getLookup('from', '_id')},
                {$unwind: '$from'},
                {$lookup: City.getLookup('to', '_id')},
                {$unwind: '$to'},
            ],
            'as': local
        }
    },

    getOperationalDaysById: function (id, cb) {
        return this.findById(id).distinct('opDays').exec(cb);
    }
};

const Route = mongoose.model('Route', RouteSchema);

module.exports = {RouteSchema, Route};