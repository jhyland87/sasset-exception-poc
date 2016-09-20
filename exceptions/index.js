/**
 * 
 * Original Author: http://www.bennadel.com/blog/2828-creating-custom-error-objects-in-node-js-with-error-capturestacktrace.htm 
 *
 */
'use strict'

const Util = require('util')
const AppRoot = require('app-root-path')
const _ = require('lodash')
const fs = require('fs')
const path = require('path')


/**
 * Object for any internal/private properties needed here
 * @note The lang is hardcided to 'en' (english) here, but its done programmatically in my real source
 */
const _internals = {
    'lang': 'en'
}

/**
 * Set the exception directory
 */
_internals.exceptions_dir = path.resolve( `./lang/${_internals.lang}/exceptions`)

/**
 * Collect all of the exceptions found in the .js files within exceptions_dir, merging them all into one single object,
 * with the exception 'codes' as the keys
 */
_internals.error_codes = collectExceptions( _internals.lang )


/**
 * Collect all the exceptions in any of the .js files found in the exceptions folder for the specified (or default)
 * language.
 *
 * @param   {string}    lang    Language (default: en)
 * @return  {object}            An object of exception details, with the exception 'code' as the keys
 *
 */
function collectExceptions( lang ){
    if( ! lang ) lang = 'en'

    const files = fs.readdirSync( _internals.exceptions_dir )


    const exceptions = {}

    // Iterate over the files found in the exceptions_dir, appending all of the objects to the exceptions object
    _.forEach( files, f => {
        // Get the full path of the file
        let file = path.resolve( _internals.exceptions_dir, f )
        
        // Skip any folders (EG: ./middleware folder)
        if( ! fs.lstatSync( file ).isFile() )
            return
        
        // Get the model name from the file name
        const moduleName = f.match( /(.*)\.js/ )[ 1 ]
        const absModuleName = file.match( /(.*)\.js/ )[ 1 ]

        // Convert it to ucfirst
        const exceptionGroup = _.chain( moduleName ).toLower().upperFirst().value()

        // An attempt to circumvent the OverwriteModelError error
        if( _.isUndefined( exceptions[ exceptionGroup ] ) ) {
            // Load it as a model by passing the mongoose object
            _.merge(exceptions, require( absModuleName ))
        }
    } )

    return exceptions
}

/**
 * Get Exception - Retrieve 
 *
 * @param   {string}    code    Specific exception code to retrieve (Which needs to be an existing key from the 
 *                              _internals.error_codes object).
 * @returns {object}            Exception with the key of `code`. If no exception was found with said key, then it will
 *                              be changed to `general.exceptions.badCode`
 */
_internals.getException = code => {
    const unknownCode = 'general.exceptions.badCode'
    let errorObj

    // Retrieve the exception data using the `code`, looking for a matching obj index, or name `name`
    const __fetch = c => _.isUndefined( _internals.error_codes[ c ] ) ? undefined :_internals.error_codes[ c ]

    // If no code is set, then use the unknown error code
    if( ! code ) {
        return __fetch( unknownCode )
    }
    else {
        let filtered = __fetch( code )

        if( _.isUndefined( filtered ) )
            return __fetch( unknownCode )

        return filtered
    }
}

// I create the new instance of the AppError object, ensureing that it properly
// extends from the Error class.
function initAppError( code ) {

    // NOTE: We are overriding the "implementationContext" so that the createAppError()
    // function is not part of the resulting stacktrace.
    return( new AppError( code, null, initAppError ) )
}

/**
 * Exception generator
 *
 * @todo If code.data is instanceof Error or AppError, then retrieve the reason/message
 */
function AppError( code, implementationContext ) {
    let errorObj = {}

    /**
     * Parse a string (detail), replacing any substitution strings with the next value in the data provided. This is
     * basically a very basic wrapper around 'Util.format'
     *
     * @param   {string}                detail      The 'detail' property from the error
     * @param   {string|number|array}   data        Data to use for string substitution
     * @example _subStrData( 'Hello %s %s', 'John', 'Doe' )
     */
    const _subStrData = ( detail, data ) => {
        // If its a string, turn it into an array
        if( _.isString( data ) ) 
            data = [ data ]

        // If its not a string OR an array, return false
        else if( ! _.isArray( data ) ) 
            return false

        data.unshift( detail )

        return Util.format.apply( Util, data )
    }

    // If the `code.data` is provided and its an Error exception object, then convert it to a string by extracting the
    // error message itself
    if( ! _.isUndefined( code.data ) ){
        if( ! _.isUndefined( code.data.detail ) )
            code.data = code.data.detail.toString()

        else if( ! _.isUndefined( code.data.message ) )
            code.data = code.data.message.toString()

        else
            code.data = code.data.toString()
    }

    // Check if its an object, which would contain more data (substitute values)
    if( _.isObject( code ) ) {
        errorObj = _internals.getException( code.code )

        // Format the detailed message, if formatting data was provided
        if( ! _.isEmpty( code.data ) ){
            // If the substitution data provided was in an illegal format, then change the exception (as it probably
            // wont return the helpful data it was expected to anyways)
            if( ! _.isString( code.data ) && ! _.isArray( code.data ) ){
                errorObj = _internals.getException( 'general.exceptions.badSubstitution' )

                errorObj.detail = _subStrData( errorObj.detail, _.typeof( code.data ) )
            }
            else {
                errorObj.detail = _subStrData( errorObj.detail, code.data )
                // @todo If the above returns false, then something failed, add some logic here
            }
        }
    }

    // Otherwise, just process it directly
    else {
        errorObj = _internals.getException( code )
    }

    // Override the default name property (Error). This is basically zero value-add.
    this.name       = "AppError"
    this.type       = ( errorObj.type || "Application" )
    this.detail     = ( errorObj.detail || "" )
    this.message    = ( errorObj.message || "An error occurred." )
    this.errorCode  = code

    // This is just a flag that will indicate if the error is a custom AppError. If this
    // is not an AppError, this property will be undefined, which is a Falsey.
    this.isAppError = true

    // Capture the current stacktrace and exclude the exception related functions/methods
    Error.captureStackTrace( this, ( implementationContext || initAppError ) )
}


Util.inherits( AppError, Error )


// Export the constructor function.
exports.AppError = AppError

// Export the factory function for the custom error object. The factory function lets
// the calling context create new AppError instances without calling the [new] keyword.
exports.init = initAppError