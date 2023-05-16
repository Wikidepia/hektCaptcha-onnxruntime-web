import { Attribute } from '../lib/onnxjs/attribute';
import { Graph } from '../lib/onnxjs/graph';
export declare function base64toBuffer(data: string): Uint8Array;
export declare function bufferToBase64(buffer: Uint8Array): string;
export declare function readJsonFile(file: string): Promise<any>;
/**
 * create a single-node graph for unit test purpose
 */
export declare function createMockGraph(opType: string, attributes: Attribute): Graph;
