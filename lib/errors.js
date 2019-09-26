'use strict';

/*
 * RPC errors by specification.
 */
export const ERRORS = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
    UNAUTHORIZED: 1,
    ACTION_NOT_ALLOWED: 2,
    // -32000 - -32099 reserved for implementation-defined server-errors
    VALIDATION_ERROR: -32001,
    OBJECT_NOT_FOUND: -32002,
    NOTHING_TO_DELETE: -32003,
};

/*
 * Throw error end add code property to error instance.
 *
 * @param {String} message: error message.
 * @param {Number} code: error code.
 */
export function throwRPCError(message, code) {
    let error = new Error(message);
    error.code = code;
    throw error;
}

/*
 * Create RPC error object by specification.
 *
 * @param {String} message: error message.
 * @param {Number} code: error code.
 * @param {[String, Number]} requestId: id of request.
 */
export function createRpcError(message, code, requestId) {
    if (Array.isArray(message)) {
        if (message.length === 1) {
            message = message[0];
        } else {
            message = message.join('| ');
        }
    }

    let error = { error: { code, message } };
    if (requestId) error.id = requestId;

    return error;
}

/*
 * Get error code and error message from instance of error.
 *
 * @param {Error} error: instance of error.
 * @param {Array} errorClassToErrorCode:  error class to error code association arrays.
 */

export function getErrorInfo(error, errorClassToErrorCode) {
    let errorCode = ERRORS.INTERNAL_ERROR;

    if (Number.isInteger(error.code)) {
        errorCode = error.code;
    } else {
        for (let part of (errorClassToErrorCode || [])) {
            let errorClass = part[0];

            if (error instanceof errorClass) {
                errorCode = part[1];
                break;
            }
        }
    }

    return [errorCode, error.toString()];
}
