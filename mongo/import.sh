#! /bin/bash

mongoimport --host $MONGO_HOST --port $MONGO_PORT -u $MONGO_USER -p $MONGO_PASS --authenticationDatabase admin --db $MONGO_DB --collection carriers --file /data/carriers.json --jsonArray
mongoimport --host $MONGO_HOST --port $MONGO_PORT -u $MONGO_USER -p $MONGO_PASS --authenticationDatabase admin --db $MONGO_DB --collection cities --file /data/cities.json --jsonArray
mongoimport --host $MONGO_HOST --port $MONGO_PORT -u $MONGO_USER -p $MONGO_PASS --authenticationDatabase admin --db $MONGO_DB --collection routes --file /data/routes.json --jsonArray
mongoimport --host $MONGO_HOST --port $MONGO_PORT -u $MONGO_USER -p $MONGO_PASS --authenticationDatabase admin --db $MONGO_DB --collection trips --file /data/trips.json --jsonArray
mongoimport --host $MONGO_HOST --port $MONGO_PORT -u $MONGO_USER -p $MONGO_PASS --authenticationDatabase admin --db $MONGO_DB --collection vehicles --file /data/vehicles.json --jsonArray