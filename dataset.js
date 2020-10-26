"use strict";

require("dotenv").config();

/**
 * Modules
 */

const fs = require('fs');
const _ = require('lodash');
const faker = require('faker');
const randexp = require('randexp').randexp;
const assert = require('chai').assert;
const moment = require('moment');
const ObjectId = require('mongoose').Types.ObjectId;

/**
 * General
 */

const regionsData = [
    {
        plateNumReg: "1",
        name: "Brest",
        region: "Bresckaja voblasć",
        station: "Brescki aŭtavakzal",
        lat: 52.099049,
        lng: 23.681711
    },
    {
        plateNumReg: "2",
        name: "Viciebsk",
        region: "Viciebskaja voblasć",
        station: "Viciebski aŭtavakzal",
        lat: 55.196372,
        lng: 30.187894
    },
    {
        plateNumReg: "3",
        name: "Homieĺ",
        region: "Homieĺskaja voblasć",
        station: "Homieĺski aŭtavakzal",
        lat: 52.434193,
        lng: 30.993189
    },
    {
        plateNumReg: "4",
        name: "Hrodna",
        region: "Hrodzienskaja voblasć",
        station: "Hrodzienski aŭtavakzal",
        lat: 53.677844,
        lng: 23.843776
    },
    {
        plateNumReg: "6",
        name: "Mahilioŭ",
        region: "Mahilioŭskaja voblasć",
        station: "Mahilioŭski aŭtavakzal",
        lat: 53.913142,
        lng: 30.34757
    },
    {
        plateNumReg: "7",
        name: "Minsk",
        region: "Minskaja voblasć",
        station: "Minski centralny aŭtavakzal",
        lat: 53.890245,
        lng: 27.554384
    },
];

const vehicleModels = [
    {make: "MBZ", model: "Sprinter"},
    {make: "MBZ", model: "Vito"},
    {make: "VW", model: "Crafter"},
    {make: "VW", model: "California"},
    {make: "Peugeout", model: "Boxer"}
];

const vehicleColors = ["#FFFFFF", "#808080", "#8B4513", "#000000", "#FFFF00", "#2E8B57"];

const currency = 'BYN',
    tripCostCoefficient = 20,
    averageVehicleSpeed = 90,
    averageVehicleCapacity = 15,
    acceptableCarrierRating = 3.9,
    firstTripHoursRange = [5, 8],
    firstTripMinutesRange = [5, 55],
    minRouteOperationDays = 3,
    regionsCount = regionsData.length,
    tripsPerRoute = 15,
    vehiclesPerRegion = (regionsCount - 1) * tripsPerRoute,
    vehicleCount = vehiclesPerRegion * regionsCount,
    routesCount = regionsCount * (regionsCount - 1),
    tripsCount = vehicleCount,
    carriersCount = 25,
    citiesCount = regionsCount;

/**
 * Generating Carrier dataset
 */

const carriers = Array.from({length: carriersCount}).map(n => {
    const generatedName = `${faker.lorem.word().toUpperCase()} Trans.`;
    const generatedRating = ceil(getRandom(2, 5), 10).toFixed(1);
    const calculatedCostFactor = ceil(generatedRating / acceptableCarrierRating, 10).toFixed(1);

    return {
        _id: new ObjectId,
        name: generatedName,
        rating: `${generatedRating}`,
        tripCostFactor: `${calculatedCostFactor}`
    }
});

assert.equal(carriers.length, carriersCount);

/**
 * Generating City dataset
 */

const cities = regionsData.map(obj => {
    return {
        _id: new ObjectId,
        name: obj.name,
        region: obj.region,
        station: obj.station,
        lat: obj.lat,
        lng: obj.lng
    }
});

assert.equal(cities.length, citiesCount);

/**
 * Generating Route dataset
 */

const routes = [];

cities.forEach((from) => {
    for (let i = 0; i < cities.length; i++) {
        const to = cities[i];
        if (to === from) continue;

        let desc = `${from.name} — ${to.name}`;
        routes.push({
            _id: new ObjectId,
            desc: desc,
            from: from._id,
            to: to._id,
            opDays: (() => {
                const reversedRoute = routes.find(obj => obj.desc === `${reverseRoute(desc)}`);

                if (reversedRoute) {
                    return reversedRoute.opDays;
                } else {
                    const days = [1, 2, 3, 4, 5, 6, 7];
                    return _.sampleSize(days, round(getRandom(days.length, minRouteOperationDays))).sort();
                }
            })()
        })
    }
});

assert.equal(routes.length, routesCount);

/**
 * Generating Trip and Vehicle datasets
 */

