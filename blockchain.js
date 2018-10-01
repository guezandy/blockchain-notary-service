/* ===== Persist data with LevelDB =======================
|  Learn more: level: https://github.com/Level/level     |
|  =====================================================*/
const level = require('level');

/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/
const SHA256 = require('crypto-js/sha256');

const Block = require('./block');

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/
class Blockchain {
    constructor() {
        this.initialized = false;
        this.chainDB = './chaindata';
        this.db = level(this.chainDB);
        this.chain = [];
    }

    init() {
        console.log('Loading Blockchain');
        return new Promise((resolve, reject) => {
            this.db.get('chain', (error, chain) => {
                this.initialized = true;
                if (error) {
                    // Assuming this error is "Key 'chain' does not exist"
                    // If thats the problem they its the first time we're loading the block chain
                    // Lets create the genesis block
                    this.chain = [];
                    // Genesis block persist as the first block in the blockchain using LevelDB
                    // Once the DB has a key 'chain' then we can assume the first genesis block is there
                    // If its not there its the start of a brand new chain lets add the genesis here
                    this.addBlock(new Block("First block in the chain - Genesis block"));
                    this.db.put('chain', this.chain);
                    resolve();
                } else {
                    this.chain = this._parseRawChainData(chain);
                    resolve();
                }
            });
        });
    }

    _parseRawChainData(chain) {
        let parsedChain = null;
        try {
            parsedChain = JSON.parse(chain);
        } catch (e) {
            // Handles a wierd case where level db has an array of 1 element it just returns the single element
            // In this case its just a single hash as a string that cannot be parsed as json
            parsedChain = [chain]
        };
        return parsedChain;
    }

    addBlockFromPayload(payload) {
        const block = new Block(payload);
        return this.addBlock(block);
    }

    // Add new block
    async addBlock(newBlock) {
        console.log(`Attempting to add block for address: ${newBlock.address}`);
        // If chain is not loaded into memory - lets load it
        if (!this.initialized) {
            console.log('Blockchain not loaded in memory yet - Initializing');
            await this.init();
        }

        // Block height
        newBlock.height = this.chain.length;
        // UTC timestamp - Stil not sure why we are slicing .slice(0,-3)
        newBlock.time = new Date().getTime().toString();
        // previous block hash
        if (this.chain.length > 0) {
            newBlock.previousBlockHash = this.chain[this.chain.length - 1];
        }
        // Block hash with SHA256 using newBlock and converting to a string
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        // Adding solely block hashes to the chain - this will ease bloating of local memory
        // when fetching the chain - we'll only fetch entire blocks if we need them.
        this.chain.push(newBlock.hash);
        this.db.put('chain', JSON.stringify(this.chain));
        this.db.put(newBlock.hash, JSON.stringify(newBlock));
        console.log('Block added successfully');
        return newBlock;
    }

    getBlock(blockHeight) {
        return new Promise((resolve, reject) => {
            // Short circuit if height is invalid
            if (blockHeight < 0) {
                console.log('Invalid block height - height must be greater than 0');
                reject('Invalid block height - height must be greater than 0');
            }
            this.db.get('chain', async (error, rawChain) => {
                if (error) {
                    console.log("Error retreiving chain from DB - try init()");
                    reject("Error retreiving chain from DB - try init()");
                }
                const chain = this._parseRawChainData(rawChain);
                if (chain.length <= blockHeight) {
                    console.log('Invalid block height - height passed current chain height');
                    reject('Invalid block height - height passed current chain height');
                }
                const blockHash = chain[blockHeight];
                if (blockHash) {
                    const block = await this.getBlockFromHash(blockHash)
                    resolve(block);
                } else {
                    reject('Invalid block hash');
                }
            });
        });
    }

    getBlockFromHash(blockHash) {
        return new Promise((resolve, reject) => {
            this.db.get(blockHash, (error, block) => {
                if (error) {
                    console.log(`Could not find block with hash ${blockHash}`);
                    reject(`Could not find block with hash ${blockHash}`);
                }
                // return object as a single string
                resolve(block);
            });
        });
    }

    getBlockHeight() {
        return new Promise((resolve, reject) => {
            this.db.get('chain', (error, chain) => {
                if (error) {
                    console.log("Error retreiving chain from DB - try init()");
                    reject("Error retreiving chain from DB - try init()");
                }
                resolve(JSON.parse(chain).length - 1);
            });
        });
    }

    async validateBlock(blockHeight) {
        let block = await this.getBlock(blockHeight);
        // get block hash
        let blockHash = block.hash;
        // remove block hash to test block integrity
        block.hash = '';
        // generate block hash
        let validBlockHash = SHA256(JSON.stringify(block)).toString();
        // Compare
        if (blockHash === validBlockHash) {
            return true;
        } else {
            console.log(`Block # ${blockHeight} invalid hash:\n ${blockHash} <> ${validBlockHash}`);
            return false;
        }
    }

    async validateChain() {
        const chainLength = await this.getBlockHeight();
        let errorLog = [];
        for (let i = 0; i < chainLength; i++) {
            // validate block
            const isBlockValid = await this.validateBlock(i);
            if (!isBlockValid) {
                errorLog.push(i);
            }
            // compare blocks hash link
            const block = await this.getBlock(i);
            const blockHash = block.hash;
            const nextBlock = await this.getBlock(i + 1);
            const nextBlockPrevHash = nextBlock.previousBlockHash;
            if (blockHash !== nextBlockPrevHash) {
                errorLog.push(i);
            }
        }
        if (errorLog.length > 0) {
            console.log(`Block errors =  ${errorLog.length}`);
            console.log(`Blocks: ${errorLog}`);
            return false;
        } else {
            console.log('No errors detected');
            return true;
        }
    }
}

module.exports = Blockchain
