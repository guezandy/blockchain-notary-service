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
        // Check if there is an active registry item + update validation window
        let registryItem;
        try {
            registryItem = await mRegistryQueue.getAddressRegistryItem(address);
        } catch(e) {
            console.log('No valid request found for this address');
        }
        // If there isnt a registry item or the validation window has expired - lets create a new one
        if (!registryItem || registryItem.validationWindow < 0) {
            // Method handles saving new registry request to DB with all other requests
            registryItem = await mRegistryQueue.addRegistryItemToQueueForAddress(address);
        }
        // return json version of registry item
        return registryItem.toJson();
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
        // Validate signature and save to db - returns errors and registry item
        const { errors, registryItem } = await mRegistryQueue.validateSignature(address, signature);
        if(errors.length > 0) {
            return { 'errors': errors };
        }

        const isSignatureValid = registryItem.signatureValid;
        return {
            registerStar: isSignatureValid,
            status: {
                ...registryItem.toJson(),
                messageSignature: isSignatureValid ? "valid" : "invalid"
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

        // https://stackoverflow.com/questions/14313183/javascript-regex-how-do-i-check-if-the-string-is-ascii-only
        const storyIsAcii = /^[\x00-\x7F]*$/.test(star.story);
        if(!storyIsAcii) {
            return {
                'error': 'Star story is not ascii'
            }
        }

        // https://stackoverflow.com/questions/2219526/how-many-bytes-in-a-javascript-string
        const byteLengthOfStarStory = encodeURI(star.story).split(/%..|./).length - 1;
        if (byteLengthOfStarStory > 500) {
            return {
                'error': 'Star story too long'
            }
        }


        // Does this address have a valid RegistryItem and a valid signature?
        let canRegisterStar = false;
        try {
            const registryItem = await mRegistryQueue.getAddressRegistryItem(address);
            canRegisterStar = registryItem.signatureValid;
        } catch (e) {}

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

        // Delete the registryItem now that a star is being registerd - so they cannot create another star with this request
        await mRegistryQueue.removeRegistryItemForAddress(address);

        // Build response json
        return JSON.parse(JSON.stringify({
            body: {
                address: newBlock.address,
                star: {
                    ...newBlock.star,
                    story: new Buffer(newBlock.star.story).toString('hex')
                }
            },
            hash: newBlock.hash,
            height: newBlock.height,
            previousBlockHash: newBlock.previousBlockHash,
            time: newBlock.time
        }));
    }
});

// Get all stars registered to wallet address
server.route({
    method: 'GET',
    path: '/stars/{urlParam}',
    handler: async (request, h) => {
        const { urlParam } = request.params;

        // Confirm the param exists and there is only 1 colon
        if (!urlParam) {
            return { 'error': 'Missing required param'}
        }
        const splitUrlParam = urlParam.split(":");
        if(splitUrlParam.length > 2) {
            return { 'error': 'invalid param' }
        }

        const method = splitUrlParam[0];
        const field = splitUrlParam[1];

        if (!['address', 'hash'].includes(method) || !field) {
            return { 'error': 'Invalid query method' }
        }

        try {
            if (method === 'address') {
                return await mChain.getBlocksByAddress(field);
            } else if (method === 'hash') {
                return await mChain.getBlockFromHash(field);
            }
        } catch(e) {
            // Fail nicely
            return { 'error': e };
        }

        return { error: 'Internal error' };
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
