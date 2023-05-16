/**
 * constant value for a workgroup size.
 *
 * We definitely can do further optimization in future, but for now we use 64.
 *
 * rule of thumb: Use [a workgroup size of] 64 unless you know what GPU you are targeting or that your workload
 *                needs something different.
 *
 * from: https://surma.dev/things/webgpu/
 **/
export declare const WORKGROUP_SIZE = 64;
export interface IndicesHelper {
    /**
     * WGSL code of function implementation for offset-to-indices
     */
    o2iImpl: string;
    /**
     * WGSL code of function call for offset-to-indices
     */
    o2iCall: (varOffset: string, varIndices: string) => string;
    /**
     * WGSL code of function implementation for indices-to-offset
     */
    i2oImpl: string;
    /**
     * WGSL code of function implementation for indices-to-offset
     *
     * @param isPtr - whether the variable is a pointer. default is false.
     */
    i2oExpression: (varIndices: string, isPtr?: boolean) => string;
    /**
     * WGSL code of indices variable declaration
     *
     * @param v - variable name.
     * @param init - initial value.
     */
    indicesVariableDeclaration: (v: string, init?: string[]) => string;
    /**
     * data type of indices
     */
    iType: string;
}
export declare const createIndicesHelper: (name: string, shape: readonly number[]) => IndicesHelper;
/**
 * A ShaderHelper is a helper class for generating WGSL code.
 */
export interface ShaderHelper {
    mainStart(workgroupSize?: number | [number, number, number]): string;
    guardAgainstOutOfBoundsWorkgroupSizes(size: unknown): string;
}
export declare const createShaderHelper: (dispatchGroup: [number, number, number]) => ShaderHelper;
