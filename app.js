'use strict'

const AppError      = require( "./exceptions" ).init

try {
	throw new AppError({
		code: 'account.login.badUsername',
		data: 'j.doe'
	})
}
catch( e ){
	console.log('%s - %s',e.name, e.message)
	console.log(e)
}