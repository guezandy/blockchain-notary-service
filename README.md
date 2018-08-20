NOTE: In reference to my previous submissions feedback - of being unable to run the application.

Can't find an obvious issue besides an outdated version of node. Here:
https://github.com/nodejs/node/issues/15374

Says that this was a problem in Node 8.5.x 
I'm using node: v8.11.3 which is exactly what the course instructor had in her video.

Please let me know if updating doesn't work - or if you have the correct version. This changes to use experimental modules is just so I can use ES6 importing - but I can do it the normal way.


Chose to use HapiJS

To run the server use:
node  --experimental-modules server.mjs
Note: Experimental-modules is just to use import/export


GET Endpoint
http://localhost:8000/block/{height}

Validation:
Height must be a valid integer value

Functionality:
Returns block at height given

POST Endpoint: 
http://localhost:8000/block

Validation:
Payload must be a hashable string

Functionality:
Creates a valid block by populating hash, previousBlockHash, time, height and body fields 
Adds block to the chain
Returns the blocks json


Testing steps:
1. Download node modules packages
2. Start server using
node  --experimental-modules server.mjs

```
[tw-mbp-andrewr hapi_app (master)]$ node  --experimental-modules server.mjs
(node:72033) ExperimentalWarning: The ESM module loader is experimental.
Loading Blockchain
Attempting to add block: First block in the chain - Genesis block
Block added successfully
Server running at: http://localhost:8000
```

3. Read genesis block (gets created as soon as the server starts)
http://localhost:8000/block/0

Return:
{"hash":"0864384591f75d7119c06f8f417bbca610fc14d991824057f808fb6a5ee64aa2","height":0,"body":"First block in the chain - Genesis block","time":"1534455514795","previousBlockHash":""}

4. Add a new block
http://localhost:8000/block
I use form-data on postman to build the payload
key: body value: Testing block with test string data

Response:
{
    "hash": "c5499b75a66969d6f9bd63d6928b7bd636c06a80c48966e5e55743c18f53fc41",
    "height": 1,
    "body": "Testing block with test string data",
    "time": "1534455571470",
    "previousBlockHash": "0864384591f75d7119c06f8f417bbca610fc14d991824057f808fb6a5ee64aa2"
}

5. Get the newly created block back
http://localhost:8000/block/1

{"hash":"c5499b75a66969d6f9bd63d6928b7bd636c06a80c48966e5e55743c18f53fc41","height":1,"body":"Testing block with test string data","time":"1534455571470","previousBlockHash":"0864384591f75d7119c06f8f417bbca610fc14d991824057f808fb6a5ee64aa2"}
