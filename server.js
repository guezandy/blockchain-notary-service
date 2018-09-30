'use strict';

const Blockchain = require('./blockchain');
const Hapi = require('hapi');
const Vision = require('vision')
const Handlebars = require('handlebars')

const mChain = new Blockchain();

// Create a server with a host and port
const server = Hapi.server({
    host: 'localhost',
    port: 8005
});

server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
        // TODO Make a landing page
        return h.view('index');
    }
});


// TODO - add http://localhost:8000/requestValidation route
server.route({
    method: 'POST',
    path: '/requestValidation',
    handler: async (request, h) => {
        return 'ues';
    }
});


// TODO - /message-signature/validate


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
