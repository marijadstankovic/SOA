"use strict";

const request = require('request');
const express = require("express");
const bodyParser = require('body-parser');
const DbService = require("../mixins/db.mixin");

module.exports = {
    name: "data",
    mixins: [
		DbService("movies", process.env.MONGO_DATA_URL)
    ],
    
    settings: {
        port: process.env.PORT || 4001,

        fields: ["_id", "stationId", "taken", "timestamp"],

		entityValidator: {
            stationId: { type: "string", min: 1 },
            taken: { type: "boolean"}
            //timestamp: { type: "number", min: 1}
		}
    },
    methods: {
        initRoutes(app) {
            app.get("/raw", this.getRawData);
            app.get("/rawinrange", this.getRawDataInDateRange);
            app.put("/fixed", this.putFIXED);
            app.put("/brokendock", this.putBrokenDock);
        },
        async getRawData(req, res)
        {
            // PRETRAZI BAZU PODATAKA
            var my_query = {};
            if(req.query.id){
                my_query["stationId"] = String(req.query.id);
            }
            if(req.query.taken){
                my_query["taken"] = req.query.taken == "true";
            }
            if(req.query.time){
                my_query["timestamp"] = Date.parse(req.query.time);
            }
            console.log(my_query);
            let events = await this.adapter.find({ query: my_query });
            return Promise.resolve()
                .then(() => {
                    return res.send(events);
                })
                .catch(this.handleErr(res));
        },
        async getRawDataInDateRange(req, res)
        {
            // PRETRAZI BAZU PODATAKA
            console.log(new Date("02,26,2012").getTime());//1330214400000
            console.log(new Date("02/26/2012").getTime());//1330214400000
            console.log(Date.parse('04 Dec 1995 00:12:00 GMT'));//818035920000
            console.log(Date.parse('2011-10-10T14:48:00.000+09:00'));//1318225680000
            console.log(new Date("2012-02-26").getTime());//1330214400000
//1994-11-05T08:15:30-05:00
//2011-10-10T14:48:00.000+09:00
//1994-11-05T13:15:30Z
            var my_query = {};
            console.log(req.query.time2);//"2020-08-11T18:56:27.420Z"
            console.log(Date.parse(req.query.time2));//NaN
            if(req.query.id){
                my_query["stationId"] = String(req.query.id);
            }
            if(req.query.taken){
                my_query["taken"] = req.query.taken == "true";
            }
            my_query["timestamp"] = {
                "$gt" : Date.parse(req.query.time1),
                "$lt" : Date.parse(req.query.time2)
            }
            console.log(my_query);
            let events = await this.adapter.find({ query: my_query });
            return Promise.resolve()
                .then(() => {
                    return res.send(events);
                })
                .catch(this.handleErr(res));
        },
        putFIXED(req, resp)
        {
            // ONO STO DOBIJA OD DEVICE MANAGERA
            //upis u bazu
            console.log("//upis u bazu");
            const payload = req.body;
            request.put(process.env.ANALYTICS_URL+'fixed', {
                json: {"stationId" : String(payload.stationId)}
            }, (err, res, body) => {
				if (err) {
					return resp.status(err.code).send(err.message);
				}
				console.log(res.statusCode);
                console.log(body);
                return resp.status(res.statusCode).send(body);
			});
        },        
        putBrokenDock(req, resp)
        {
            // ONO STO DOBIJA OD DEVICE MANAGERA
            //upis u bazu
            console.log("//upis u loseee");
            const payload = req.body;
            request.put(process.env.ANALYTICS_URL+'brokendock', {
                json: {"stationId" : String(payload.stationId)}
            }, (err, res, body) => {
				if (err) {
					return resp.status(err.code).send(err.message);
				}
				console.log(res.statusCode);
				console.log(body);
                return resp.status(res.statusCode).send(body);
			});
        },
        handleErr(res) {
            return err => {
                res.status(err.code || 500).send(err.message);
            };
        }
    },
    events: {
        "bike.taken": {
            group: "other",
            handler(payload) {
               //UPIS PODATAKA U BAZU, 
               const message = {
                    stationId: String(payload.stationId),
                    taken: true,
                    timestamp: String(payload.timestamp)
                };
                console.log(message);
                this.validateEntity(message);
                this.adapter.insert(message);

                //SLANJE ANALYTICS-U, preko eventa
                this.broker.emit("bike.num.down", message);
               
            }
        },
        "bike.returned": {
            group: "other",
            handler(payload) {
               //UPIS PODATAKA U BAZU, 
               const message = {
                    stationId: String(payload.stationId),
                    taken: false,
                    timestamp: String(payload.timestamp)
                };
                console.log(message);
                this.validateEntity(message);
                this.adapter.insert(message);
                
                //SLANJE ANALYTICS-U, preko eventa
                this.broker.emit("bike.num.up", message);
               
            }
        }
    },
    created() {
        const app = express();
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());
        app.listen(this.settings.port);
        this.initRoutes(app);
        this.app = app;
    }
};