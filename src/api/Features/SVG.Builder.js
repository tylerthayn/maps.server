require('@tyler.thayn/js.core')
let JSONStream = require('JSONStream')
let Through = require('through')
let Turf = require('@turf/turf')
let xml = require('xml')
let Converter = require('./GeoJSON/FeatureConverter')
let GetZoom = require('../GeoSpatial/GetZoom')
let Pixels = require('../GeoSpatial/GetPixels')

let defaults = {
	service: 'features',
	type: '',
	style: 'default',
	geo: {
		bounds: null,
		tile: null,
		zoom: null
	},
	svg: {
		width: 1024,
		height: 1024,
		classes: ['Layer', 'Overlay', 'Features'],
		viewbox: null,
		data: {}
	}
}

function Builder (options = {}) {
	Object.Extensions.EventEmitter(this)
	Extend(this, defaults, options)

	// Ensure properties exist
	if (!this.svg.viewbox) {this.svg.viewbox = [0, 0, this.svg.width, this.svg.height]}
	this.svg.classes = defaults.svg.classes.concat(this.svg.classes).Unique()
	if (!this.geo.bounds && this.geo.tile != null) {this.geo.bounds = this.geo.tile.bounds}
	this.geo.zoom = this.geo.zoom != null ? this.geo.zoom : GetZoom(this.geo.bounds)
	this.svg.classes.push('Zoom'+this.geo.zoom)


	let svg = {
		viewbox: this.svg.viewbox.join(' '),
		'class': this.svg.classes.join(' '),
		'data-width': this.svg.width,
		'data-height': this.svg.height,
		'data-bounds': this.geo.bounds.join(','),
		'data-tile': this.geo.tile != null ? this.geo.tile.key : '',
		'data-zoom': this.geo.zoom,
		xmlns: 'http://www.w3.org/2000/svg'
	}

	let $this = this
	Define(this, 'Header', {get: () => {
		return xml({svg: {_attr: svg}}).replace(/\/>/, '>') + '\n'
	}})
	Define(this, 'Footer', {get: () => {
		return `</svg>\n`
	}})

	let Convert = Converter({
		service: this.service,
		type: this.type,
		style: this.style,
		bounds: this.geo.bounds,
		width: this.svg.width,
		height: this.svg.height,
		svg: {
			classes: this.svg.classes,
			zoom: this.geo.zoom
		},
		feature: {
			classes: ['Road']
		}
	})

	function HandleFeature (feature, context) {
		$this.write(Convert(feature))
	}

	let jsonStream = JSONStream.parse('features.*', HandleFeature)
	jsonStream.on('end', () => {$this.write()})

	this.stream = Through(
		function Write (data) {
			jsonStream.write(data)
		},
		function End () {
			jsonStream.end()
		}
	)

	let headerSent = false, footerSent = false
	Define(this, 'write', (data = null) => {
		if (data == null && !footerSent) {
			this.stream.queue(this.Footer)
			footerSent = true
		}
		if (data != null && !headerSent) {
			this.stream.queue(this.Header)
			headerSent = true
		}
		this.stream.queue(data)
	})


	return this
}

module.exports = Builder
