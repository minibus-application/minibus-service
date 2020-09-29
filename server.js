'use strict';

require('dotenv').config();

/**
 * Modules
 */

const mongoose = require('mongoose');
const cron = require('node-cron');
const moment = require('moment');
const _ = require('lodash');
const {Booking} = require('./api/models/booking');
const {User} = require('./api/models/user');
const http = require('http');
const port = process.env.PORT || 3000;

/**
 * Local modules
 */

const app = require('./application');

/**
 * Main
 */

const mongodbUrl = `mongodb+srv://admin:${process.env.MONGO_PASS}@cluster-0.sqgnv.gcp.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`;
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
    console.log(err);
});

process.on('SIGTERM', (signal) => {
    console.log(signal);
    mongoose.connection.close(() => console.log('Mongoose disconnected on app termination'));
    server.close();
});

/**
 * Cron job
 */

cron.schedule('*/1 * * * *', async function () {
    Booking.find({$expr: {$and: [{$lt: ['$startDate', new Date()]}, {$eq: ['$active', true]}]}})
        .exec()
        .then(result => {
            if (result.length > 0) {
                result.forEach(async b => {
                    try {
                        if (moment().isAfter(moment(b.endDate))) {
                            await Booking.findOneAndUpdate({_id: b._id}, {enRoute: false, active: false}).exec();
                            await User.findOneAndUpdate({_id: b.user, enRouteBookingsCount: {$gte: 0}},
                                {$inc: {enRouteBookingsCount: -1, activeBookingsCount: -1}}).exec();
                        } else if (!b.enRoute) {
                            await Booking.findOneAndUpdate({_id: b._id}, {enRoute: true}).exec();
                            await User.findByIdAndUpdate(b.user, {$inc: {enRouteBookingsCount: 1}}).exec();
                        }
                    } catch (err) {
                        console.log(err);
                    }

                })
            }
        })
        .catch(err => console.log(err))
});
