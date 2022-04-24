let Maps = require('@tyler.thayn/maps.core')
let Fs = require('fs')
let Path = require('path')
let express = require('express')
let Through = require('through')
let zlib = require('zlib')
let Tiles = require('@maps/Tiles')

let Db = require('../Db')

let router = express.Router()

//router.use(require('./Tiles/Mapbox'))
//router.use(require('./Tiles/Google'))

router.use((req, res, next) => {
	log(req.originalUrl)
	next()
})

router.get('/', (req, res, next) => {
	Db.query(`SHOW TABLES IN \`tiles\``, (error, result, fields) => {
		res.send(result.map(r=>Object.values(r)[0]))
	})
})


router.get('/:style', (req, res, next) => {
	Db.query(`SELECT id from \`tiles\`.\`${req.params.style}\``, (error, result, fields) => {
		res.send(result.map(r=>r.id))
	})
})

router.get('/:style/:z/:x/:y', (req, res, next) => {
	let tile = new Maps.Tile(parseInt(req.params.z), parseInt(req.params.x), parseInt(req.params.y))
	res.redirect(`/tiles/${req.params.style}/${tile.key}`)
})

router.get('/:style/:key', (req, res, next) => {
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

})


module.exports = router
