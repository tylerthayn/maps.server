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

router.get('/', (req, res, next) => {

	Db.query(`SELECT * FROM \`maps\`.\`configs\` WHERE property LIKE 'viewer.%'`, (error, result, fields) => {
		if (error) {return next(error)}
		let configs = {}
		result.forEach(row => {
			configs.Set(row.property.replace(/^viewer\./, ''), row.value)
		})
		configs.map.center = JSON.parse(configs.map.center)
		configs.map.maxZoom = parseInt(configs.map.maxZoom)
		configs.map.minZoom = parseInt(configs.map.minZoom)
		configs.map.zoom = parseInt(configs.map.zoom)
		configs.map.zoomDelta = parseInt(configs.map.zoomDelta)
		configs.zoomLevels = JSON.parse(configs.zoomLevels)

		Db.query(`SHOW TABLES IN \`tiles\``, (error, result, fields) => {
			if (error) {return next(error)}
			let tiles = result.map(r=>Object.values(r)[0])

			Db.query(`SHOW TABLES IN \`features\``, (error, result, fields) => {
				if (error) {return next(error)}
				let features = result.map(r=>Object.values(r)[0])

				configs.layers = {tiles: [], features: []}
				tiles.forEach(style => {
					configs.layers.tiles.push({name: style, url: `/tiles/${style}/{z}/{x}/{y}`, options: {minZoom: configs.map.minZoom, maxZoom: configs.map.maxZoom, tileSize: 512, zoomOffset: -1}})
				})
				features.forEach(type => {
					configs.layers.features.push({name: type, url: `/features/${type}/{key}.{ext}`, options: {minZoom: configs.map.minZoom, maxZoom: configs.map.maxZoom}})
				})

				res.send(configs)

			})
		})


	})

})

module.exports = router
