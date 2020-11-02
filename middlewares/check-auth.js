'use strict';

require('dotenv').config();

/**
 * Modules
 */

const jwt = require('jsonwebtoken');
const {User} = require('../models/user');

/**
 * Local modules
 */

const AppError = require('../helpers/error');

/**
 * Exports
 */

module.exports = async (req, res, next) => {
    try {
        req.userData = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
        const userExist = await User.exists({ _id: req.userData.userId });
        if (!userExist) {
            next(new AppError(401, 'User does not exist'));
        }
        next();
    } catch (err) {
        next(new AppError(401, 'Invalid token'));
    }
};