const vehicles = [];

function generateVehicleObj(regionNumber) {
    const vehicle = _.defaults(_.sample(vehicleModels), {color: _.sample(vehicleColors)});
    const vehicleObj = {
        _id: new ObjectId,
        color: vehicle.color,
        make: vehicle.make,
        model: vehicle.model,
        capacity: averageVehicleCapacity,
        plateNum: randexp(`[0-9]{4} [A-Z]{2}-${regionNumber}`),
        carrier: _.sample(carriers)._id
    };
    vehicles.push(vehicleObj);
    return vehicleObj;
}

const trips = [];

routes.forEach((route) => {
    const fromCity = regionsData.find(c => c.name === getFromCity(route.desc));
    const toCity = regionsData.find(c => c.name === getToCity(route.desc));
    const regionNum = fromCity.plateNumReg;

    const startHours = round(getRandom(firstTripHoursRange[0], firstTripHoursRange[1]));
    const startMinutes = ceil(getRandom(firstTripMinutesRange[0], firstTripMinutesRange[1]), 5);

    const tripDuration = getApproxDuration(fromCity.lat, fromCity.lng, toCity.lat, toCity.lng);
    const tripsInterval = getApproxInterval(tripDuration, tripsPerRoute, startHours);

    let tripStartTime = moment().hours(startHours).minutes(startMinutes).seconds(0).milliseconds(0);
    let tripEndTime = tripStartTime.clone().add(tripDuration, 'minutes');

    for (let i = 0; i < tripsPerRoute; i++) {
        const generatedVehicleObj = generateVehicleObj(regionNum);
        const carrierTripCostFactor = carriers.find(c => c._id === generatedVehicleObj.carrier).tripCostFactor;
        const finalTripCost = (tripDuration / tripCostCoefficient) * carrierTripCostFactor;
        const timeSpan = moment.duration(tripEndTime - tripStartTime);

        trips.push({
            _id: new ObjectId,
            cost: `${ceil(finalTripCost, 10)}`,
            currency: currency,
            fromTime: tripStartTime.format('HH:mm'),
            toTime: tripEndTime.format('HH:mm'),
            duration: `${moment.utc(timeSpan.asMilliseconds()).format("H[h] m[m]")}`,
            vehicle: generatedVehicleObj._id,
            route: route._id
        });

        tripStartTime = tripStartTime.add(tripsInterval, 'minutes');
        tripEndTime = tripStartTime.clone().add(tripDuration, 'minutes');
    }
});

assert.equal(vehicles.length, vehicleCount);
assert.equal(trips.length, tripsCount);

/**
 * Writing to files
 */

(function() {
    const dataDir = 'data';
    fs.existsSync(dataDir) || fs.mkdirSync(dataDir);
    fs.writeFile(`${dataDir}/carriers.json`, JSON.stringify(carriers, null, 2), err => { if(err) console.log(err) });
    fs.writeFile(`${dataDir}/cities.json`, JSON.stringify(cities, null, 2), err => { if(err) console.log(err) });
    fs.writeFile(`${dataDir}/routes.json`, JSON.stringify(routes, null, 2), err => { if(err) console.log(err) });
    fs.writeFile(`${dataDir}/vehicles.json`, JSON.stringify(vehicles, null, 2), err => { if(err) console.log(err) });
    fs.writeFile(`${dataDir}/trips.json`, JSON.stringify(trips, null, 2), err => { if(err) console.log(err) });
})();

/**
 * Helpers
 */

function reverseRoute(route) {
    return route.split(' — ').reverse().join(' — ').trim();
}

function getFromCity(route) {
    return route.split(' — ')[0];
}

function getToCity(route) {
    return route.split(' — ')[1];
}

// took from https://stackoverflow.com/a/21623206
function calcApproxDistance(lat1, lng1, lat2, lng2) {
    let p = 0.017453292519943295;
    let c = Math.cos;
    let a = 0.5 - c((lat2 - lat1) * p) / 2
        + c(lat1 * p) * c(lat2 * p)
        * (1 - c((lng2 - lng1) * p)) / 2;
    return 12742 * Math.asin(Math.sqrt(a));
}

function getApproxDuration(lat1, lng1, lat2, lng2) {
    return Math.floor((calcApproxDistance(lat1, lng1, lat2, lng2) / averageVehicleSpeed) * 60);
}

function getApproxInterval(d, n, t1) {
    return ((((24 - t1) - 2) * 60) - d) / n;
}

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

function round(number) {
    return Math.round(number);
}

function ceil(number, factor) {
    return Math.ceil(number * factor) / factor;
}
