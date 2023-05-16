export declare namespace Tensor {
    interface DataTypeMap {
        bool: Uint8Array;
        float32: Float32Array;
        float64: Float64Array;
        string: string[];
        int8: Int8Array;
        uint8: Uint8Array;
        int16: Int16Array;
        uint16: Uint16Array;
        int32: Int32Array;
        uint32: Uint32Array;
        int64: BigInt64Array;
        uint64: BigUint64Array;
    }
    type DataType = keyof DataTypeMap;
    type StringType = Tensor.DataTypeMap['string'];
    type BooleanType = Tensor.DataTypeMap['bool'];
    type IntegerType = Tensor.DataTypeMap['int8'] | Tensor.DataTypeMap['uint8'] | Tensor.DataTypeMap['int16'] | Tensor.DataTypeMap['uint16'] | Tensor.DataTypeMap['int32'] | Tensor.DataTypeMap['uint32'] | Tensor.DataTypeMap['int64'] | Tensor.DataTypeMap['uint64'];
    type FloatType = Tensor.DataTypeMap['float32'] | Tensor.DataTypeMap['float64'];
    type NumberType = BooleanType | IntegerType | FloatType;
    type Id = number;
}
export declare const sizeof: (type: Tensor.DataType) => number;
export declare const createView: (dataBuffer: ArrayBuffer, type: Tensor.DataType) => Int32Array | Uint32Array | BigInt64Array | BigUint64Array | Uint8Array | Float32Array | Float64Array | Int8Array | Int16Array | Uint16Array;
/**
 * a TensorView does not own the data.
 */
export interface TensorView {
    readonly data: number;
    readonly dataType: number;
    readonly dims: readonly number[];
    /**
     * get a Float32Array data view of the tensor data. tensor data must be on CPU.
     */
    getFloat32Array(): Float32Array;
    /**
     * create a new tensor view with the same data but different dimensions.
     */
    reshape(newDims: readonly number[]): TensorView;
}
