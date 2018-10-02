const level = require('level');
const RegistryItem = require('./registryItem');

const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');
/* ===== RegistryQueue Class ==========================
|  Class used to store and fetch all incoming star registry requests 		|
|  ================================================*/
class RegistryQueue {
    constructor() {
        this.initialized = false;
        this.queueDB = './registryqueuedata';
        this.db = level(this.queueDB);
        this.registryQueueMap = {};
    }

    init() {
        console.log('Initializing Queue');
        return new Promise((resolve, reject) => {
            this.db.get('queue', (error, queue) => {
                this.initialized = true;
                if (error) {
                    // Assuming this error is "Key 'queue' does not exist"
                    // If thats the problem they its the first time we're loading the queue
                    // Lets add a queue to the DB
                    this.db.put('queue', {});
                    this.registryQueueMap = {};
                    resolve();
                } else {
                    // Store a map of {'wallet-address': RequestItem, ...}
                    this.registryQueueMap = this._arrayToMap(this._parseRawData(queue));
                    resolve();
                }
            });
        });
    }

    _parseRawData(data) {
        let parsedData = null;
        try {
            parsedData = JSON.parse(data);
        } catch (e) {
            // Handles a wierd case where level db has an array of 1 element it just returns the single element
            // In this case its just a single hash as a string that cannot be parsed as json
            parsedData = [data]
        };
        return parsedData;
    }

    _arrayToMap(parsedData) {
        const registryMap = {};
        parsedData.forEach((item) => {
            registryMap[item.address] = item;
        });
        return registryMap;
    }

    async addRegistryItemToQueueForAddress(address) {
        console.log(`Attempting to add star registry to queue for address: ${address}`);
        // Create an empty registry item
        const newRegistryItem = new RegistryItem();
        // Populate it with wallet address and timestamp
        newRegistryItem.createNewRegistryItemForAddress(address);

        // If queue is not loaded into memory - lets load it to be able to add to it
        if (!this.initialized) {
            console.log('Registry Queue not loaded in memory yet - Initializing');
            await this.init();
        }
        // Add item to the queue to reference in future occasions
        this.registryQueueMap[newRegistryItem.address] = newRegistryItem.toDBJson(); // Push only array of queue values into the DB
        this.db.put('queue', JSON.stringify(Object.values(this.registryQueueMap)));
        console.log('Registry item added to queue successfully');
        return newRegistryItem;
    }

    async validateSignature(mAddress, mSignature) {
        console.log(`Attempting to add signature validtion to registry item for: ${mAddress}`);

        // If queue is not loaded into memory - lets load it to be able to add to it
        if (!this.initialized) {
            console.log('Registry Queue not loaded in memory yet - Initializing');
            await this.init();
        }

        const registryItemJson = await this.getRegistryItemJsonForAddress(mAddress);
        if (!registryItemJson) {
            return;
        }
        const registryItem = new RegistryItem();
        registryItem.loadRegistryItemFromJson(registryItemJson);
        const message = registryItem.message;

        // Handle errors in validation
        const errors = [];
        // Check if registry request is expired
        if(registryItem.validationWindow < 0) {
            errors.push('Time has expired for this request');
        }

        let isSignatureValid = false;
        try {
            isSignatureValid = bitcoinMessage.verify(message, mAddress, mSignature);
        } catch(e) {
            errors.push(e.toString());
        }

        // Updates fields in JSON format
        registryItem.signature = mSignature;
        registryItem.signatureValid = isSignatureValid;

        this.registryQueueMap[registryItem.address] = registryItem.toDBJson();
        this.db.put('queue', JSON.stringify(Object.values(this.registryQueueMap)));
        console.log('Added valid signature to registry item successfully');
        return {
            'errors': errors,
            'registryItem': registryItem
        };
    }

    async addressHasValidSignedRegistryItem(address) {
        console.log(`Checking queue for any valid signed requests from: ${address}`);
        // If queue is not loaded into memory - lets load it to be able to add to it
        if (!this.initialized) {
            console.log('Registry Queue not loaded in memory yet - Initializing');
            await this.init();
        }
        const registryItemJson = await this.getRegistryItemJsonForAddress(address);
        if (!registryItemJson) {
            return;
        }
        return registryItemJson['signatureValid'];
    }

    getQueueMap() {
        console.log('Getting Queue');
        return new Promise((resolve, reject) => {
            this.db.get('queue', (error, queue) => {
                if (error) {
                    reject();
                } else {
                    const registryQueueMap = this._arrayToMap(this._parseRawData(queue));
                    resolve(registryQueueMap);
                }
            });
        });
    }

    getRegistryItemJsonForAddress(address) {
        return new Promise(async (resolve, reject) => {
            // Level db map indeces only work if there strings
            const addressAsString = '' + address;
            const queue = await this.getQueueMap();
            if (!queue[addressAsString]) {
                return;
            }
            resolve(queue[addressAsString]);
        });
    }
}

module.exports = RegistryQueue
