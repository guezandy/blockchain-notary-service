# Blockchain notary service
+ By: Andrew Rodriguez
+ Production URL: <http://p2.squareinches.com>

## Project specifications
+ Node app using HapiJS

## Outside resources
+ Styling via [Bootstrap CDN](https://www.bootstrapcdn.com)
+ [HapiJS rendering views](https://futurestud.io/tutorials/hapi-how-to-render-views)
+ [NodeJS refresher](https://github.com/remy/nodemon)
+ [Async await while mapping over array](https://stackoverflow.com/questions/40140149/use-async-await-with-array-map)

## Class definitions
+ RegistryItem -  Stores information provided for a single request to register a star
+ RegistryQueue - Builds a list of RegistryItem to store DB of requests to register a star - also has methods to interact with all RegisterItems stored
+ Block - Stores information about the star being registered as well as basic information used to handle a block in the blockchain.
+ Blockchain - Builds a list of Blocks to store DB - also has methods to interact with all Blocks stored

## Level db key value stored
+ key: 'queue' is an array of RegistryItems that is used to keep track of all pending requests
+ key: 'chain' is an array of blocks each block contains a registered star - this CHAIN just stores an array of block hashes in level db.
+ key: {blockhash}: Returns data on a specific block with hash = blockhash

## Running guide
+ `npm install`
Download of all required packages
+ `npm start`
As soon as you start the server for the first time - an initial Genesis block will be created as well as an empty list of star registry requests. Basically, initializing all Objects needed for functionality.

## API GUIDE
### Request Validation
Post request: `http://localhost:8000/requestValidation`
```
Payload: 
{
    "address": "sample_address" 
}
```
```
Sample Response:
{
    "address": "sample_address",
    "message": "sample_address:1538372816308:drewStarRegistry",
    "requestTimeStamp": "1538372816308",
    "validationWindow": 300000
}
```

### Validate with Signature
POST request `http://localhost:8000/message-signature/validate`
```
Payload: 
{
    "address": "sample_address",
    "signature": "sample_signature"
}
NOTE: Assuming signature is valid
```
```
Sample Response:
{
    "registerStar": true,
    "status": {
        "address": "sample_address",
        "message": "sample_address:1538372816308:drewStarRegistry",
        "requestTimeStamp": "1538372816308",
        "validationWindow": -29689731,
        "messageSignature": true
    }
}
NOTE: Time is in miliseconds
```

### Register Star
POST request `http://localhost:8000/block` 
```
Payload:
{
	"address": "sample_address",
	"star": {
		"dec": "sample_dec",
		"ra": "sample_ra",
		"story": "sample_story"
	}
}
```
```
Sample Response:
{
    "body": {
        "address": "sample_address",
        "star": {
            "dec": "sample_dec",
            "ra": "sample_ra",
            "story": "sample_story"
        }
    },
    "hash": "a04e22ba773f402f76e8410e16732e28ea6394d9c4f64c329b18e2d6c7eccd93",
    "height": 9,
    "previousBlockHash": "958a4dbf1a13c9040e60b1b8018736e56de83cf44b76a0eb98e1cd44b19b195b",
    "time": "1538402966023"
}
```
Functionality:
+ Confirms address is valid to save a star - by finishing the first 2 steps
+ Creates a valid block by populating hash, previousBlockHash, time, height and saves all fields related to the star.
+ Adds block to the blockchain.

### Blockchain explorer methods
#### Search block by hash
GET request `http://localhost:8000/stars/hash:958a4dbf1a13c9040e60b1b8018736e56de83cf44b76a0eb98e1cd44b19b195b`
```
Sample Response:
{
    "hash":"a04e22ba773f402f76e8410e16732e28ea6394d9c4f64c329b18e2d6c7eccd93",
    "height":9,
    "address":"sample_address",
    "time":"1538402966023",
    "star":{
        "dec":"sample_dec",
        "ra":"sample_ra",
        "story":"sample_story"
    },
    "previousBlockHash":"958a4dbf1a13c9040e60b1b8018736e56de83cf44b76a0eb98e1cd44b19b195b"
}
```
#### Search block by height
GET request `http://localhost:8000/block/9`
```
Sample Response:
{
    "hash":"a04e22ba773f402f76e8410e16732e28ea6394d9c4f64c329b18e2d6c7eccd93",
    "height":9,
    "address":"sample_address",
    "time":"1538402966023",
    "star":{
        "dec":"sample_dec",
        "ra":"sample_ra",
        "story":"sample_story"
    },
    "previousBlockHash":"958a4dbf1a13c9040e60b1b8018736e56de83cf44b76a0eb98e1cd44b19b195b"
}
```
#### Search for all blocks that contain an Address
GET request `http://localhost:8000/stars/address:sample_address`
```
Sample Response:
[{
    "hash":"a04e22ba773f402f76e8410e16732e28ea6394d9c4f64c329b18e2d6c7eccd93",
    "height":9,
    "address":"sample_address",
    "time":"1538402966023",
    "star":{
        "dec":"sample_dec",
        "ra":"sample_ra",
        "story":"sample_story"
    },
    "previousBlockHash":"958a4dbf1a13c9040e60b1b8018736e56de83cf44b76a0eb98e1cd44b19b195b"
}]
```
