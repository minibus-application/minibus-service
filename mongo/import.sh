#! /bin/bash

mongoimport --host minibus-mongodb --port 27017 -u user -p test --authenticationDatabase admin --db minibus --collection carriers --file /data/carriers.json --jsonArray
mongoimport --host minibus-mongodb --port 27017 -u user -p test --authenticationDatabase admin --db minibus --collection cities --file /data/cities.json --jsonArray
mongoimport --host minibus-mongodb --port 27017 -u user -p test --authenticationDatabase admin --db minibus --collection routes --file /data/routes.json --jsonArray
mongoimport --host minibus-mongodb --port 27017 -u user -p test --authenticationDatabase admin --db minibus --collection trips --file /data/trips.json --jsonArray
mongoimport --host minibus-mongodb --port 27017 -u user -p test --authenticationDatabase admin --db minibus --collection vehicles --file /data/vehicles.json --jsonArray