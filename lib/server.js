'use strict';

import http from 'http';

import { validateRequestParams } from './utils';
import { getErrorInfo, createRpcError, ERRORS } from './errors';

/*
 * JsonRPC server implementation.
 *
 * @param {String} host: server host.
 * @param {[String, Number]} port: port where server will listen.
 * @param {Object} options: server options.
 * @param {String} options.rpcVersion: rpc version on request. 2.0 by default.
 * @param: {Array} options.errorClassToErrorCode: error class to error code association arrays.
 */
export default class Server {
    constructor(host, port, options) {
        this.host = host;
        this.port = port;
        this.options = options || {};

        this.procedures = {};
        this.middlewares = [];

        this.listner = http.createServer(this.requestHandler.bind(this));
    }
    /*
     * Register middleware on server.
     *
     * @param {[Middleware, Array]]} middleware: instance of middleware or instances array.
     */
    registerMiddleware(middleware) {
        if (Array.isArray(middleware)) {
            for (let mw of middleware) this.middlewares.push(mw);
        } else {
            this.middlewares.push(middleware);
        }
    }
    /*
     * Register procedure on server.
     *
     * @param {[Procedure, Array]]} middleware: instance of procedure or instances array.
     */
    registerProcedure(procedure) {
        if (Array.isArray(procedure)) {
            for (let proc of procedure) this.procedures[proc.name] = proc;
        } else {
            this.procedures[procedure.name] = procedure;
        }
    }
    /*
     * Wright error to response from instance of error.
     *
     * @param {http.Response} serverResponse: response object.
     * @param {Error} error: instance of error
     */
    wrightError(serverResponse, error) {
        console.error(error);

        let [errorCode, errorMessage] = getErrorInfo(error, this.options.errorClassToErrorCode);

        serverResponse.end(
            JSON.stringify(
                createRpcError(errorMessage, errorCode),
            ),
        );
    }
    /*
     * Handle request, check basic protocol requirements. Init request state here.
     * Call middleware.onRequest.
     *
     * @param {http.Request} serverRequest: request object.
     * @param {http.Response} serverResponse: response object.
     */
    requestHandler(serverRequest, serverResponse) {
        if (serverRequest.method !== 'POST') {
            return serverResponse.end(
                JSON.stringify(
                    createRpcError('Request method can be POST only', ERRORS.INVALID_REQUEST),
                ),
            );
        }

        if (serverRequest.headers['content-type'] !== 'application/json') {
            return serverResponse.end(
                JSON.stringify(
                    createRpcError('Invalid content type', ERRORS.INVALID_REQUEST),
                ),
            );
        }

        let state = {};

        Promise.all(this.middlewares.map((mw) => { return mw.onRequest(serverRequest, state); })).then(
            () => { this.rpcHandler(serverRequest, serverResponse, state); }
        ).catch(
            (error) => { this.wrightError(serverResponse, error); }
        );
    }
    /*
     * Parse json from request and prepare batches. Start call process.
     * Call middleware.onResponse.
     *
     * @param {http.Request} serverRequest: request object.
     * @param {http.Response} serverResponse: response object.
     * @param {Object} state: state of request
     */
    rpcHandler(serverRequest, serverResponse, state) {
        let body = [];

        serverRequest.on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            let requests;

            try {
                requests = JSON.parse(Buffer.concat(body).toString());
            } catch (e) {
                return serverResponse.end(
                    JSON.stringify(
                        createRpcError('JSON from request can not be parsed', ERRORS.PARSE_ERROR),
                    ),
                );
            }

            if (!Array.isArray(requests)) {
                requests = [requests];
            }

            if (!requests.length > 0) {
                return serverResponse.end(
                    JSON.stringify(
                        createRpcError('No one request found', ERRORS.INVALID_REQUEST),
                    ),
                );
            }

            this.requestProcessor(requests, state).then((response) => {
                Promise.all(this.middlewares.map(
                    (mw) => { return mw.onResponse(serverResponse, state); }
                )).then(
                    () => {
                        serverResponse.end(
                            typeof response == 'string' ? response : JSON.stringify(response),
                        );
                    }
                ).catch(
                    (error) => { this.wrightError(serverResponse, error); }
                );
            }).catch(
                (error) => { this.wrightError(serverResponse, error); }
            );
        });
    }
    /*
     * Call procedures and prepare result.
     * Call middleware.beforeCall and middleware.afterCall.
     *
     * @param {Array} requests: array of rpc requests.
     * @param {Object} state: state of request.
     */
    async requestProcessor(requests, state) {
        let responses = [];

        for (let request of requests) {
            let response = {
                id: request.id || requests.indexOf(request),
                jsonrpc: this.options.rpcVersion || '2.0',
            };

            if (request.jsonrpc !== (this.options.rpcVersion || '2.0')) {
                responses.push(
                    createRpcError('Unknown jsonrpc version', ERRORS.INVALID_REQUEST, response.id),
                );
                continue;
            }

            let procedure = this.procedures[request.method];

            if (!procedure) {
                responses.push(
                    createRpcError('Method not found', ERRORS.METHOD_NOT_FOUND, response.id),
                );
                continue;
            }

            if (procedure.paramsSchema) {
                let validationErrors = validateRequestParams(procedure, request.params);
                if (validationErrors) {
                    responses.push(
                        createRpcError(validationErrors.map(
                            (error) => error.message,
                        ), ERRORS.INVALID_PARAMS));
                    continue;
                }
            }

            try {
                let method = new procedure(request.params, state);
                await Promise.all(this.middlewares.map((mw) => { return mw.beforeCall(method, request); }));

                response.result = await Promise.resolve(method.call());
            } catch (error) {
                console.error(error);

                let [errorCode, errorMessage] = getErrorInfo(error, this.options.errorClassToErrorCode);

                response = createRpcError(errorMessage, errorCode, response.id);
            }

            try {
                await Promise.all(this.middlewares.map((mw) => { return mw.afterCall(procedure, response); }));
            } catch (error) {
                console.error(error);

                let [errorCode, errorMessage] = getErrorInfo(error, this.options.errorClassToErrorCode);

                response = createRpcError(errorMessage, errorCode, response.id);
            }

            responses.push(response);
        }

        if (responses.length === 1) {
            return responses[0];
        }

        return responses;
    }
    /*
      Start listening and serve forever
     */
    listen() {
        let startMessage = `Server start listening on "${this.host}:${this.port}" ...`;

        this.listner.listen(this.port, this.host, (error) => {
            if (error) throw error;
            console.error(startMessage);
        });
    }
}
