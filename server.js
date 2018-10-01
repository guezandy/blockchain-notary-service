'use strict';

const Blockchain = require('./blockchain');
const RegistryQueue = require('./registryQueue');
const RegistryItem = require('./registryItem');
const Hapi = require('hapi');
const Vision = require('vision')
const Handlebars = require('handlebars')

const mChain = new Blockchain();
const mRegistryQueue = new RegistryQueue();

// Create a server with a host and port
const server = Hapi.server({
    host: 'localhost',
    port: 8005
});

// Default landing view which contains a form to fill out
server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
        return h.view('index');
    }
});

// requestValidation route
server.route({
    method: 'POST',
    path: '/requestValidation',
    handler: async (request, h) => {
        const { address } = request.payload;
        if(!address) {
            return {
                'error': 'Wallet address is required'
            }
        }
        // Method handles saving new registry request to DB with all other requests
        const newRegistryItem = await mRegistryQueue.addRegistryItemToQueueForAddress(address)
        // return json version of registry item
        return newRegistryItem.toJson();
    }
});

// /message-signature/validate route
server.route({
    method: 'POST',
    path: '/message-signature/validate',
    handler: async (request, h) => {
        const { address, signature } = request.payload;
        if (!address || !signature) {
            return {
                'error': 'Address and Signature are required'
            }
        }

        // TODO how to know if signature is valid?
        const isSignatureValid = true;
        if(!isSignatureValid) {
            return { error: 'Invalid signature' }
        }

        // If signature is valid lets save that in the db
        const registryItem = await mRegistryQueue.addValidationSignatureToRegistryItem(address, signature, isSignatureValid);

        return {
            // TODO - don't really understand this registerStar field
            registerStar: isSignatureValid,
            status: {
                ...registryItem.toJson(),
                messageSignature: isSignatureValid
            }
        }
    }
});

// Post block route
server.route({
    method: 'POST',
    path: '/block',
    handler: async (request, h) => {
        const { star, address } = request.payload;
        if(!star || !address || !star.dec || !star.ra || !star.story) {
            return { 'error': 'Invalid payload' }
        }

        // Does this address have a valid RegistryItem and a valid signature?
        const canRegisterStar = await mRegistryQueue.addressHasValidSignedRegistryItem(address);
        if (!canRegisterStar) {
            return { 'error': 'Cannot register star - has yet to validate wallet address' }
        }

        let newBlock = null;
        try {
            newBlock = await mChain.addBlockFromPayload(request.payload);
        } catch (e) {
            return {'error': e};
        }

        if(!newBlock) {
            return { 'error': 'Internal error' }
        }

        // Build response json
        return {
            body: {
                address: newBlock.address,
                star: {
                    ...newBlock.star
                }
            },
            hash: newBlock.hash,
            height: newBlock.height,
            previousBlockHash: newBlock.previousBlockHash,
            time: newBlock.time
        };
    }
});

// Get block route
server.route({
    method: 'GET',
    path: '/block/{height}',
    handler: async (request, h) => {
        const height = request.params.height;
        // basic error handling
        if(!Number.isInteger(parseFloat(height))) {
            return {'error': 'Invalid height'};
        }
        let block = null;
        try {
            block = await mChain.getBlock(height);
        } catch(e) {
            return e;
        }
        return block ? block : {'error': 'Internal error'};;
    }
});


// Start the server
async function start() {
    // Initialize the registry queue as soon as we start the server
    await mRegistryQueue.init();
    
    // Initialize the blockchain as soon as we start the server
    await mChain.init();

    await server.register({
        plugin: require('vision') // add template rendering support in hapi
    });

    // configure template support   
    server.views({
        engines: {
            html: Handlebars
        },
        path: __dirname + '/views',
        // Default path for route '/'
        layout: 'index'
    })

    try {
        await server.start();
    } catch (err) {
        console.log(err);
        process.exit(1);
    }

    console.log('Server running at:', server.info.uri);
};

start();
