const BigNumber = require('bn.js');

import { isValidAddress } from '~@vite/vitejs-hdwallet/address';
import { encodeParameters, encodeFunctionSignature } from '~@vite/vitejs-abi';
import { Vite_TokenId, Default_Hash, Delegate_Gid, BlockType } from '~@vite/vitejs-constant';
import { paramsMissing, paramsConflict, integerIllegal, unsafeInteger } from '~@vite/vitejs-error';
import { checkParams, isSafeInteger, isArray, isObject, isNonNegativeInteger } from '~@vite/vitejs-utils';

import { SignBlock, formatBlock, Address } from './type';


export function formatAccountBlock(accountBlock: formatBlock) {
    checkBlock(accountBlock);

    const { blockType, fromBlockHash, accountAddress, message, data, height, prevHash, tokenId = Vite_TokenId, fee, toAddress, amount, nonce } = accountBlock;

    const _height = height ? new BigNumber(height).add(new BigNumber(1)).toString() : '1';
    const _prevHash = prevHash || Default_Hash;

    const _accountBlock: SignBlock = {
        accountAddress,
        blockType,
        prevHash: _prevHash,
        height: _height
    };

    if (message) {
        const msgHex = `${ Buffer.from(message).toString('hex') }`;
        const msgBase64 = Buffer.from(msgHex, 'hex').toString('base64');
        _accountBlock.data = msgBase64;
    } else {
        data && (_accountBlock.data = data);
    }

    if (blockType === 2 || blockType === 1) {
        tokenId && (_accountBlock.tokenId = tokenId);
        toAddress && (_accountBlock.toAddress = toAddress);
        amount && (_accountBlock.amount = amount);
    }

    if (blockType === 4) {
        _accountBlock.fromBlockHash = fromBlockHash || '';
    }

    nonce && (_accountBlock.nonce = nonce);
    fee && (_accountBlock.fee = fee);

    return _accountBlock;
}

export function isAccountBlock({ blockType, fromBlockHash, accountAddress, message, data, toAddress, amount }: formatBlock) {
    const err = checkParams({ blockType, accountAddress, toAddress, amount }, [ 'accountAddress', 'blockType' ], [ {
        name: 'accountAddress',
        func: isValidAddress
    }, {
        name: 'toAddress',
        func: isValidAddress
    }, {
        name: 'blockType',
        func: _b => BlockType[_b],
        msg: `Don\'t have blockType ${ blockType }`
    }, {
        name: 'amount',
        func: isNonNegativeInteger,
        msg: 'Amount must be an non-negative integer string.'
    } ]);

    if (err) {
        return err;
    }

    if (Number(blockType) === 4 && !fromBlockHash) {
        return {
            code: paramsMissing.code,
            message: `${ paramsMissing.message } ReceiveBlock must have fromBlockHash.`
        };
    }

    if (message && data) {
        return {
            code: paramsConflict.code,
            message: `${ paramsConflict.message } Message and data are only allowed to exist one.`
        };
    }

    return null;
}

// gid + contractType + confirmTime + seedCount + quotaRatio + bytecode
export function getCreateContractData({ abi, hexCode, params, confirmTime = '0', quotaRatio = '10', seedCount = '0' }) {
    const err = checkParams({ confirmTime, quotaRatio, seedCount }, [ 'confirmTime', 'quotaRatio', 'seedCount' ], [ {
        name: 'confirmTime',
        func: _c => Number(_c) >= 0 && Number(_c) <= 75
    }, {
        name: 'quotaRatio',
        func: _c => Number(_c) >= 10 && Number(_c) <= 100
    }, {
        name: 'seedCount',
        func: _c => Number(_c) >= 0 && Number(_c) <= 75
    } ]);
    if (err) {
        throw err;
    }

    const jsonInterface = getAbi(abi);
    const _confirmTime = new BigNumber(confirmTime).toArray();
    const _seedCount = new BigNumber(seedCount).toArray();
    const _quotaRatio = new BigNumber(quotaRatio).toArray();
    let data = `${ Delegate_Gid }01${ Buffer.from(_confirmTime).toString('hex') }${ Buffer.from(_seedCount).toString('hex') }${ Buffer.from(_quotaRatio).toString('hex') }${ hexCode }`;

    if (jsonInterface) {
        data += encodeParameters(jsonInterface, params);
    }
    return Buffer.from(data, 'hex').toString('base64');
}

export function getAbi(jsonInterfaces, type = 'constructor') {
    if (!isArray(jsonInterfaces) && isObject(jsonInterfaces)) {
        if (jsonInterfaces.type === type) {
            return jsonInterfaces;
        }
    }

    if (!isArray(jsonInterfaces)) {
        return null;
    }

    for (let i = 0; i < jsonInterfaces.length; i++) {
        if (jsonInterfaces[i].type === type) {
            return jsonInterfaces[i];
        }
    }

    return null;
}

export function getTransactionTypeByContractList(contractList: Object): Object {
    const err = checkParams({ contractList }, ['contractList'], [{
        name: 'contractList',
        func: isObject
    }]);
    if (err) {
        throw err;
    }

    const txType = {};

    for (const transactionType in contractList) {
        const { contractAddress, abi } = contractList[transactionType];

        const err = checkParams({ contractAddress, abi }, [ 'contractAddress', 'abi' ], [{
            name: 'contractAddress',
            func: isValidAddress
        }]);
        if (err) {
            throw err;
        }

        const funcSign = encodeFunctionSignature(abi);
        const _contract: {
            transactionType: String;
            contractAddress: Address;
            abi: Object;
        } = {
            transactionType,
            contractAddress,
            abi
        };
        txType[`${ funcSign }_${ contractAddress }`] = _contract;
    }

    return txType;
}

export function checkBlock(accountBlock) {
    const err = isAccountBlock(accountBlock);
    if (err) {
        throw err;
    }

    if (!accountBlock.height) {
        return;
    }

    const isSafe = isSafeInteger(accountBlock.height);
    if (isSafe === -1) {
        throw new Error(`${ integerIllegal.message } accountBlock.height ${ accountBlock.height }`);
    } else if (isSafe === 0) {
        throw new Error(`${ unsafeInteger.message } accountBlock.height ${ accountBlock.height }`);
    }
}
