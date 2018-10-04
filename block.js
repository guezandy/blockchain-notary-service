/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

// TODO handle optional star fields
class Block {
    constructor(payload) {
        this.hash = "";
        this.height = 0;
        this.address = payload ? payload.address : null;
        this.time = 0;
        // Just creating an object instead of a whole class for star
        this.star = payload ? {
            ...payload.star
        } : null;
        this.signature = "";
        this.previousBlockHash = "";
    }

    loadBlockFromJson(blockJson) {
        if (!blockJson.address || !blockJson.hash || !blockJson.height || !blockJson.time || !blockJson.star || !blockJson.previousBlockHash) {
            return null;
        }
        this.hash = blockJson.hash;
        this.height = blockJson.height;
        this.address = blockJson.address;
        this.time = blockJson.time;
        this.star = blockJson.star;
        this.signature = blockJson.signature;
        this.previousBlockHash = blockJson.previousBlockHash;
    }

    toJson() {
        // Removes signature from blockJson
        const { signature, ...blockJson} = this;
        return {
            hash: this.hash,
            height: this.height,
            body: {
                address: this.address,
                star: {
                    ...this.star,
                    // Encode star story information in hex
                    story: this.star && this.star.story ? new Buffer(this.star.story).toString('hex') : '',
                    storyDecoded: this.star && this.star.story ? this.star.story : ''
                }
            }
        }
    }
}

module.exports = Block
