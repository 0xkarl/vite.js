const assert = require('assert');

import { createAddressByPrivateKey, isValidAddress, getOriginalAddressFromAddress, getAddressFromOriginalAddress, getAddressFromPublicKey } from '../../../src/hdWallet/address';

const privKey = 'afa2a3ab3347b5bbe210dc099b2e010e5491d698e5112db6bc278cfd8fa27eb9f0fde0110193147e7961e61eeb22576c535b3442fd6bd9c457775e0cc69f1951';

const addr = createAddressByPrivateKey();
const addrContract = createAddressByPrivateKey(null, true);
const addrPriv = createAddressByPrivateKey(privKey);
const addrPrivContract = createAddressByPrivateKey(privKey, true);


describe('createAddressByPrivateKey', function () {
    it('with privateKey, isContract = false', function () {
        assert.equal(addrPriv.privateKey.toString('hex'), privKey);
    });

    it('with privateKey, isContract = true', function () {
        assert.equal(addrPrivContract.privateKey.toString('hex'), privKey);
    });

    it('without privateKey, isContract = false', function () {
        assert.equal(addr.privateKey instanceof Buffer, true);
    });

    it('without privateKey, isContract = true', function () {
        assert.equal(addr.privateKey instanceof Buffer, true);
    });
});

describe('isValidAddress', function () {
    it('createAddressByPrivateKey addr', function () {
        assert.equal(isValidAddress(addr.address), 1);
    });

    it('createAddressByPrivateKey addrContract', function () {
        assert.equal(isValidAddress(addrContract.address), 2);
    });

    it('createAddressByPrivateKey addrPriv', function () {
        assert.equal(isValidAddress(addrPriv.address), 1);
    });

    it('createAddressByPrivateKey addrPrivContract', function () {
        assert.equal(isValidAddress(addrPrivContract.address), 2);
    });

    it('Old user address: case 1', function () {
        assert.equal(isValidAddress('vite_69f3bdb5cdcfa145ae6cc42593a89088ff3dac587eb692d689'), 1);
    });

    it('Old user address: case 2', function () {
        assert.equal(isValidAddress('vite_c18cadb085fc4e291469106e5a3f197aef87f96cd297eb6b46'), 1);
    });

    it('New user address', function () {
        assert.equal(isValidAddress('vite_010203040506070809080706050403020102030412227c8b71'), 1);
    });

    it('New contract address', function () {
        assert.equal(isValidAddress('vite_0102030405060708090807060504030201020304eddd83748e'), 2);
    });
});

describe('getOriginalAddressFromAddress', function () {
    it('createAddressByPrivateKey', function () {
        assert.equal(getOriginalAddressFromAddress(addr.address), addr.originalAddress);
    });

    it('user address 1', function () {
        const addr = getOriginalAddressFromAddress('vite_69f3bdb5cdcfa145ae6cc42593a89088ff3dac587eb692d689');
        assert.equal(addr, '69f3bdb5cdcfa145ae6cc42593a89088ff3dac5800');
    });


    it('user address 2', function () {
        const addr = getOriginalAddressFromAddress('vite_010203040506070809080706050403020102030412227c8b71');
        assert.equal(addr, '010203040506070809080706050403020102030400');
    });

    it('contract address', function () {
        const addr = getOriginalAddressFromAddress('vite_0102030405060708090807060504030201020304eddd83748e');
        assert.equal(addr, '010203040506070809080706050403020102030401');
    });
});

describe('getAddressFromOriginalAddress', function () {
    it('createAddressByPrivateKey', function () {
        assert.equal(getAddressFromOriginalAddress(addr.originalAddress), addr.address);
    });

    it('case 1', function () {
        const addr = getAddressFromOriginalAddress('69f3bdb5cdcfa145ae6cc42593a89088ff3dac5800');
        assert.equal(addr, 'vite_69f3bdb5cdcfa145ae6cc42593a89088ff3dac587eb692d689');
    });
});

describe('getAddressFromPublicKey', function () {
    it('createAddressByPrivateKey', function () {
        assert.equal(getAddressFromPublicKey(addr.publicKey), addr.address);
    });
});
