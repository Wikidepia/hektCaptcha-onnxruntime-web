"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.logLevelStringToEnum = exports.tensorTypeToTypedArrayConstructor = exports.getTensorElementSize = exports.tensorDataTypeEnumToString = exports.tensorDataTypeStringToEnum = void 0;
/**
 * Map string tensor data to enum value
 */
const tensorDataTypeStringToEnum = (type) => {
    switch (type) {
        case 'int8':
            return 3 /* DataType.int8 */;
        case 'uint8':
            return 2 /* DataType.uint8 */;
        case 'bool':
            return 9 /* DataType.bool */;
        case 'int16':
            return 5 /* DataType.int16 */;
        case 'uint16':
            return 4 /* DataType.uint16 */;
        case 'int32':
            return 6 /* DataType.int32 */;
        case 'uint32':
            return 12 /* DataType.uint32 */;
        case 'float32':
            return 1 /* DataType.float */;
        case 'float64':
            return 11 /* DataType.double */;
        case 'string':
            return 8 /* DataType.string */;
        case 'int64':
            return 7 /* DataType.int64 */;
        case 'uint64':
            return 13 /* DataType.uint64 */;
        default:
            throw new Error(`unsupported data type: ${type}`);
    }
};
exports.tensorDataTypeStringToEnum = tensorDataTypeStringToEnum;
/**
 * Map enum value to string tensor data
 */
const tensorDataTypeEnumToString = (typeProto) => {
    switch (typeProto) {
        case 3 /* DataType.int8 */:
            return 'int8';
        case 2 /* DataType.uint8 */:
            return 'uint8';
        case 9 /* DataType.bool */:
            return 'bool';
        case 5 /* DataType.int16 */:
            return 'int16';
        case 4 /* DataType.uint16 */:
            return 'uint16';
        case 6 /* DataType.int32 */:
            return 'int32';
        case 12 /* DataType.uint32 */:
            return 'uint32';
        case 1 /* DataType.float */:
            return 'float32';
        case 11 /* DataType.double */:
            return 'float64';
        case 8 /* DataType.string */:
            return 'string';
        case 7 /* DataType.int64 */:
            return 'int64';
        case 13 /* DataType.uint64 */:
            return 'uint64';
        default:
            throw new Error(`unsupported data type: ${typeProto}`);
    }
};
exports.tensorDataTypeEnumToString = tensorDataTypeEnumToString;
/**
 * get tensor element size in bytes by the given data type
 * @returns size in integer or undefined if the data type is not supported
 */
const getTensorElementSize = (dateType) => [undefined, 4, 1, 1, 2, 2, 4, 8, undefined, 1, 2, 8, 4, 8, undefined, undefined, undefined][dateType];
exports.getTensorElementSize = getTensorElementSize;
/**
 * get typed array constructor by the given tensor type
 */
const tensorTypeToTypedArrayConstructor = (type) => {
    switch (type) {
        case 'float32':
            return Float32Array;
        case 'uint8':
            return Uint8Array;
        case 'int8':
            return Int8Array;
        case 'uint16':
            return Uint16Array;
        case 'int16':
            return Int16Array;
        case 'int32':
            return Int32Array;
        case 'bool':
            return Uint8Array;
        case 'float64':
            return Float64Array;
        case 'uint32':
            return Uint32Array;
        case 'int64':
            return BigInt64Array;
        case 'uint64':
            return BigUint64Array;
        default:
            throw new Error(`unsupported type: ${type}`);
    }
};
exports.tensorTypeToTypedArrayConstructor = tensorTypeToTypedArrayConstructor;
/**
 * Map string log level to integer value
 */
const logLevelStringToEnum = (logLevel) => {
    switch (logLevel) {
        case 'verbose':
            return 0;
        case 'info':
            return 1;
        case 'warning':
            return 2;
        case 'error':
            return 3;
        case 'fatal':
            return 4;
        default:
            throw new Error(`unsupported logging level: ${logLevel}`);
    }
};
exports.logLevelStringToEnum = logLevelStringToEnum;
//# sourceMappingURL=wasm-common.js.map