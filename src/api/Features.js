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
	Db.query(`SHOW TABLES IN \`features\``, (error, result, fields) => {
		if (error) {return next(error)}
		res.send(result.map(r=>Object.values(r)[0]))
	})
})


router.get('/:type', (req, res, next) => {
	let header = `{"type": "FeatureCollection", "features": [`
	let footer = `]}`
	let _feature = false

	let options = Extend({}, {start: 0, limit: 1000}, req.params, req.query)
	Db.query(`SELECT *, ST_AsGeoJson(geo) AS geojson from \`features\`.\`${req.params.type}\` LIMIT ${options.start}, ${options.limit}`)
		.on('result', function (row) {
			if (header) {
				res.write(header)
				header = false
			}

			if (_feature) {
				res.write(JSON.stringify(_feature)+',')
			}

			_feature = {
				type: 'Feature',
				properties: Extend({}, row),
				geometry: JSON.parse(row.geojson)
			}
			delete _feature.properties.geojson
			delete _feature.properties.geo
		})
		.on('end', function () {
			if (_feature) {
				res.write(JSON.stringify(_feature))
			}
			if (footer) {
				res.end(footer)
				footer = false
			}
		})
})

router.get('/:type/:z/:x/:y.:ext', (req, res, next) => {
	let tile = new Maps.Tile(parseInt(req.params.z), parseInt(req.params.x), parseInt(req.params.y))
	res.redirect(`/features/${req.params.style}/${tile.key}.${ext}`)
})

router.get('/:type/:key.:ext', (req, res, next) => {
	let tile = new Maps.Tile(req.params.key)
	let polygon = `Polygon((${tile.bounds[0]} ${tile.bounds[1]}, ${tile.bounds[0]} ${tile.bounds[3]}, ${tile.bounds[2]} ${tile.bounds[3]}, ${tile.bounds[2]} ${tile.bounds[1]}, ${tile.bounds[0]} ${tile.bounds[1]}))`

	if (req.params.ext == 'json') {
		Db.query(`SELECT OBJECTID FROM \`features\`.\`${req.params.type}\` WHERE ST_Overlaps(ST_GeomFromText('${polygon}'), \`geo\`)`, (error, result, fields) => {
			if (error) {return next(error)}
			res.send(result.map(r=>r.OBJECTID))
		})
	} else {
		Db.query(`SELECT *, ST_AsGeoJson(geo) AS geojson FROM \`features\`.\`${req.params.type}\` WHERE ST_Contains(ST_GeomFromText('${polygon}'), \`geo\`) OR ST_Within(ST_GeomFromText('${polygon}'), \`geo\`)`, (error, result, fields) => {
			log(result)
			let collection = {type: 'FeatureCollection', features: []}
			result.forEach(row => {
				let feature = {
					type: 'Feature',
					properties: Extend({}, row),
					geometry: JSON.parse(row.geojson)
				}
				Object.keys(feature.properties).forEach(property => {
					if (feature.properties[property] == null || feature.properties[property] == '') {
						delete feature.properties[property]
					}
				})
				delete feature.properties.geojson
				delete feature.properties.geo
				collection.features.push(feature)
			})

			if (req.params.ext == 'geojson') {
				res.send(collection)
			}
		})
	}
/*
	Db.query(`SELECT image from \`tiles\`.\`${req.params.style}\` WHERE id = '${req.params.key}'`, (error, result, fields) => {
		if (error) {log(error);return next(error)}
		if (result.length == 0) {
			Tiles.Download(req.params.style, req.params.key).then(Tiles.Format).then(Tiles.Tag).then(options => {
				res.sendFile(options.path)
				Db.query('SELECT @@GLOBAL.secure_file_priv AS folder;', (error, result, fields) => {
					if (error) {return reject(error)}
					let input = Fs.createReadStream(options.path)
					let output = Fs.createWriteStream(Path.resolve(result[0].folder, options.key+'.jpg.gz'))
					input.pipe(zlib.createGzip()).pipe(output)
					output.on('close', () => {
						log(`INSERT INTO tiles.${options.style} (\`id\`, \`image\`) VALUES ('${options.key}', LOAD_FILE('${Path.resolve(result[0].folder, options.key+'.jpg.gz').replace(/\\/g, '\\\\')}'))`)
						Db.query(`INSERT INTO tiles.${options.style} (\`id\`, \`image\`) VALUES ('${options.key}', LOAD_FILE('${Path.resolve(result[0].folder, options.key+'.jpg.gz').replace(/\\/g, '\\\\')}'))`, (error, result, fields) => {
							if (error) {return reject(error)}
						})
					})
				})
			}).catch(next)
		} else {
			let t = Through(
				function Write (data) {
					this.queue(data)
				}
			)
			t.pipe(zlib.createGunzip()).pipe(res)
			t.queue(result[0].image).queue(null)
		}
	})
	*/
})


module.exports = router
