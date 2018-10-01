/* ===== RegistryItem Class ==============================
|  Class with a constructor for star registry in queue object 			   |
|  ===============================================*/

// Miliseconds
const VALIDATION_WINDOW = 300000

class RegistryItem {
    constructor() {
        this.address = '';
        this.requestTimeStamp = 0;
        this.message = '';
        // In miliseconds
        this.validationWindow = VALIDATION_WINDOW;
        this.signature = '';
        this.signatureValid = false;
    }

    // Populates the field required for a new registry item
    createNewRegistryItemForAddress(address) {
        const requestTimeStamp = new Date().getTime().toString();
        this.address = address;
        this.requestTimeStamp = requestTimeStamp;
        this.message = `${address}:${requestTimeStamp}:drewStarRegistry`;
        this.validationWindow = VALIDATION_WINDOW;
    }

    // Take json for a registry item and turn it into a registry item
    loadRegistryItemFromJson(registryJson) {
        const { address, requestTimeStamp, message, validationWindow } = registryJson;
        if (!address || !requestTimeStamp || !message || !validationWindow) {
            return null;
        }
        this.address = address;
        this.message = message;
        this.requestTimeStamp = requestTimeStamp;
        // calculate remaining time in validation window
        // (requestTimeStamp + 300) - currentTimeStamp
        const currentTimeStamp = new Date().getTime().toString();
        this.validationWindow = (parseInt(requestTimeStamp) + VALIDATION_WINDOW) - currentTimeStamp;
    }

    toJson() {
        return {
            address: this.address,
            message: this.message,
            requestTimeStamp: this.requestTimeStamp,
            validationWindow: this.validationWindow
        }
    }

    // Stored values in the DB
    toDBJson() {
        return {
            address: this.address,
            message: this.message,
            requestTimeStamp: this.requestTimeStamp,
            validationWindow: this.validationWindow,
            signature: this.signature,
            signatureValid: this.signatureValid
        }
    }

}
module.exports = RegistryItem
