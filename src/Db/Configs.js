require('@tyler.thayn/js.core')
let Deasync = require('deasync')

module.exports = db => {
	let configs = Object.create({})
	let _configs = {}

	Deasync(db.query).call(db, `SELECT * FROM maps.configs`).forEach(row => {
		_configs[row.property] = row.value

		Define(configs, row.property, {
			get: () => {
				return _configs[row.property]
			},
			set: (v) => {
				Deasync(db.query).call(db, `UPDATE maps.configs SET value = '${v}' WHERE property = '${row.property}';`)
				_configs[row.property] = v
				return configs
			}
		}, true)
	})

	Define(db, 'Configs', {get: () => {return configs}})
	return configs
}

