/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

// TODO handle optional star fields
class Block {
    constructor(payload) {
        this.hash = "";
        this.height = 0;
        this.address = payload.address;
        this.time = 0;
        // Just creating an object instead of a whole class for star
        this.star = {
            ...payload.star
        }
        this.previousBlockHash = "";
    }
}
module.exports = Block
