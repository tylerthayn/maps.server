let Server = require('./Server')

if (require.main == module) {
	let server = new Server('/config/server')
	server.Start()
} else {
	module.exports = Server
}

