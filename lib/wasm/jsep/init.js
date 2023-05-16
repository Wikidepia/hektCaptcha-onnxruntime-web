"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const wasm_common_1 = require("../wasm-common");
const backend_webgpu_1 = require("./backend-webgpu");
const log_1 = require("./log");
const util_1 = require("./util");
/* eslint-disable no-bitwise */
class TensorViewImpl {
    constructor(module, dataType, data, dims) {
        this.module = module;
        this.dataType = dataType;
        this.data = data;
        this.dims = dims;
    }
    getFloat32Array() {
        return new Float32Array(this.module.HEAP8.buffer, this.data, util_1.ShapeUtil.size(this.dims));
    }
    reshape(newDims) {
        if (util_1.ShapeUtil.size(newDims) !== util_1.ShapeUtil.size(this.dims)) {
            throw new Error('Invalid new shape');
        }
        return new TensorViewImpl(this.module, this.dataType, this.data, newDims);
    }
}
class ComputeContextImpl {
    get customData() {
        return this.backend.currentKernelCustomData;
    }
    constructor(module, backend, contextDataOffset) {
        this.module = module;
        this.backend = backend;
        const heapU32 = module.HEAPU32;
        // extract context data
        let dataIndex = (contextDataOffset >> 2);
        this.opKernelContext = heapU32[dataIndex++];
        const inputCount = heapU32[dataIndex++];
        const inputs = [];
        for (let i = 0; i < inputCount; i++) {
            const dataType = heapU32[dataIndex++];
            const data = heapU32[dataIndex++];
            const dim = heapU32[dataIndex++];
            const dims = [];
            for (let d = 0; d < dim; d++) {
                dims.push(heapU32[dataIndex++]);
            }
            inputs.push(new TensorViewImpl(module, dataType, data, dims));
        }
        this.inputs = inputs;
    }
    compute(program, inputsOutputsMapping) {
        // prepare inputs. inputs should always be valid data.
        const mappedInputs = inputsOutputsMapping?.inputs?.map(i => typeof i === 'number' ? this.inputs[i] : i) ?? this.inputs;
        // prepare outputs.
        const outputIndices = inputsOutputsMapping?.outputs ?? [];
        const createKernelOutput = (index, dataType, dims) => new TensorViewImpl(this.module, dataType, this.output(index, dims), dims);
        const createTemporaryOutput = (dataType, dims) => {
            const elementSize = (0, wasm_common_1.getTensorElementSize)(dataType);
            if (!elementSize) {
                throw new Error(`Unsupported data type: ${dataType}`);
            }
            const bufferSize = elementSize * util_1.ShapeUtil.size(dims);
            return new TensorViewImpl(this.module, dataType, this.backend.gpuDataManager.create(bufferSize).id, dims);
        };
        return this.backend.run(program, mappedInputs, outputIndices, createKernelOutput, createTemporaryOutput);
    }
    output(index, dims) {
        const stack = this.module.stackSave();
        try {
            const data = this.module.stackAlloc((1 + dims.length) * 4 /* sizeof(size_t) */);
            let offset = data >> 2;
            this.module.HEAPU32[offset++] = dims.length;
            for (let i = 0; i < dims.length; i++) {
                this.module.HEAPU32[offset++] = dims[i];
            }
            return this.module._JsepOutput(this.opKernelContext, index, data);
        }
        finally {
            this.module.stackRestore(stack);
        }
    }
}
const init = async (module) => {
    const init = module.jsepInit;
    if (init && navigator.gpu) {
        const backend = new backend_webgpu_1.WebGpuBackend();
        await backend.initialize();
        init(
        // backend
        { backend }, 
        // jsepAlloc()
        (size) => backend.alloc(size), 
        // jsepFree()
        (ptr) => backend.free(ptr), 
        // jsepCopy(src, dst, size, isSourceGpu)
        (src, dst, size, isSourceGpu = false) => {
            if (isSourceGpu) {
                (0, log_1.LOG_DEBUG)('verbose', () => `[WebGPU] jsepCopyGpuToGpu: src=${src}, dst=${dst}, size=${size}`);
                backend.memcpy(src, dst);
            }
            else {
                (0, log_1.LOG_DEBUG)('verbose', () => `[WebGPU] jsepCopyCpuToGpu: dataOffset=${src}, gpuDataId=${dst}, size=${size}`);
                const data = module.HEAPU8.subarray(src, src + size);
                backend.upload(dst, data);
            }
        }, 
        // jsepCopyAsync(src, dst, size)
        async (gpuDataId, dataOffset, size) => {
            (0, log_1.LOG_DEBUG)('verbose', () => `[WebGPU] jsepCopyGpuToCpu: gpuDataId=${gpuDataId}, dataOffset=${dataOffset}, size=${size}`);
            await backend.download(gpuDataId, () => module.HEAPU8.subarray(dataOffset, dataOffset + size));
        }, 
        // jsepCreateKernel
        (name, kernel, attribute) => backend.createKernel(name, kernel, attribute), 
        // jsepReleaseKernel
        (kernel) => backend.releaseKernel(kernel), 
        // jsepRun
        (kernel, contextDataOffset) => {
            (0, log_1.LOG_DEBUG)('verbose', () => `[WebGPU] jsepRun: kernel=${kernel}, contextDataOffset=${contextDataOffset}`);
            const context = new ComputeContextImpl(module, backend, contextDataOffset);
            return backend.computeKernel(kernel, context);
        });
    }
};
exports.init = init;
//# sourceMappingURL=init.js.map