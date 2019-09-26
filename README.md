# JayRPC

JsonRPC server with middleware support.

## Installation

```bash
npm install jayrpc
```

## Simple usage

```javascript
import JayRPC, { throwRPCError, ERRORS } from 'jayrpc';


class SimpleProcedure extends JayRPC.Procedure {
    static get name() {
        return 'Array.sum'
    }

    async call() {
        if (!Array.isArray(this.params)) {
            throwRPCError('Params can be array only', ERRORS.VALIDATION_ERROR);
        }
        return this.params.reduce((a, b) => a + b, 0)
    }
}


let server = JayRPC.Server('0.0.0.0', 8080, {
    rpcVersion: '2.0',
    errorClassToErrorCode: [
        [Error, ERRORS.INTERNAL_ERROR],
    ],
});

server.registerProcedure(SimpleProcedure);

server.listen();
```

How to make request to server

```bash
curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc": "2.0", "method": "Array.sum", "params": [1,2,3,4,5]}'
```
