'use strict';

import Server from './server';
import Procedure from './procedure';
import Middleware from './middleware';

export { throwRPCError, ERRORS } from './errors';
export { getBearerTokenFromRequest } from './utils';


const JayRPC = {
    Server: Server,
    Procedure: Procedure,
    Middleware: Middleware,
};

export default JayRPC;
