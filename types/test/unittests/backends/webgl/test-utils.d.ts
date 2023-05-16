import { WebGLContext } from '../../../../lib/onnxjs/backends/webgl/webgl-context';
export declare function createAscendingArray(size: number): Float32Array;
export declare function generateArrayForUnpackedTexture(input: Float32Array): Float32Array;
export declare function createTextureFromArray(glContext: WebGLContext, dataArray: Float32Array, type: GLenum, width: number, height: number): WebGLTexture;
export declare function createArrayFromTexture(gl: WebGLRenderingContext, texture: WebGLTexture, width: number, height: number): Float32Array;
export declare function getExpectedElementCount(inputShape: number[], isPacked?: boolean): number;
export declare function generateExpected(inputArray: Float32Array, inputShape: number[]): Float32Array;
