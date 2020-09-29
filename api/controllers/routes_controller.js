'use strict';

/**
 * Local modules
 */

const {Route} = require("../models/route");
const {City} = require("../models/city");
const AppError = require('./../helpers/error');

/**
 * Exports
 */

exports.getByCities = (req, res, next) => {
    Route.findOne({from: req.query.fromId, to: req.query.toId})
        .populate({path: 'from', model: City})
        .populate({path: 'to', model: City})
        .exec()
        .then(route => res.status(200).json(route))
        .catch(err => next(new AppError(err.statusCode, 'The route was not found')));
};

exports.getAll = (req, res, next) => {
    Route.aggregate([
        {
            $lookup: {
                from: "cities",
                localField: "from",
                foreignField: "_id",
                as: "from",
            },
        },
        {$unwind: '$from'},
        {
            $lookup: {
                from: "cities",
                localField: "to",
                foreignField: "_id",
                as: "to",
            },
        },
        {$unwind: '$to'},
    ])
        .exec()
        .then(routes => {
            if (!routes || routes.length === 0) next(new AppError());

            res.status(200).json(routes)
        })
        .catch(err => next(new AppError(err.statusCode, 'No routes were found')));
};
