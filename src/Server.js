require('@tyler.thayn/js.core')
let Path = require('path')
let express = require('express')
let Through = require('through')
let zlib = require('zlib')
let Db = require('./Db')

let defaults = {
	host: 'localhost',
	port: '11503'
}

function Server (options = {}) {
	let app = express()

	Extend(app.locals.settings, defaults, options)
	Define(app, 'Get', function Get (n, v) {return Object.prototype.Get.call(app.locals.settings, n, v)})
	Define(app, 'Set', function Get (n, v) {return Object.prototype.Set.call(app.locals.settings, n, v)})

	app.use(require('cors')())
	//app.use(require('./api/Config'))
	app.use('/viewer', require('./api/Viewer'))
	app.use('/features', require('./api/Features'))
	app.use('/tiles', require('./api/Tiles'))


	Define(app, 'Start', Start)
	return app

}

function Start (options = {}) {
	Extend(this.locals.settings, options)
	this.listen(this.get('port'), this.get('host'), () => {
		log(`Server running ${this.get('host')}:${this.get('port')}`)
	})
	return this
}


module.exports = Server
