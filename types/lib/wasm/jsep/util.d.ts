export declare class MatMulUtil {
    /**
     * Calculate the expected shape when matrix multiplication
     * @param a The shape of tensor A. Should be a tuple of 2 positive integers
     * @param b The shape of tensor B. Should be a tuple of 2 positive integers
     * @returns The expected shape of the result, or undefined if N/A
     */
    static calcMatMulShape(a: [number, number], b: [number, number]): [number, number] | undefined;
}
export declare class BroadcastUtil {
    /**
     * Calculate the expected shape when broadcasting 2 tensors
     * @param a The shape of tensor A. Should be an array of positive integers
     * @param b The shape of tensor B. Should be an array of positive integers
     * @param isMatMul Whether the operation is MatMul
     * @returns The expected shape of the result, or undefined if N/A
     */
    static calcShape(adims: readonly number[], bdims: readonly number[], isMatMul?: boolean): readonly number[] | undefined;
    /**
     * Determine if a shape is unidirectional broadcastable to another shape
     * @param shape The input shape
     * @param finalShape The desired shape after broadcasting
     */
    static isValidBroadcast(shape: readonly number[], finalShape: readonly number[]): boolean;
}
export declare class ShapeUtil {
    /**
     * calculate the size (number of elements)
     */
    static size(dims: readonly number[]): number;
    /**
     * calculate the size (number of elements) from the given axis (inclusive)
     */
    static sizeFromDimension(dims: readonly number[], axis: number): number;
    /**
     * calculate the size (number of elements) to the given axis (exclusive)
     */
    static sizeToDimension(dims: readonly number[], axis: number): number;
    /**
     * calculate the size (number of elements) from and to the given axis [start, end)
     */
    static getSizeFromDimensionRange(dims: readonly number[], start: number, end: number): number;
    static computeStrides(dims: readonly number[]): readonly number[];
    /**
     * normailze axis of range [-r, r) into [0, r).
     */
    static normalizeAxis(axis: number, tensorRank: number): number;
    static normalizeAxes(axes: readonly number[], tensorRank?: number): number[];
    /**
     * Sorts a given array based on the indices in the Perm array
     * Used in Transpose
     * @param a Array to be sorted such as dims or strides
     * @param perm Perm given; if null a will be reversed
     */
    static sortBasedOnPerm(a: readonly number[], perm?: readonly number[]): readonly number[];
    /**
     * Pads a given shape according to the padding values
     * @param dims shape of the Tensor to be padded
     * @param pad pad values
     */
    static padShape(dims: readonly number[], pad: readonly number[]): readonly number[];
    /**
     * Determines if the two shapes are identical
     * @param shape1
     * @param shape2
     */
    static areEqual(shape1: readonly number[], shape2: readonly number[]): boolean;
}
export declare class PoolConvUtil {
    /**
     * Adjust the kernel, strides, pads to correct rank. Set to default value if not present
     * @param isGlobalOperator If true, perform global pooling.
     * @param inputDims The input tensor dimension.
     * @param kernelShape The size of the kernel along each axis.
     * @param strides Stride along each axis.
     * @param dilations Dilation along each axis.
     * @param pads Padding for the beginning and ending along each axis.
     */
    static adjustPoolAttributes(isGlobalOperator: boolean, inputDims: readonly number[], kernelShape: number[], strides: number[], dilations: number[], pads: number[]): void;
    static adjustPadsBasedOnAutoPad(inputDims: readonly number[], strides: readonly number[], dilations: readonly number[], kernelShape: readonly number[], pads: number[], isChannelLast: boolean, autoPad?: string): void;
    /**
     * Calculate the output shape for Pool ops based on input attributes. (Should be used only for Pool ops)
     * @param isGlobalOperator If true, perform global pooling.
     * @param inputDims The input tensor dimension. (inputs[0].dims)
     * @param strides Stride along each axis.
     * @param dilations Dilation along each axis.
     * @param kernelShape The size of the kernel along each axis.
     * @param pads Padding for the beginning and ending along each axis.
     * @param autoPad DEPRECATED attribute supported for legacy models. Specifies how to implicitly calculate pads in each
     *     dimension. Can take values NOTSET, SAME_UPPER, SAME_LOWER, or VALID.
     */
    static computePoolOutputShape(isGlobalOperator: boolean, inputDims: readonly number[], strides: number[], dilations: number[], kernelShape: number[], pads: number[], autoPad?: string): number[];
    /**
     * Calculate the output shape for Conv op based on input attributes. (Should be used only for Conv op)
     * @param inputDims The input tensor dimension. (inputs[0].dims)
     * @param filterDims The filter tensor dimension. (inputs[1].dims)
     * @param strides Stride along each axis.
     * @param kernelShape The size of the kernel along each axis.
     * @param pads Padding for the beginning and ending along each axis.
     * @param autoPad DEPRECATED attribute supported for legacy models. Specifies how to implicitly calculate pads in each
     *     dimension. Can take values NOTSET, SAME_UPPER, SAME_LOWER, or VALID.
     */
    static computeConvOutputShape(inputDims: readonly number[], filterDims: readonly number[], strides: number[], dilations: number[], kernelShape: number[], pads: number[], autoPad?: string): number[];
    private static computeShapeHelper;
    private static adjustPadAndReturnShape;
}
export declare class GemmUtil {
    static getShapeOfGemmResult(leftShape: readonly number[], transLeft: boolean, rightShape: readonly number[], transRight: boolean, biasShape?: readonly number[]): readonly number[];
}
export declare const MIN_CLIP = -3.4028234663852886e+38;
export declare const MAX_CLIP = 3.4028234663852886e+38;
