let Maps = require('@tyler.thayn/maps.core')
let Fs = require('fs')
let Path = require('path')
let express = require('express')
let Through = require('through')

let Db = require('../Db')

let router = express.Router()

router.use((req, res, next) => {
	log(req.originalUrl)
	next()
})

router.get('/layers', (req, res, next) => {
	Db.query(`SHOW TABLES IN \`tiles\``, (error, result, fields) => {
		if (error) {return next(error)}
		let tiles = result.map(r=>Object.values(r)[0])

		Db.query(`SHOW TABLES IN \`features\``, (error, result, fields) => {
			if (error) {return next(error)}
			let features = result.map(r=>Object.values(r)[0])

			let layers = {tiles: [], features: []}
			tiles.forEach(style => {
				layers.tiles.push({name: style, url: `/tiles/${style}/{z}/{x}/{y}`, options: {minZoom: 5, maxZoom: 19, tileSize: 512, zoomOffset: -1}})
			})
			features.forEach(type => {
				layers.features.push({name: type, url: `/features/${type}/{key}.{ext}`, options: {minZoom: 5, maxZoom: 19}})
			})

			res.send(layers)
		})
	})
})

router.get('/layers/tiles', (req, res, next) => {
	Db.query(`SHOW TABLES IN \`tiles\``, (error, result, fields) => {
		if (error) {return next(error)}
		res.send(result.map(r=>Object.values(r)[0]))
	})
})

router.get('/layers/features', (req, res, next) => {
	Db.query(`SHOW TABLES IN \`features\``, (error, result, fields) => {
		if (error) {return next(error)}
		res.send(result.map(r=>Object.values(r)[0]))
	})
})


module.exports = router
