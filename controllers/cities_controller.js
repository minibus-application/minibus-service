'use strict';

/**
 * Local modules
 */

const {City} = require("../models/city");
const AppError = require('../helpers/error');

/**
 * Exports
 */

exports.getAll = (req, res, next) => {
    City.find({})
        .exec()
        .then(cities => res.status(200).json(cities))
        .catch(err => next(new AppError(err.statusCode, 'No cities were found')));
};

exports.getWithoutCity = (req, res, next) => {
    const cityId = req.query.id;

    if (cityId) {
        City.find().where('_id').ne(cityId)
            .exec()
            .then(cities => res.status(200).json(cities))
            .catch(err => next(new AppError(err.statusCode, 'No cities were found')))
    } else {
        next(new AppError(404))
    }
};
