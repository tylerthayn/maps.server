require('@tyler.thayn/js.core')
let Deasync = require('deasync')
let Path = require('path')
let Fs = require('fs')
let MySQL = require('mysql')

let Mapbox = require('./Mapbox')

let defaults = {
	connectionLimit: 10,
	host: 'localhost',
	user: '',
	password: ''
}

function Db () {
	let options = Extend({}, defaults, arguments.length > 0 ? arguments[0] : {}, {user: user, password: password})

	let db = MySQL.createPool(options)
	require('./Configs')(db)
	require('./Mapbox')(db)

	return db
}

let user = password = ''
if (process.Get('env.mysql_credentials', null) != null) {
	[user, password] = process.Get('env.mysql_credentials', null).split(':')
}

module.exports = new Db({user: user, password: password})

