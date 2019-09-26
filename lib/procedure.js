'use strict';

/*
 * Base procedure class.
 *
 * @param {Object} params: params of RPC request.
 * @state {Object} state: state of server request.
 */
export default class Procedure {
    constructor(params, state) {
        this.params = params;
        this.state = state;
    }
    /*
     * Json schema for validation RPC request params.
     */
    static get paramsSchema() {
        return null;
    }
    /*
     * Clean params by field names.
     *
     * @param {Array} ignoreFields: list of field names.
     */
    cleanParams(ignoreFields) {
        for (let fieldName of ignoreFields) {
            delete this.params[fieldName];
        }
    }
    /*
     * Name of procedure.
     */
    static get name() {
        throw new Error('Property "name" does not implemented');
    }
    /*
     * Call procedure implementation here.
     */
    async call() {
        throw new Error('Method "call" does not implemented');
    }
}
