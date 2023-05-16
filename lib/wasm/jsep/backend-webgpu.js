"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebGpuBackend = void 0;
const onnxruntime_common_1 = require("onnxruntime-common");
const log_1 = require("./log");
const gpu_data_manager_1 = require("./webgpu/gpu-data-manager");
const op_resolve_rules_1 = require("./webgpu/op-resolve-rules");
const program_manager_1 = require("./webgpu/program-manager");
/**
 * get a unique key representing the program from the program info,input shapes and types.
 *
 * @returns a unique key is a shorter string than the shader source, which contains all the information to identify a
 * program. if the key is the same, the program shader source should be the same, so we can reuse the program.
 *
 */
const getProgramInfoUniqueKey = (programInfo, inputTensorShapes, inputGpuDataTypes) => {
    const inputTensorShapesToString = inputTensorShapes.map(d => `${d.join(',')}`).join('_');
    const inputGpuDataTypesToString = inputGpuDataTypes.join('_');
    let key = programInfo.name;
    if (programInfo.cacheHint) {
        key += '[' + programInfo.cacheHint + ']';
    }
    key += ':' + inputTensorShapesToString + ';' + inputGpuDataTypesToString;
    return key;
};
/**
 * this class is designed to store status and being used as a singleton for JSEP. It will be passed to jsepInit() as
 * the first parameter so that it is stored for future use.
 */
