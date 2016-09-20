'use strict'

module.exports = {
    'general.exceptions.badCode': {
        type: 'systemError',
        message: 'Unknown or undefined error code',
        detail: 'Application returned the exception code "%s", which is not a known exception code or title.'
    },
    'general.exceptions.badSubstitution': {
        type: 'systemError',
        message: 'Illegal usage of exception detail substitution',
        detail: 'Application attempted to return an exception using string substitution for the detailed message, the substitution data provided was not an acceptable format (expecting string or array - received %s).'
    }
}