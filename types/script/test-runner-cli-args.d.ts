import { Env, InferenceSession } from 'onnxruntime-common';
import { Test } from '../test/test-types';
export declare namespace TestRunnerCliArgs {
    type Mode = 'suite0' | 'suite1' | 'model' | 'unittest' | 'op';
    type Backend = 'cpu' | 'webgl' | 'webgpu' | 'wasm' | 'onnxruntime' | 'xnnpack';
    type Environment = 'chrome' | 'edge' | 'firefox' | 'electron' | 'safari' | 'node' | 'bs';
    type BundleMode = 'prod' | 'dev' | 'perf';
}
export interface TestRunnerCliArgs {
    debug: boolean;
    mode: TestRunnerCliArgs.Mode;
    /**
     * The parameter that used when in mode 'model' or 'op', specifying the search string for the model or op test
     */
    param?: string;
    backends: [TestRunnerCliArgs.Backend];
    env: TestRunnerCliArgs.Environment;
    /**
     * Bundle Mode
     *
     * this field affects the behavior of Karma and Webpack.
     *
     * For Karma, if flag '--bundle-mode' is not set, the default behavior is 'dev'
     * For Webpack, if flag '--bundle-mode' is not set, the default behavior is 'prod'
     *
     * For running tests, the default mode is 'dev'. If flag '--perf' is set, the mode will be set to 'perf'.
     *
     * Mode   | Output File           | Main                 | Source Map         | Webpack Config
     * ------ | --------------------- | -------------------- | ------------------ | --------------
     * prod   | /dist/ort.min.js      | /lib/index.ts        | source-map         | production
     * node   | /dist/ort-web.node.js | /lib/index.ts        | source-map         | production
     * dev    | /test/ort.dev.js      | /test/test-main.ts   | inline-source-map  | development
     * perf   | /test/ort.perf.js     | /test/test-main.ts   | (none)             | production
     */
    bundleMode: TestRunnerCliArgs.BundleMode;
    logConfig: Test.Config['log'];
    /**
     * Whether to enable InferenceSession's profiler
     */
    profile: boolean;
    /**
     * Whether to enable file cache
     */
    fileCache: boolean;
    /**
     * Specify the times that test cases to run
     */
    times?: number;
    /**
     * whether to dump the optimized model
     */
    optimizedModelFilePath?: string;
    /**
     * Specify graph optimization level
     */
    graphOptimizationLevel: 'disabled' | 'basic' | 'extended' | 'all';
    cpuOptions?: InferenceSession.CpuExecutionProviderOption;
    cudaOptions?: InferenceSession.CudaExecutionProviderOption;
    cudaFlags?: Record<string, unknown>;
    wasmOptions?: InferenceSession.WebAssemblyExecutionProviderOption;
    webglOptions?: InferenceSession.WebGLExecutionProviderOption;
    globalEnvFlags?: Env;
    noSandbox?: boolean;
}
export declare function parseTestRunnerCliArgs(cmdlineArgs: string[]): TestRunnerCliArgs;
