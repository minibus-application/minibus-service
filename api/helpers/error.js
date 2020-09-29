'use strict';

module.exports = class AppError extends Error {
    constructor(statusCode, message) {
        super(message);

        if (message && message.includes('validation failed')) {
            this.statusCode = 500;
            this.status = message.split(':').pop().trim();
        } else {
            this.statusCode = statusCode;
            this.status = message;
        }

        Error.captureStackTrace(this, this.constructor);
    }
};
