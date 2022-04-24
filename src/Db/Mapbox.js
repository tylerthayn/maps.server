require('@tyler.thayn/js.core')

module.exports = db => {

	let mapbox = {
		apiToken: db.Configs['MapboxApiToken'],
		aliases: JSON.parse(db.Configs['MapboxAliases']),
		downloadUrl: db.Configs['MapboxDownloadUrl']
	}

	Object.keys(mapbox.aliases).forEach(key => {
		mapbox.aliases[mapbox.aliases[key]] = key
	})

	Define(mapbox, 'Alias', name => {
		return mapbox.aliases[name.toLowerCase()]
	})

	Define(db, 'Mapbox', {get: () => {return mapbox}})
	return mapbox
}
