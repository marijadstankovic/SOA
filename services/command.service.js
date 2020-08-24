"use strict";

const request = require('request');
const express = require("express");
const bodyParser = require('body-parser');


module.exports = {
    name: "command",
    
    settings: {
        port: process.env.PORT || 4003,
    },
    methods: {
        initRoutes(app) {
            app.get("/cmd", this.getCommands);
            //parametri novih komandi ili promene prostojecih..:
            app.post("/error", this.postError);
            app.post("/notfixed", this.postNotFixed);
            app.post("/brokenstation", this.postBrokenStation);
            app.put("/full", this.putFULL);
            app.put("/empty", this.putEMPTY);
        },
        getCommands(req, res)
        {
            // vraca listu komandi i parametara
            const commands = [
                {
                    "path": "/error",
                    "params" : ["stationId", "errorCODE"],
                    "paramTypes": ["string", "string"],
                    "description": "sensor reports that a bike is taken/returned from a station that has no bikes/docks (errorCODE: full/empty)"
                },
                {
                    "path": "/full",
                    "params": ["stationId"],
                    "paramsTypes": ["string"],
                    "description": "the station is full (cannot take anymore bikes)"
                },
                {
                    "path": "/empty",
                    "params": ["stationId"],
                    "paramsTypes": ["string"],
                    "description": "the station is empty (doesn't have any bikes left)"
                }
            ]
            
            return Promise.resolve()
                .then(() => {
                    return res.send(commands);
                })
                .catch(this.handleErr(res));
        },
        postError(req, resp)
        {
            const payload = req.body;
            console.log("GRESKA U COMMAND SERVISU");
            request.post(process.env.DEVICE_URL + "turnoff", {
                json: { stationId: payload.stationId }
            }, (err, res, body) => {
                if (err) {
                    return resp.send(err.message);
                }
                console.log(res.statusCode);
                console.log(body);
                return resp.send(body);
            });
        },
        postNotFixed(req, resp)
        {
            const payload = req.body;
            console.log("cmd");
            request.post(process.env.DEVICE_URL + "notfixed", {
                json: { "stationId": payload.stationId }
            }, (err, res, body) => {
                if (err) {
                    return resp.send(err.message);
                }
                console.log(res.statusCode);
                console.log(body);
                return resp.send(body)
            });
        },
        postBrokenStation(req, resp)
        {
            const payload = req.body;
            console.log("cmd");
            request.post(process.env.DEVICE_URL + "turnoff", {
                json: { stationId: payload.stationId }
            }, (err, res, body) => {
                if (err) {
                    return resp.send(err.message);
                }
                console.log(res.statusCode);
                console.log(body);
                return resp.send(body)
            });
        },
        putFULL(req, resp)
        {
            const payload = req.body;
            console.log("command: full");
            request.put(process.env.DEVICE_URL + "full", {
                json: {stationId: payload.stationId}
            }, (err, res, body) => {
                if (err) {
                    console.log(err);
                    return resp.status(err.code).send(err.message);
                }
                return resp.status(res.statusCode).send(body);
            })
        },
        putEMPTY(req, resp)
        {
            // ONO STO DOBIJA OD DEVICE MANAGERA
            const payload = req.body;
            console.log("command: empty");            
            request.put(process.env.DEVICE_URL + "empty", {
                json: {stationId: payload.stationId}
            }, (err, res, body) => {
                if (err) {
                    console.log(err);
                    return resp.status(err.code).send(err.message);
                }
                return resp.status(res.statusCode).send(body);
            })
        },
        handleErr(res) {
            return err => {
                res.status(err.code || 500).send(err.message);
            };
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