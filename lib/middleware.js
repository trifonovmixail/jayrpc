'use strict';

/*
 * Server middleware empty interface.
 */
export default class Middleware {
    /*
     * @param {Procedure} procedure: instance of procedure.
     * @param {Object} request: procedure request.
     */
    async beforeCall() {}
    /*
     * @param {Procedure} procedure: instance of procedure.
     * @param {Object} response: procedure response.
     */
    async afterCall() {}
    /*
     * @param {http.Request} request: server request object.
     * @param {Object} state: request state object.
     */
    async onRequest() {}
    /*
     * @param {http.Response} response: server response object
     * @param {Object} state: request state object
     */
    async onResponse() {}
}
