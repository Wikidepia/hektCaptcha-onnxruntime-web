import { Env, InferenceSession, Tensor } from 'onnxruntime-common';
import { Attribute } from '../lib/onnxjs/attribute';
import { Logger } from '../lib/onnxjs/instrument';
export declare namespace Test {
    interface NamedTensor extends Tensor {
        name: string;
    }
    /**
     * This interface represent a value of Attribute. Should only be used in testing.
     */
    interface AttributeValue {
        name: string;
        data: Attribute.DataTypeMap[Attribute.DataType];
        type: Attribute.DataType;
    }
    /**
     * This interface represent a value of Tensor. Should only be used in testing.
     */
    interface TensorValue {
        data: number[];
        dims: number[];
        type: Tensor.Type;
    }
    /**
     * Represent a string to describe the current environment.
     * Used in ModelTest and OperatorTest to determine whether to run the test or not.
     */
    type Condition = string;
    interface ModelTestCase {
        name: string;
        dataFiles: readonly string[];
        inputs?: NamedTensor[];
        outputs?: NamedTensor[];
    }
    interface ModelTest {
        name: string;
        modelUrl: string;
        backend?: string;
        condition?: Condition;
        cases: readonly ModelTestCase[];
    }
    interface ModelTestGroup {
        name: string;
        tests: readonly ModelTest[];
    }
    interface OperatorTestCase {
        name: string;
        inputs: readonly TensorValue[];
        outputs: readonly TensorValue[];
    }
    interface OperatorTestOpsetImport {
        domain: string;
        version: number;
    }
    interface OperatorTest {
        name: string;
        operator: string;
        opsets?: readonly OperatorTestOpsetImport[];
        backend?: string;
        condition?: Condition;
        attributes: readonly AttributeValue[];
        cases: readonly OperatorTestCase[];
    }
    interface OperatorTestGroup {
        name: string;
        tests: readonly OperatorTest[];
    }
    namespace TestList {
        type TestName = string;
        interface TestDescription {
            name: string;
            condition: Condition;
        }
        type Test = TestName | TestDescription;
    }
    /**
     * The data schema of a testlist file.
     * A testlist should only be applied when running suite test cases (suite0)
     */
    interface TestList {
        [backend: string]: {
            [group: string]: readonly TestList.Test[];
        };
    }
    /**
     * Represent ONNX Runtime Web global options
     */
    interface Options {
        debug?: boolean;
        sessionOptions?: InferenceSession.SessionOptions;
        cpuOptions?: InferenceSession.CpuExecutionProviderOption;
        cpuFlags?: Record<string, unknown>;
        cudaOptions?: InferenceSession.CudaExecutionProviderOption;
        cudaFlags?: Record<string, unknown>;
        wasmOptions?: InferenceSession.WebAssemblyExecutionProviderOption;
        webglOptions?: InferenceSession.WebGLExecutionProviderOption;
        globalEnvFlags?: Env;
    }
    /**
     * Represent a file cache map that preload the files in prepare stage.
     * The key is the file path and the value is the file content in BASE64.
     */
    interface FileCache {
        [filePath: string]: string;
    }
    /**
     * The data schema of a test config.
     */
    interface Config {
        unittest: boolean;
        op: readonly OperatorTestGroup[];
        model: readonly ModelTestGroup[];
        fileCacheUrls?: readonly string[];
        log: ReadonlyArray<{
            category: string;
            config: Logger.Config;
        }>;
        profile: boolean;
        options: Options;
    }
}
