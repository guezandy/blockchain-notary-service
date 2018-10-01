# Blockchain notary service
+ By: Andrew Rodriguez
+ Production URL: <http://p2.squareinches.com>


## Outside resources
+ Styling via [Bootstrap CDN](https://www.bootstrapcdn.com)
+ [HapiJS rendering views](https://futurestud.io/tutorials/hapi-how-to-render-views)
+ [NodeJS refresher](https://github.com/remy/nodemon)

## Class definitions


## Level db object stored
+ Queue is an array of RegisterItems that is used to keep track - when used I immediately turn it into a map

## Modifications from project requirements

## Running guide





Chose to use HapiJS

To run the server use:
npm start

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
npm start

```
[tw-mbp-andrewr hapi_app (master)]$ npm start

> hapi_app@1.0.0 start /Users/andrewr/Desktop/Blockchain couirse/hapi_app
> node server.js

Loading Blockchain
Attempting to add block: First block in the chain - Genesis block
Block added successfully
Server running at: http://localhost:8000
```

3. Read genesis block (gets created as soon as the server starts)
http://localhost:8000/block/0

Return:
{"hash":"e312fdd6768a0b839ca1c4d789b4c1a03d14dcab7a7937f801e7d2de1d5194b1","height":0,"body":"First block in the chain - Genesis block","time":"1535340548794","previousBlockHash":""}

4. Add a new block
http://localhost:8000/block
I use form-data on postman to build the payload
key: body value: Testing block with test string data

Response:
{
    "hash": "3c9261071a69299253b3d71e888958dbfcd4f929e570ab2b23b3ace95c24b4c5",
    "height": 1,
    "body": "Testing block with test string data",
    "time": "1535340641204",
    "previousBlockHash": "e312fdd6768a0b839ca1c4d789b4c1a03d14dcab7a7937f801e7d2de1d5194b1"
}

5. Get the newly created block back
http://localhost:8000/block/1

{"hash":"3c9261071a69299253b3d71e888958dbfcd4f929e570ab2b23b3ace95c24b4c5","height":1,"body":"Testing block with test string data","time":"1535340641204","previousBlockHash":"e312fdd6768a0b839ca1c4d789b4c1a03d14dcab7a7937f801e7d2de1d5194b1"}
