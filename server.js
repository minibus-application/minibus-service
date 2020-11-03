'use strict';

require('dotenv').config();

/**
 * Modules
 */

const mongoose = require('mongoose');
const cron = require('node-cron');
const moment = require('moment');
const crypto = require('crypto');
const _ = require('lodash');
const http = require('http');

/**
 * Local modules
 */

const app = require('./application');
const AppError = require('./helpers/error');
const {Booking} = require('./models/booking');
const {User} = require('./models/user');

/**
 * Main
 */

let mongodbUrl;
const port = process.env.PORT || 3000;

if (process.env.MONGO_URI) {
    // JWT_SECRET key should be passed as env variable
    mongodbUrl = process.env.MONGO_URI; // atlas mongodb uri
} else {
    // assuming that the launch is going to be performed in a Docker container
    process.env.JWT_SECRET = crypto.randomBytes(64).toString('base64');
    mongodbUrl = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=admin`;
}


const server = http.createServer(app);

function listen() {
    console.log('Database connection has established!');
    server.listen(port, () => {
        console.log(`The app is listening on port ${port}!`)
    })
}

mongoose.connection
    .on('error', console.log)
    .once('open', listen);

mongoose.connect(mongodbUrl, {
    keepAlive: true,
    family: 4,
    useCreateIndex: true,
    autoIndex: true,
    poolSize: 10,
    bufferMaxEntries: 0,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

/**
 * Process hooks
 */

process.on('uncaughtException', (err) => {
    console.log(`Caught exception: ${err}`);
});

process.on('SIGTERM', (signal) => {
    console.log(signal);
    mongoose.connection.close(() => console.log('Mongoose disconnected on app termination'));
    server.close();
});

/**
 * Cron job
 */

// cron to update bookings status depending on start and end time
cron.schedule('*/1 * * * *', async function () {
    // find all booked route trips that are already started but active
    Booking.find({$expr: {$and: [{$lt: ['$startDate', new Date()]}, {$eq: ['$active', true]}]}})
        .exec()
        .then(result => {
            if (result.length > 0) {
                result.forEach(async b => {
                    try {
                        if (moment().isAfter(moment(b.endDate))) { // if the trip is already finished
                            await Booking.findOneAndUpdate({_id: b._id}, {enRoute: false, active: false}).exec();
                            await User.findOneAndUpdate({_id: b.user, enRouteBookingsCount: {$gt: 0}},
                                {$inc: {enRouteBookingsCount: -1, activeBookingsCount: -1}}).exec();
                        } else if (!b.enRoute) { // if the trip hasn't finished yet AND hasn't yet been marked as 'enRoute'
                            await Booking.findOneAndUpdate({_id: b._id}, {enRoute: true}).exec();
                            await User.findByIdAndUpdate(b.user, {$inc: {enRouteBookingsCount: 1}}).exec();
                        }
                    } catch (err) {
                        console.log(err);
                    }
                })
            }
        })
        .catch(err => new AppError(500, err.toString()))
});
