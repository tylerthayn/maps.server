
let Server = require('../')

let server = new Server('/config/server')
//server.set('host', 'localhost')
//server.set('port', 11511)
server.Start({port: 11511})
log(server.locals)
