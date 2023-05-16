"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createView = exports.sizeof = void 0;
const sizeof = (type) => {
    switch (type) {
        case 'bool':
        case 'int8':
        case 'uint8':
            return 1;
        case 'int16':
        case 'uint16':
            return 2;
        case 'int32':
        case 'uint32':
        case 'float32':
            return 4;
        case 'int64':
        case 'uint64':
        case 'float64':
            return 8;
        default:
            throw new Error(`cannot calculate sizeof() on type ${type}`);
    }
};
exports.sizeof = sizeof;
const dataviewConstructor = (type) => {
    switch (type) {
        case 'bool':
        case 'uint8':
            return Uint8Array;
        case 'int8':
            return Int8Array;
        case 'int16':
            return Int16Array;
        case 'uint16':
            return Uint16Array;
        case 'int32':
            return Int32Array;
        case 'uint32':
            return Uint32Array;
        case 'int64':
            return BigInt64Array;
        case 'uint64':
            return BigUint64Array;
        case 'float32':
            return Float32Array;
        case 'float64':
            return Float64Array;
        default:
            // should never run to here
            throw new Error('unspecified error');
    }
};
const createView = (dataBuffer, type) => new (dataviewConstructor(type))(dataBuffer);
exports.createView = createView;
//# sourceMappingURL=tensor.js.map