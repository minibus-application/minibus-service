'use strict';

/**
 * Modules
 */

const chalk = require('chalk');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const express = require("express");
const app = express();

/**
 * Local modules
 */

// init mongodb models
require("./api/models/carrier");
require("./api/models/vehicle");
require("./api/models/city");
require("./api/models/route");
require("./api/models/trip");
require("./api/models/user");
require("./api/models/booking");

// import Routers
const citiesRouter = require("./api/routes/cities");
const scheduleRouter = require("./api/routes/schedule");
const userRouter = require("./api/routes/user");
const routesRouter = require("./api/routes/routes");

/**
 * Main
 */

// headers
app.use(helmet());

// logger middleware
morgan.token('body', (req, res) => JSON.stringify(req.body));
app.use(morgan(function (tokens, req, res) {
    return [
        chalk.red('[Morgan]'),
        chalk.blue(`[${tokens.date(req, res)}]`),
        chalk.green(`${tokens.method(req, res)}`),
        chalk.green(`${tokens.status(req, res)}`),
        chalk.blue(tokens.url(req, res)),
        chalk.magenta(tokens['response-time'](req, res) + ' ms'),
        chalk.yellow(tokens['remote-addr'](req, res)),
        chalk.yellow(tokens['user-agent'](req, res)),
        chalk.gray(`body: ${tokens['body'](req, res)}`)
    ].join(' ');
}));

// parsers
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());

// routers
app.use("/cities", citiesRouter);
app.use("/schedule", scheduleRouter);
app.use("/user", userRouter);
app.use("/routes", routesRouter);

// error middleware
app.use((err, req, res, next) => {
    console.log(err);

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'Oops, something went wrong!';

    res.status(err.statusCode).json({
        success: false,
        code: err.statusCode,
        message: err.status
    });
});

app.use((req, res) => {
    const code = 404;

    res.status(code).json({
        success: false,
        code: code,
        message: 'Not found'
    });
});

module.exports = app;
