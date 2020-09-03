"use strict";

const request = require('request');
const express = require("express");
const bodyParser = require('body-parser');


module.exports = {
    name: "command",
    // PROVERI PORT
    settings: {
        port: process.env.PORT || 4004,
    },
    methods: {
        initRoutes(app) {
            app.get("/devices", this.getDevices);
            app.get("/data/raw", this.getRawData);
            app.get("/data/indaterange", this.getRawDataInRange);
            app.get("/commands", this.getCommands);

            app.post("/station/turnoff", this.postTurnOffStation);
            app.post("/device/notFixed", this.postNotFixed);
            app.post("/command/error", this.postError);
            app.post("/command/notFixed", this.postCommandNotFixed);
            app.post("/command/brokenstation", this.postBrokenStation);

            app.put("/station/full", this.putFullStation);
            app.put("/station/empty", this.putEmptyStation);
            app.put("/data/fixedstation", this.putFixedData);
            app.put("/data/brokendock", this.putDataBrokenDock);
            app.put("/analytics/fixed", this.putAnalyticsFixed);
            app.put("/analytics/brokendock", this.putAnalyticsBrokenDock);
            app.put("/command/fullstation", this.putFullStationCommand);
            app.put("/command/emptystation", this.putEmptyStationCommand);
        },
        getDevices(reqest, response)
        {
            request.get(process.env.DEVICE_URL,
                (err, res, body) => {
                    if(err)
                    {
                        console.log(err);
                        return response.send(err);
                    }
                    console.log(res.statusCode);
                    return response.send(body);
                })
        },
        getRawData(reqest, response)
        {
            let that_query = {};
            if(reqest.query.id){
                that_query["id"] = reqest.query.id;
            }
            if(reqest.query.taken){
                that_query["taken"] = reqest.query.taken == "true";
            }
            if(reqest.query.time){
                that_query["time"] = reqest.query.time;
            }
            request.get({url: process.env.DATA_URL + "raw", 
             qs: that_query},
            function(err, res, body){
                if(err)
                {
                    console.log(err);
                    return response.send(err);
                }
                console.log(res.statusCode);
                return response.send(body);
            });
        },
        getRawDataInRange(reqest, response)
        {
            let that_query = {};
            if(reqest.query.id){
                that_query["id"] = reqest.query.id;
            }
            if(reqest.query.taken){
                that_query["taken"] = reqest.query.taken == "true";
            }
            if(reqest.query.time1){
                that_query["time1"] = reqest.query.time1;
            }
            if(reqest.query.time2){
                that_query["time2"] = reqest.query.time2;
            }
            request.get({url: process.env.DATA_URL + "rawinrange", 
             qs: that_query},
            function(err, res, body){
                if(err)
                {
                    console.log(err);
                    return response.send(err);
                }
                console.log(res.statusCode);
                return response.send(body);
            });
        },
        getCommands(reqest, response)
        {
            // vraca listu komandi i parametara
            request.get(process.env.COMMAND_URL + "cmd",
                (err, res, body) => {
                    if(err)
                    {
                        console.log(err);
                        return response.send(err);
                    }
                    console.log(res.statusCode);
                    console.log(body);
                    return response.send(body);
                })
        },
        postTurnOffStation(reqest, response)
        {
            const payload = reqest.body;
            console.log(payload);
            request.post(process.env.DEVICE_URL + "turnoff", {
                json: { stationId: payload.stationId }
            },
                (err, res, body) => {
                    if(err)
                    {
                        console.log(err);
                        return response.send(err);
                    }
                    console.log(res.statusCode);
                    console.log(body);
                    return response.send(body);
                })
        },
        postNotFixed(reqest, response)
        {
            const payload = reqest.body;
            console.log(payload);
            request.post(process.env.DEVICE_URL + "notfixed", {
                json: { stationId: payload.stationId }
            },
                (err, res, body) => {
                    if(err)
                    {
                        console.log(err);
                        return response.send(err);
                    }
                    console.log(res.statusCode);
                    console.log(body);
                    return response.send(body);
                })
        },
        postError(reqest, response)
        {
            const payload = reqest.body;
            console.log(payload);
            request.post(process.env.COMMAND_URL + "error", {
                json: { stationId: payload.stationId }
            },
                (err, res, body) => {
                    if(err)
                    {
                        console.log(err);
                        return response.status(err.code || 500).send(err.message);
                    }
                    console.log(res.statusCode);
                    console.log(body);
                    return response.status(200).send(body);
                })
        },
        postCommandNotFixed(reqest, response)
        {
            const payload = reqest.body;
            console.log(payload);
            request.post(process.env.COMMAND_URL + "notfixed", {
                json: { stationId: payload.stationId }
            },
                (err, res, body) => {
                    if(err)
                    {
                        console.log(err);
                        return response.status(err.code || 500).send(err.message);
                    }
                    console.log(res.statusCode);
                    console.log(body);
                    return response.status(200).send(body);
                })
        },
        postBrokenStation(reqest, response)
        {
            const payload = reqest.body;
            console.log(payload);
            request.post(process.env.COMMAND_URL + "brokenstation", {
                json: { stationId: payload.stationId }
            },
                (err, res, body) => {
                    if(err)
                    {
                        console.log(err);
                        return response.status(err.code || 500).send(err.message);
                    }
                    console.log(res.statusCode);
                    console.log(body);
                    return response.status(200).send(body);
                })
        },

        putFullStation(reqest, response){
            const payload = reqest.body;

            console.log(payload);
            
            request.put(process.env.DEVICE_URL + "full", {
                json: { stationId: payload.stationId }
            },
                (err, res, body) => {
                    if(err)
                    {
                        console.log(err);
                        return response.status(err.code || 500).send(err.message);
                    }
                    console.log(res.statusCode);
                    console.log(body);
                    return response.status(res.statusCode).send(body);
                })
        },
        putEmptyStation(reqest, response){
            const payload = reqest.body;
            console.log(payload);
            request.put(process.env.DEVICE_URL + "empty", {
                json: { stationId: payload.stationId }
            },
                (err, res, body) => {
                    if(err)
                    {
                        console.log(err);
                        return response.status(err.code || 500).send(err.message);
                    }
                    console.log(res.statusCode);
                    console.log(body);
                    return response.status(res.statusCode).send(body);
                })
        },
        putFixedData(reqest, response){
            const payload = reqest.body;
            console.log(payload);
            request.put(process.env.DATA_URL + "fixed", {
                json: { stationId: payload.stationId }
            },
                (err, res, body) => {
                    if(err)
                    {
                        console.log(err);
                        return response.status(err.code || 500).send(err.message);
                    }
                    console.log(res.statusCode);
                    console.log(body);
                    return response.status(res.statusCode).send(body);
                })
        },
        putDataBrokenDock(reqest, response){
            const payload = reqest.body;
            console.log(payload);
            request.put(process.env.DATA_URL + "brokendock", {
                json: { stationId: payload.stationId }
            },
                (err, res, body) => {
                    if(err)
                    {
                        console.log(err);
                        return response.status(err.code || 500).send(err.message);
                    }
                    console.log(res.statusCode);
                    console.log(body);
                    return response.status(res.statusCode).send(body);
                })
        },
        putAnalyticsFixed(reqest, response){
            const payload = reqest.body;
            console.log(payload);
            request.put(process.env.ANALYTICS_URL + "fixed", {
                json: { stationId: payload.stationId }
            },
                (err, res, body) => {
                    if(err)
                    {
                        console.log(err);
                        return response.status(err.code || 500).send(err.message);
                    }
                    console.log(res.statusCode);
                    console.log(body);
                    return response.status(res.statusCode).send(body);
                })
        },
        putAnalyticsBrokenDock(reqest, response){
            const payload = reqest.body;
            console.log(payload);
            request.put(process.env.ANALYTICS_URL + "brokendock", {
                json: { stationId: payload.stationId }
            },
                (err, res, body) => {
                    if(err)
                    {
                        console.log(err);
                        return response.status(err.code || 500).send(err.message);
                    }
                    console.log(res.statusCode);
                    console.log(body);
                    return response.status(res.statusCode).send(body);
                })
        },
        putFullStationCommand(reqest, response){
            const payload = reqest.body;
            console.log(payload);
            request.put(process.env.COMMAND_URL + "full", {
                json: { stationId: payload.stationId }
            },
                (err, res, body) => {
                    if(err)
                    {
                        console.log(err);
                        return response.status(err.code || 500).send(err.message);
                    }
                    console.log(res.statusCode);
                    console.log(body);
                    return response.status(res.statusCode).send(body);
                })
        },
        putEmptyStationCommand(reqest, response){
            const payload = reqest.body;
            console.log(payload);
            request.put(process.env.COMMAND_URL + "empty", {
                json: { stationId: payload.stationId }
            },
                (err, res, body) => {
                    if(err)
                    {
                        console.log(err);
                        return response.status(err.code || 500).send(err.message);
                    }
                    console.log(res.statusCode);
                    console.log(body);
                    return response.status(res.statusCode).send(body);
                })
        },
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