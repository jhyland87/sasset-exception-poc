This is just a temporary repository for any exception handling POC logic.

The exceptions are stopred in *.js* files within the `lang/en/exceptions` directory, and have unique exception `codes` (or keys, whatever) for each one.  When exceptions are thrown, instead of a string value of the exception text, an exception `code` is referenced, which holds the data about this specific type of exception.

### Example:


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

	/**
	 * RESULT:
		AppError - Username not found
		{ [AppError: Username not found]
		  name: 'AppError',
		  type: 'Application',
		  detail: 'The username provided (j.doe) was not found.',
		  message: 'Username not found',
		  errorCode: { code: 'account.login.badUsername', data: 'j.doe' },
		  isAppError: true }
	*/