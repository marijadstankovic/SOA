"use strict";

const path = require("path");
const mkdir = require("mkdirp").sync;

const DbService = require("moleculer-db");

module.exports = (collection, url) => {
	if (url) {
		const MongoAdapter = require("moleculer-db-adapter-mongo");

		return {
			mixins: [DbService],
			adapter: new MongoAdapter(url, { 
				useNewUrlParser: true,
				useUnifiedTopology: true
			}),
			collection
		};
	}

	mkdir(path.resolve("./data"));

	return {
		mixins: [DbService],
		adapter: new DbService.MemoryAdapter({ filename: `./data/${collection}.db` })
	};
};