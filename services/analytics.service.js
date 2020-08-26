"use strict";

const request = require('request');
const express = require("express");
const bodyParser = require('body-parser');
const DbService = require("../mixins/db.mixin");
const cors = require('cors');

let clients = [];
let stations = [];

module.exports = {
    name: "analytics",
    mixins: [
		DbService("movies", process.env.MONGO_EVENTS_URL)
	],
    
    settings: {
        port: process.env.PORT || 4002,
        
        fields: ["_id", "stationId", "latitude", "longitude", "name", "docks", "docks_available"],

		entityValidator: {
            stationId: { type: "string", min: 1 },
            latitude: { type: "string"},
            longitude: { type: "string"},
            name: { type: "string", min: 1 },
            docks: { type: "number" },
            docks_available: { type: "number"},
		}
    },
    async afterConnected()
    {//ID,Station Name,Total Docks,Docks in Service,Status,Latitude,Longitude,Location

        let db = await this.adapter.find({sort: ["stationId"]});
        console.log(db.length);
        if (db.length ==0)
        {
            console.log("//upis");
            let fs = require('fs'); 
            let me = this;       
            fs.readFile("services/Stations_In_Service.csv", 'utf8', async function(err, data) {
                if(err) {
                    return console.log(err);
                }
                let rows = data.split(/\r?\n/);
                rows.shift();
                rows.forEach(row => {
                    let data = row.split(',');
                    let doc = {
                        "stationId": data[0],
                        "latitude": data[5],
                        "longitude": data[6],
                        "name": data[1],
                        "docks": Number(data[3]),
                        "docks_available": 0
                    };
                    me.adapter.insert(doc);
                    let percentage = doc["docks"] !=0 ? doc["docks_available"]*100/doc["docks"] : 0;
                    doc["full_code"] = 0;
                    if(percentage == 0){
                        doc["full_code"] = 1;
                    }
                    if(percentage <= 10){
                        doc["full_code"] = 2;
                    }
                    if(percentage >= 90){
                        doc["full_code"] = 3;
                    }
                    if(percentage == 100){
                        doc["full_code"] = 4;
                    }
                    doc["percentage"] = percentage;
                    stations.push(doc);
                });
            });
        }
        else
        {
            db.forEach(element => {
                var doc = element;
                let percentage = doc["docks"] !=0 ? doc["docks_available"]*100/doc["docks"] : 0;
                doc["full_code"] = 0;
                if(percentage <= 10){
                    doc["full_code"] = 2;
                }
                if(percentage == 0){
                    doc["full_code"] = 1;
                }
                if(percentage >= 90){
                    doc["full_code"] = 3;
                }
                if(percentage == 100){
                    doc["full_code"] = 4;
                }
                doc["percentage"] = percentage;
                stations.push(doc);
            });
        }
    },
    methods: {
        initRoutes(app) {
            app.put("/fixed", this.putFixed);
            app.put("/brokendock", this.putBrokenDock);
            app.get("/events", this.eventsSub);
        },
        async putFixed(req, res)
        {
            const payload = req.body;
            let station = await this.adapter.find({ query: {"stationId": payload.stationId} });
            station = station[0];

            if (station == null)
            {
                request.post(process.env.COMMAND_URL + "notfixed", {
                    json: { "stationId": payload.stationId }
                }, (err, res, body) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    console.log(res.statusCode);
                    console.log(body);
                });

                return Promise.resolve()
                .then(() => {
                    return res.status(404).send("Station doesn't exist");
                })
                .catch(this.handleErr(res));
            }

            if(station.docks_available >= station.docks)
            {
                this.adapter.updateById(station._id, { $inc: { docks_available: -1}});
            }
            if(station.docks_available <= 0)
            {
                this.adapter.updateById(station._id, { $inc: { docks_available: +1}});
            }
            if(station.docks <= 0)
            {
                this.adapter.updateById(station._id, { $inc: { docks: +1}});
            }
            this.sendToWebDash(station, "add");
            return Promise.resolve()
                .then(() => {
                    return res.status(200).send("OK");
                })
                .catch(this.handleErr(res));
            
        },
        async putBrokenDock(req, res)
        {
            const payload = req.body;
            let station = await this.adapter.find({ query: {"stationId": payload.stationId} });
            station = station[0];
            console.log(station);
            
            if (station == null)
            {
                return Promise.resolve()
                .then(() => {
                    return res.status(404).send("Station doesn't exist");
                })
                .catch(this.handleErr(res));
            }

            if(station.docks == 1)
            {
                request.post(process.env.COMMAND_URL + "brokenstation", {
                    json: { "stationId": payload.stationId }
                }, (err, resp, body) => {
                    if (err) {
                        console.log(err);
                        return res.status(err.code).send(err.message);
                    }
                    console.log(res.statusCode);
                    console.log(body);
                });
                this.sendToWebDash(station, "remove");
                return Promise.resolve()
                .then(() => {
                    return res.status(201).send("Station out of active docks");
                })
                .catch(this.handleErr(res));
            }
            if (station.docks_available == 1)
            {
                // NEMA VISE MESTA ZA PARKIRANJE, sVE PUNO
                console.log("nema vise mesta za parkiranje na stanici " +station.stationId );
                request.put(process.env.COMMAND_URL + "full", {
                    json: {
                        stationId: station.stationId 
                    }
                }, (err, resp, body) => {
                    if (err) {
                        console.log(err);
                        return res.status(err.code).send(err.message);
                    }
                    console.log(res.statusCode);
                    console.log(body);
                });

            }
            this.adapter.updateById(station._id, { $inc: { docks_available: -1}});
            this.adapter.updateById(station._id, { $inc: { docks: -1}});
            this.sendToWebDash(station, "update");
            return Promise.resolve()
                .then(() => {
                    return res.status(200).send("OK");
                })
                .catch(this.handleErr(res));
            
        },
        eventsSub(req, res, next)
        {
            const headers = {
                'Content-Type':'text/event-stream',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache'
            };
            res.writeHead(200, headers);
            const data = "data: "+JSON.stringify(stations)+"\n\n";
            res.write(data);

            const clientId = Date.now();
            const newClient = {
                id: clientId,
                res
            };
            clients.push(newClient);

            req.on('close', () => {
                console.log(clientId+" Connection closed");
                clients = clients.filter(c => c.id !== clientId);
            });
        },
        sendToWebDash(station, code)
        {
            var doc = station;
            let percentage = doc["docks"] !=0 ? doc["docks_available"]*100/doc["docks"] : 0;
            doc["full_code"] = 0;
            if(percentage <= 10){
                doc["full_code"] = 2;
            }
            if(percentage == 0){
                doc["full_code"] = 1;
            }
            if(percentage >= 90){
                doc["full_code"] = 3;
            }
            if(percentage == 100){
                doc["full_code"] = 4;
            }
            doc["percentage"] = percentage;

            clients.forEach(c=> c.res.write("data: "+JSON.stringify(doc)+"\n\n"));
        },

        handleErr(res) {
            return err => {
                res.status(err.code || 500).send(err.message);
            };
        }
    },
    events: {
        "bike.num.up": {
            group: "other",
            async handler(payload){
                console.log(payload.stationId);
                let station = await this.adapter.find({ query: {"stationId": payload.stationId} });
                station = station[0];
                
                if (station == null || station.docks_available == 0)
                {
                    // GRESKA
                    console.log("Greska, stanica " +payload.stationId+ " se iskljucuje");
                    const body = {
                        stationId: payload.stationId,
                        errorCODE: "full"
                    };
                    console.log(body);

                    request.post(process.env.COMMAND_URL + "error", {
                        json: body
                    }, (err, res, body) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        console.log(res.statusCode);
                        console.log(body);
                    });
                    if(station!=null)
                    {
                        this.sendToWebDash(station, "remove");
                    }
                    return;
                }
                
                if (station.docks_available == 1)
                {
                    // NEMA VISE MESTA ZA PARKIRANJE, sVE PUNO
                    console.log("nema vise mesta za parkiranje na stanici " +station.stationId );
                    request.put(process.env.COMMAND_URL + "full", {
                        json: {
                            stationId: station.stationId 
                        }
                    }, (err, res, body) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        console.log(res.statusCode);
                        console.log(body);
                    });
                    
                }
                console.log('res');
                let res = await this.adapter.updateById(station._id, { $inc: { docks_available: -1}});
                this.sendToWebDash(station, "update");
                console.log(res);
            }
        },
        "bike.num.down": {
            group: "other",
            async handler(payload){
                console.log(payload.stationId);
                let station = await this.adapter.find({ query: {"stationId": payload.stationId} });
                station = station[0];

                if (station == null || station.docks_available == station.docks)
                {
                    // GRESKA
                    console.log("Greska, stanica " +payload.stationId+ " se iskljucuje");
                    const body = {
                        stationId: payload.stationId,
                        errorCODE: "empty"
                    };
                    console.log(body);

                    request.post(process.env.COMMAND_URL + "error", {
                        json: body
                    }, (err, res, body) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        console.log(res.statusCode);
                        console.log(body);
                    });
                    if(station !=null)
                    {
                        this.sendToWebDash(station, "remove");
                    }
                    return;
                }
                
                if (station.docks_available == station.docks - 1)
                {
                    // sVE PrazNO
                    console.log("stanica prazna " + station.stationId);
                    request.put(process.env.COMMAND_URL + "empty", {
                        json: {
                            stationId: station.stationId 
                        }
                    }, (err, res, body) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        console.log(res.statusCode);
                        console.log(body);
                    });
                }
                let res = await this.adapter.updateById(station._id, { $inc: { docks_available: 1}});
                this.sendToWebDash(station, "update");
                console.log(res);
            }
        }
    },
    created() {
        const app = express();
        app.use(cors());
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());
        app.listen(this.settings.port);
        this.initRoutes(app);
        this.app = app;
    }
};