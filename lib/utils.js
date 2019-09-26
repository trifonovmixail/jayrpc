'use strict';

import Ajv from 'ajv';


/*
 * Validate request params for procedure instance.
 *
 * @param {Procedure} procedure: instance of procedure.
 * @param {Object} params: RPC request params.
 */
export function validateRequestParams(procedure, params) {
    let ajv = new Ajv();
    let validate = ajv.compile(procedure.paramsSchema);
    let isValid = validate(params);

    if (!isValid) return validate.errors;
}

/*
 * Get bearer token from server request.
 *
 * @param {http.Request} request: server request object.
 */
export function getBearerTokenFromRequest(request) {
    if (!request.headers.authorization) return null;

    let authorization = request.headers.authorization.split(' ');

    if (authorization.length !== 2) return null;
    if (authorization[0] !== 'Bearer') return null;

    return authorization[1];
}
