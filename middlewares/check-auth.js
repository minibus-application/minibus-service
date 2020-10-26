'use strict';

require('dotenv').config();

/**
 * Modules
 */

const jwt = require('jsonwebtoken');

/**
 * Local modules
 */

const AppError = require('../helpers/error');

/**
 * Exports
 */

module.exports = (req, res, next) => {
    try {
        req.userData = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
        next();
    } catch (err) {
        next(new AppError(401, 'Invalid token'))
    }
};