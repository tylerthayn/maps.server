require('@tyler.thayn/js.core')
let Maps = require('@tyler.thayn/maps.core')
let Path = require('path')
let router = require('express').Router()
let configs = require(Path.resolve('/V0/config'))


router.get('/mapbox/:style/\\[:bounds\\]', (req, res, next) => {
	let bounds = req.params.bounds.split(',').map(b=>parseFloat(b))
	let options = Extend({}, {
		style: 'hybrid',
		w: 1024,
		h: 1024,
		token: process.env.MapboxApiToken
	}, req.query, req.params)

	res.redirect(`https://api.mapbox.com/styles/v1/mapbox/${configs.mapbox.basemaps[options.style]}/static/[${bounds.map(b=>{return b.toFixed(8)}).join(',')}]/${options.w}x${options.h}?access_token=${options.token}`)
})

router.get('/mapbox/:style/:z/:x/:y', (req, res, next) => {
	let options = Extend({}, {
		style: 'hybrid',
		w: 1024,
		h: 1024,
		token: process.env.MapboxApiToken
	}, req.query, req.params)

	let tile = new Maps.Tile(parseInt(req.params.z), parseInt(req.params.x), parseInt(req.params.y))
	res.redirect(`/tiles/mapbox/${options.style}/${JSON.stringify(tile.bounds)}`)
})

router.get('/mapbox/:style/:key', (req, res, next) => {
	let options = Extend({}, {
		style: 'hybrid',
		w: 1024,
		h: 1024,
		token: process.env.MapboxApiToken
	}, req.query, req.params)

	let tile = new Maps.Tile(req.params.key)
	res.redirect(`/tiles/mapbox/${options.style}/${JSON.stringify(tile.bounds)}`)
})

module.exports = router
