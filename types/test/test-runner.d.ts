import * as ort from 'onnxruntime-common';
import { InferenceHandler, SessionHandler } from '../lib/onnxjs/backend';
import { Profiler } from '../lib/onnxjs/instrument';
import { Operator } from '../lib/onnxjs/operators';
import { Tensor } from '../lib/onnxjs/tensor';
import { Test } from './test-types';
/**
 * a ModelTestContext object contains all states in a ModelTest
 */
export declare class ModelTestContext {
    readonly session: ort.InferenceSession;
    readonly backend: string;
    readonly perfData: ModelTestContext.ModelTestPerfData;
    private readonly profile;
    private constructor();
    /**
     * dump the current performance data
     */
    private logPerfData;
    release(): void;
    /**
     * create a ModelTestContext object that used in every test cases in the given ModelTest.
     */
    static create(modelTest: Test.ModelTest, profile: boolean, sessionOptions?: ort.InferenceSession.SessionOptions): Promise<ModelTestContext>;
    /**
     * set the global file cache for looking up model and tensor protobuf files.
     */
    static setCache(cache: Test.FileCache): void;
    private static initializing;
    private static cache;
}
export declare namespace ModelTestContext {
    interface ModelTestPerfData {
        init: number;
        firstRun: number;
        runs: number[];
        count: number;
    }
}
export declare class TensorResultValidator {
    private readonly absoluteThreshold;
    private readonly relativeThreshold;
    private readonly maxFloatValue;
    private static isHalfFloat;
    constructor(backend: string);
    checkTensorResult(actual: Tensor[], expected: Tensor[]): void;
    checkApiTensorResult(actual: ort.Tensor[], expected: ort.Tensor[]): void;
    checkNamedTensorResult(actual: Record<string, ort.Tensor>, expected: Test.NamedTensor[]): void;
    areEqual(actual: Tensor, expected: Tensor): boolean;
    strictEqual<T>(actual: T, expected: T): boolean;
    floatEqual(actual: number[] | Float32Array | Float64Array, expected: number[] | Float32Array | Float64Array): boolean;
    integerEqual(actual: number[] | Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array, expected: number[] | Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array): boolean;
}
/**
 * run a single model test case. the inputs/outputs tensors should already been prepared.
 */
export declare function runModelTestSet(context: ModelTestContext, testCase: Test.ModelTestCase, testName: string): Promise<void>;
/**
 * a OpTestContext object contains all states in a OpTest
 */
export declare class OpTestContext {
    protected opTest: Test.OperatorTest;
    static profiler: Profiler;
    readonly backendHint: string;
    sessionHandler: SessionHandler;
    inferenceHandler: InferenceHandler;
    constructor(opTest: Test.OperatorTest);
    createOperator(): Operator;
    dispose(): void;
    init(): Promise<void>;
}
/**
 * run a single operator test case.
 */
export declare function runOpTest(testcase: Test.OperatorTestCase, context: OpTestContext): Promise<void>;