class WebGpuBackend {
    constructor() {
        /**
         * representing the kernel ID of which is currently being computed (CPU code perspective).
         * `null` means no kernel is being computed.
         * only one kernel can be computed at a moment.
         */
        this.currentKernelId = null;
        this.commandEncoder = null;
        this.computePassEncoder = null;
        this.pendingDispatchNumber = 0;
        this.profilingEnabled = false;
    }
    /**
     * get the custom data of the current kernel
     */
    get currentKernelCustomData() {
        if (this.currentKernelId === null) {
            throw new Error('currentKernelCustomData(): currentKernelId is null. (should not happen)');
        }
        let data = this.kernelCustomData.get(this.currentKernelId);
        if (!data) {
            data = {};
            this.kernelCustomData.set(this.currentKernelId, data);
        }
        return data;
    }
    async initialize() {
        if (!navigator.gpu) {
            // WebGPU is not available.
            throw new Error('WebGpuBackend: WebGPU is not available.');
        }
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            throw new Error('WebGpuBackend: Failed to get GPU adapter.');
        }
        const deviceDescriptor = {
            requiredLimits: {
                maxComputeWorkgroupStorageSize: adapter.limits.maxComputeWorkgroupStorageSize,
                maxComputeWorkgroupsPerDimension: adapter.limits.maxComputeWorkgroupsPerDimension,
                maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
            }
        };
        // WebGPU Spec: Timestamp Queries Inside Passes
        // https://github.com/gpuweb/gpuweb/blob/main/proposals/timestamp-query-inside-passes.md
        if (adapter.features.has('timestamp-query-inside-passes') && onnxruntime_common_1.env.webgpu.profilingMode === 'default') {
            this.profilingEnabled = true;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            deviceDescriptor.requiredFeatures = ['timestamp-query-inside-passes'];
        }
        this.device = await adapter.requestDevice(deviceDescriptor);
        this.gpuDataManager = (0, gpu_data_manager_1.createGpuDataManager)(this);
        this.programManager = new program_manager_1.ProgramManager(this);
        this.kernels = new Map();
        this.kernelPersistentData = new Map();
        this.kernelCustomData = new Map();
        // TODO: set up flags
        this.device.onuncapturederror = ev => {
            if (ev.error instanceof GPUValidationError) {
                // eslint-disable-next-line no-console
                console.error(`An uncaught WebGPU validation error was raised: ${ev.error.message}`);
            }
        };
        if (this.profilingEnabled) {
            this.profilingQuerySet = this.device.createQuerySet({
                type: 'timestamp',
                count: 2,
            });
        }
    }
    dispose() {
        // currently, we do not do anything in this function. In all known use cases, we don't have the requirement to
        // actually dispose the WebGpuBackend instance, because it's always used as a singleton.
        //
        // revisit this place if we get real requirement to dispose the instance.
    }
    getCommandEncoder() {
        if (!this.commandEncoder) {
            this.commandEncoder = this.device.createCommandEncoder();
        }
        return this.commandEncoder;
    }
    getComputePassEncoder() {
        if (!this.computePassEncoder) {
            this.computePassEncoder = this.getCommandEncoder().beginComputePass();
        }
        return this.computePassEncoder;
    }
    endComputePass() {
        if (this.computePassEncoder) {
            this.computePassEncoder.end();
            this.computePassEncoder = null;
        }
    }
    flush() {
        this.endComputePass();
        this.device.queue.submit([this.getCommandEncoder().finish()]);
        this.gpuDataManager.refreshPendingBuffers();
        this.commandEncoder = null;
        this.pendingDispatchNumber = 0;
    }
    /**
     * run a WebGPU program.
     * @param program either a ProgramInfo instance containing metadata including the shader code, or a function that
     * can be called and return a ProgramInfo instance
     * @param inputs a TensorView array. each element represents a value already exists in GPU.
     * @param outputIndices an indices array. each element can be either -1 (temporary data), -2 (persistent data) or an
     * index to the kernel's output.
     * @param createKernelOutput a callback function that create a value to kernel's output with the given index
     * @param createIntermediateOutput a callback function that create a value as a intermediate value, either temporary
     * or persistent (owned by the current kernel)
     * @returns a TensorView array representing the result.
     */
    run(program, inputs, outputIndices, createKernelOutput, createIntermediateOutput) {
        if (inputs.length !== program.inputTypes.length) {
            throw new Error(`Input size must be equal to ${program.inputTypes.length}.`);
        }
        // create info for inputs
        const inputDatas = [];
        for (let i = 0; i < inputs.length; ++i) {
            const gpuData = this.gpuDataManager.get(inputs[i].data);
            if (!gpuData) {
                throw new Error(`no GPU data for input: ${inputs[i].data}`);
            }
            inputDatas[i] = gpuData;
        }
        const key = getProgramInfoUniqueKey(program, inputs.map(i => i.dims), inputDatas.map(i => i.type));
        let artifact = this.programManager.getArtifact(key);
        const programInfo = artifact ?
            artifact.programInfo :
            (typeof program.get === 'function' ? program.get() :
                program);
        // check output indices
        const validatedOutputIndices = outputIndices.length === 0 ? programInfo.outputs.map((_, i) => i) : outputIndices;
        if (validatedOutputIndices.length !== programInfo.outputs.length) {
            throw new Error(`Output size ${validatedOutputIndices.length} must be equal to ${programInfo.outputs.length}.`);
        }
        // create info for outputs
        const outputTensorViews = [];
        const outputDatas = [];
        for (let i = 0; i < programInfo.outputs.length; ++i) {
            // value -1 and -2 are used for creating temporary and persistent outputs. so -2, -1 and 0, 1, 2, ... are valid
            // output indices. see type definition of ComputeContextInputsOutputsMapping for more details.
            if (!Number.isInteger(validatedOutputIndices[i]) || validatedOutputIndices[i] < -2 ||
                validatedOutputIndices[i] >= programInfo.outputs.length) {
                throw new Error(`Invalid output index: ${validatedOutputIndices[i]}`);
            }
            const isTemporary = validatedOutputIndices[i] === -1;
            const isPersistent = validatedOutputIndices[i] === -2;
            const tensorView = (isTemporary || isPersistent) ?
                createIntermediateOutput(programInfo.outputs[i].dataType, programInfo.outputs[i].dims) :
                createKernelOutput(validatedOutputIndices[i], programInfo.outputs[i].dataType, programInfo.outputs[i].dims);
            const gpuData = this.gpuDataManager.get(tensorView.data);
            if (!gpuData) {
                throw new Error(`no GPU data for output: ${tensorView.data}`);
            }
            if (isTemporary) {
                this.temporaryData.push(gpuData);
            }
            if (isPersistent) {
                let persistentData = this.kernelPersistentData.get(this.currentKernelId);
                if (!persistentData) {
                    persistentData = [];
                    this.kernelPersistentData.set(this.currentKernelId, persistentData);
                }
                persistentData.push(gpuData);
            }
            outputTensorViews.push(tensorView);
            outputDatas.push(gpuData);
        }
        const normalizedDispatchGroup = this.programManager.normalizeDispatchGroupSize(programInfo.dispatchGroup(inputs));
        if (!artifact) {
            artifact = this.programManager.build(programInfo, normalizedDispatchGroup);
            this.programManager.setArtifact(key, artifact);
        }
        (0, log_1.LOG_DEBUG)('info', () => `[ProgramManager] run "${programInfo.name}" (key=${key}) with ${normalizedDispatchGroup[0]}x${normalizedDispatchGroup[1]}x${normalizedDispatchGroup[2]}`);
        this.programManager.run(artifact, inputDatas, outputDatas, normalizedDispatchGroup);
        return outputTensorViews;
    }
    upload(gpuDataId, data) {
        this.gpuDataManager.upload(gpuDataId, data);
    }
    memcpy(src, dst) {
        this.gpuDataManager.memcpy(src, dst);
    }
    async download(gpuDataId, getTargetBuffer) {
        const arrayBuffer = await this.gpuDataManager.download(gpuDataId);
        // the underlying buffer may be changed after the async function is called. so we use a getter function to make sure
        // the buffer is up-to-date.
        const data = getTargetBuffer();
        data.set(new Uint8Array(arrayBuffer));
    }
    alloc(size) {
        return this.gpuDataManager.create(size).id;
    }
    free(ptr) {
        return this.gpuDataManager.release(ptr);
    }
    createKernel(name, kernelId, attribute) {
        const op = op_resolve_rules_1.WEBGPU_OP_RESOLVE_RULES.get(name);
        if (!op) {
            throw new Error(`kernel not implemented: ${name}`);
        }
        this.kernels.set(kernelId, [name, op[0], [op[1], attribute]]);
    }
    releaseKernel(kernelId) {
        const persistentData = this.kernelPersistentData.get(kernelId);
        if (persistentData) {
            for (const data of persistentData) {
                this.gpuDataManager.release(data.id);
            }
            this.kernelPersistentData.delete(kernelId);
        }
        this.kernelCustomData.delete(kernelId);
        this.kernels.delete(kernelId);
    }
    computeKernel(kernelId, context) {
        const kernel = this.kernels.get(kernelId);
        if (!kernel) {
            throw new Error(`kernel not created: ${kernelId}`);
        }
        const [name, kernelEntry, attributes] = kernel;
        if (this.currentKernelId !== null) {
            throw new Error(`kernel "${name}" is not allowed to be called recursively`);
        }
        this.currentKernelId = kernelId;
        // parse attributes if necessary
        if (attributes[0]) {
            attributes[1] = attributes[0](attributes[1]);
            attributes[0] = undefined;
        }
        (0, log_1.LOG_DEBUG)('info', () => `[WebGPU] Start to run kernel "${name}"...`);
        this.temporaryData = [];
        try {
            kernelEntry(context, attributes[1]);
            return 0; // ORT_OK
        }
        catch (e) {
            (0, log_1.LOG_DEBUG)('warning', `[WebGPU] Kernel "${name}" failed. Error: ${e}`);
            return 1; // ORT_FAIL
        }
        finally {
            for (const data of this.temporaryData) {
                this.gpuDataManager.release(data.id);
            }
            this.temporaryData = [];
            this.currentKernelId = null;
        }
    }
}
exports.WebGpuBackend = WebGpuBackend;
//# sourceMappingURL=backend-webgpu.js.map