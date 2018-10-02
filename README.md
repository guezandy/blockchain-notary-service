# Blockchain notary service
+ By: Andrew Rodriguez
+ Production URL: n/a

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

## Diverted from project requirements
+ This app allows registering of unlimited number of stars as long as the 1000 seconds validation window is not done - via the api.
+ Working on a UI portion for this project - it may not be complete by the time the grader is looking.
+ Didn't add support for hex or ascii

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
    "address": "15chA41rzp22sh5DpfqCC45gAgXd65doAq" 
}
```
```
Sample response:
NOTE: time is in miliseconds
{
    "address": "15chA41rzp22sh5DpfqCC45gAgXd65doAq",
    "message": "15chA41rzp22sh5DpfqCC45gAgXd65doAq:1538494266596:drewStarRegistry",
    "requestTimeStamp": "1538494266596",
    "validationWindow": 1000000
}
```

### Validate with Signature
POST request `http://localhost:8000/message-signature/validate`
```
Payload: 
{
    "address": "15chA41rzp22sh5DpfqCC45gAgXd65doAq",
    "signature": "H473p+j2HgEfkMbGS3x4cBpHTHdDNEjaWlqsLr1/UuzyLjqzs2kkCzWaO/7BD6pk/LZUklw1zZ00LnghESqIUrI="
}
```
```
Sample Response:
{
    "registerStar": true,
    "status": {
        "address": "15chA41rzp22sh5DpfqCC45gAgXd65doAq",
        "message": "15chA41rzp22sh5DpfqCC45gAgXd65doAq:1538494266596:drewStarRegistry",
        "requestTimeStamp": "1538494266596",
        "validationWindow": 739045,
        "messageSignature": "valid"
    }
}
NOTE: Time is in miliseconds
```

### Register Star
POST request `http://localhost:8000/block` 
```
Payload:
{
	"address": "15chA41rzp22sh5DpfqCC45gAgXd65doAq",
	"star": {
		"dec": "bright",
		"ra": "star",
		"story": "middle of orions belt"
	}
}
```
```
Sample Response:
{
    "body": {
        "address": "15chA41rzp22sh5DpfqCC45gAgXd65doAq",
        "star": {
            "dec": "bright",
            "ra": "star",
            "story": "middle of orions belt"
        }
    },
    "hash": "515f7266fef60fcfb02d03eae510709983b5f29cf478b310c9a3f780e7c0ddf1",
    "height": 1,
    "previousBlockHash": "e96752197e05dec755115aa1f93bf1a87ddeff6e0e2991bd87560106a56d5378",
    "time": "1538494577448"
}
```
Functionality:
+ Confirms address is valid to save a star - by finishing the first 2 steps
+ Creates a valid block by populating hash, previousBlockHash, time, height and saves all fields related to the star.
+ Adds block to the blockchain.

### Blockchain explorer methods
#### Search block by hash
GET request `http://localhost:8000/stars/hash:515f7266fef60fcfb02d03eae510709983b5f29cf478b310c9a3f780e7c0ddf1`
```
Sample Response:
{
    "hash":"515f7266fef60fcfb02d03eae510709983b5f29cf478b310c9a3f780e7c0ddf1",
    "height":1,
    "address":"15chA41rzp22sh5DpfqCC45gAgXd65doAq",
    "time":"1538494577448",
    "star":{
        "dec":"bright",
        "ra":"star",
        "story":"middle of orions belt"
    },
    "previousBlockHash":"e96752197e05dec755115aa1f93bf1a87ddeff6e0e2991bd87560106a56d5378"
}
```
#### Search block by height
GET request `http://localhost:8000/block/1`
```
Sample Response:
{
    "hash":"515f7266fef60fcfb02d03eae510709983b5f29cf478b310c9a3f780e7c0ddf1",
    "height":1,
    "address":"15chA41rzp22sh5DpfqCC45gAgXd65doAq",
    "time":"1538494577448",
    "star":{
        "dec":"bright",
        "ra":"star",
        "story":"middle of orions belt"
    },
    "previousBlockHash":"e96752197e05dec755115aa1f93bf1a87ddeff6e0e2991bd87560106a56d5378"
}
```
#### Search for all blocks that contain an Address
GET request `http://localhost:8000/stars/address:15chA41rzp22sh5DpfqCC45gAgXd65doAq`
```
Sample Response:
[{
    "hash":"515f7266fef60fcfb02d03eae510709983b5f29cf478b310c9a3f780e7c0ddf1",
    "height":1,
    "address":"15chA41rzp22sh5DpfqCC45gAgXd65doAq",
    "time":"1538494577448",
    "star":{
        "dec":"bright",
        "ra":"star",
        "story":"middle of orions belt"
    },
    "previousBlockHash":"e96752197e05dec755115aa1f93bf1a87ddeff6e0e2991bd87560106a56d5378"
}]
NOTE: Returns array of stars registered by this address
```
