'use strict';

const Blockchain = require('./blockchain');
const Hapi = require('hapi');

const mChain = new Blockchain();

// Create a server with a host and port
const server = Hapi.server({
    host: 'localhost',
    port: 8000
});

// Add the route
server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
        // TODO Make a landing page
        return 'hello world';
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

// Post block route
server.route({
    method: 'POST',
    path: '/block',
    handler: async (request, h) => {
        const payload = request.payload;

        // basic input validation
        if (typeof payload !== 'object' || Object.keys(payload).length > 1 || !payload['body']) {
            return {'error': 'Invalid formatted payload'};
        }

        let newBlockHash = null;
        try {
            newBlockHash = await mChain.addBlockFromPayload(payload['body']);
        } catch (e) {
            return {'error': e};
        }

        return newBlockHash ? newBlockHash : {
            'error': 'Internal error'
        };;
    }
});

// Start the server
async function start() {
    // Initialize the blockchain as soon as we start the server
    await mChain.init();

    try {
        await server.start();
    } catch (err) {
        console.log(err);
        process.exit(1);
    }

    console.log('Server running at:', server.info.uri);
};

start();
