let express = require('express')
let router = express.Router()


router.get('/google/:style/:z/:x/:y', (req, res, next) => {
	let options = Extend({}, {
		style: 'hybrid',
		w: 1024,
		h: 1024,
		token: process.env.MapboxApiToken
	}, req.query, req.params)
	let layerStyles = {
		'hybrid': 'y',
		'roads': 'm',
		'roadsonly': 'h',
		'satellite': 's',
		'terrain': 'p'
	}
	let url = 'http://{s}.google.com/vt/lyrs={layers}&x={x}&y={y}&z={z}'
	url = url
		.replace('{s}', 'mt0')
		.replace('{x}', options.x)
		.replace('{y}', options.y)
		.replace('{z}', options.z)
		.replace('{layers}', layerStyles[options.style])
	res.redirect(url)
})

module.exports = router
