import { Tensor } from 'onnxruntime-common';
/**
 * Copied from ONNX definition. Use this to drop dependency 'onnx_proto' to decrease compiled .js file size.
 */
export declare const enum DataType {
    undefined = 0,
    float = 1,
    uint8 = 2,
    int8 = 3,
    uint16 = 4,
    int16 = 5,
    int32 = 6,
    int64 = 7,
    string = 8,
    bool = 9,
    float16 = 10,
    double = 11,
    uint32 = 12,
    uint64 = 13,
    complex64 = 14,
    complex128 = 15,
    bfloat16 = 16
}
/**
 * Map string tensor data to enum value
 */
export declare const tensorDataTypeStringToEnum: (type: string) => DataType;
/**
 * Map enum value to string tensor data
 */
export declare const tensorDataTypeEnumToString: (typeProto: DataType) => Tensor.Type;
/**
 * get tensor element size in bytes by the given data type
 * @returns size in integer or undefined if the data type is not supported
 */
export declare const getTensorElementSize: (dateType: number) => number | undefined;
/**
 * get typed array constructor by the given tensor type
 */
export declare const tensorTypeToTypedArrayConstructor: (type: Tensor.Type) => Float32ArrayConstructor | Uint8ArrayConstructor | Int8ArrayConstructor | Uint16ArrayConstructor | Int16ArrayConstructor | Int32ArrayConstructor | BigInt64ArrayConstructor | Uint8ArrayConstructor | Float64ArrayConstructor | Uint32ArrayConstructor | BigUint64ArrayConstructor;
/**
 * Map string log level to integer value
 */
export declare const logLevelStringToEnum: (logLevel: 'verbose' | 'info' | 'warning' | 'error' | 'fatal') => number;
