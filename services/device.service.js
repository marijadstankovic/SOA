"use strict";

const request = require('request');
const express = require("express");
const bodyParser = require('body-parser');

let stations = {};
let station_keys = [];
let broken_stations = [];

module.exports = {
    name: "device",

    settings: {
        port: process.env.PORT || 4000,
    },
    methods: {
        init() {
            var i;
            for(i=2;i<20;i++)
            {
                stations[i] = 0;
                station_keys.push(i);
            }
            console.log(stations);
            console.log(station_keys);
            setInterval(() => {
                if(Math.random()<0.1)
                {
                    if(Math.random()>0.5){
                        this.brokenDock();    
                    }
                    this.sendFixed();
                    return;
                }
                var sId = station_keys[Math.floor(Math.random() * station_keys.length)];
                console.log(sId);
                let taken = true; //code 1
                if(stations[sId] == 0)
                {
                    taken = Math.random() ? true : false;
                }
                if(stations[sId] == 2)
                {
                    taken = false;
                }
                console.log(taken);
                //ovo prima DATA
                if(taken)
                {
                    this.broker.emit("bike.taken", {
                        stationId: sId,
                        timestamp: Date.now()
                    });
                }
                else
                {
                    this.broker.emit("bike.returned", {
                        stationId: sId,
                        timestamp: Date.now()
                    });
                }
                
            }, this.interval);
        },
        initRoutes(app) {
            //a za turnon?
            app.get("", this.getParameters);
            app.post("/turnoff", this.postTURNoff);
            app.post("/notfixed", this.NotFixed);
            app.put("/full", this.putFULL);
            app.put("/empty", this.putEMPTY);
        },
        getParameters(req, res)
        {
            let stations_data = [];
            station_keys.forEach(key => {
                var state = "In Service";
                if (stations[key] == 1){
                    state = "Station full";
                }
                if (stations[key] == 2){
                    state = "Station empty";
                }
                stations_data.push(
                    {
                        "id" : key,
                        "state": state
                    }
                )
            })
            
            return Promise.resolve()
                .then(() => {
                    return res.send(stations_data);
                })
                .catch(this.handleErr(res));
        },
        postTURNoff(req, res)
        {
            const payload = req.body;
            console.log("DOSLO JE DO GRESKE, STANICA SA ID-EM "+ payload.stationId+" SE ISKLJUCUJE");
            broken_stations.push(payload.stationId);
            var i = station_keys.indexOf(Number(payload.stationId));
            if(i > -1)
            {
                station_keys.splice(i, 1);
            }
            delete stations[i];
            console.log(station_keys);
            return res.send(station_keys);
        },
        NotFixed(req, res)
        {
            const payload = req.body;
            var i = broken_stations.indexOf(Number(payload.stationId));
            if(i > -1)
            {
                broken_stations.splice(i, 1);
                console.log(broken_stations);
                return res.status("200").send("Station removed");
            }
            else{
                console.log(broken_stations);
                return res.status("300").send("Station not active");
            }
        },
        putFULL(req, res)
        {
            const payload = req.body;
            console.log("stanica " + payload.stationId + " puna");
            if(stations[Number(payload.stationId)] != null){
                stations[Number(payload.stationId)] = 1;
                return res.status("200").send("ok");
            }
            else{
                return res.status("404").send("station " + payload.stationId + " not active");
            }
        },
        putEMPTY(req, res)
        {
            const payload = req.body;
            console.log("stanica " + payload.stationId + " prazna");
            if(stations[Number(payload.stationId)] != null){
                stations[Number(payload.stationId)] = 2;
                return res.status("200").send("ok");
            }
            else{
                return res.status("404").send("station " + payload.stationId + " not active");
            }
        },
        handleErr(res) {
            return err => {
                res.status(err.code || 500).send(err.message);
            };
        },
        sendFixed()
        {
            let sId = broken_stations[Math.floor(Math.random() * broken_stations.length)];
            console.log("saljem "+sId);
            request.put(process.env.DATA_URL+'fixed', {
                json: {"stationId" : sId}
            }, (err, res, body) => {
				if (err) {
					console.log(err);
					return;
				}
				console.log(res.statusCode);
				console.log(body);
			});
        },
        brokenDock()
        {
            var sId = station_keys[Math.floor(Math.random() * station_keys.length)];
            console.log("saljem "+sId);
            request.put(process.env.DATA_URL+'brokendock', {
                json: {"stationId" : sId}
            }, (err, res, body) => {
				if (err) {
					console.log(err);
					return;
				}
				console.log(res.statusCode);
				console.log(body);
			});
        }
    },
    created() {
        const app = express();
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());
        app.listen(this.settings.port);
        this.initRoutes(app);
        this.app = app;

        this.interval = 1000;
        this.init();
    }
};