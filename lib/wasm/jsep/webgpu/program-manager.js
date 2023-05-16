"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramManager = void 0;
const log_1 = require("../log");
const common_1 = require("./ops/common");
/**
 * ProgramManager is the main class behind running computations
 * It builds ProgramInfo's into Artifacts
 * It compiles given ProgramInfo's into WebGL Prorams (cached as Artifacts)
 * Uses the artifact to run the computation by calling Draw on
 * the WebGL drawing buffer
 * ProgramManager automatically maps (binds) input variables to their
 * corresponding Location's in the binary program
 */
class ProgramManager {
    constructor(backend) {
        this.backend = backend;
        this.repo = new Map();
        this.attributesBound = false;
    }
    getArtifact(key) {
        return this.repo.get(key);
    }
    setArtifact(key, artifact) {
        this.repo.set(key, artifact);
    }
    run(buildArtifact, inputs, outputs, dispatchGroup) {
        const device = this.backend.device;
        const computePassEncoder = this.backend.getComputePassEncoder();
        if (this.backend.profilingEnabled) {
            // profiling write start timestamp
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            computePassEncoder.writeTimestamp(this.backend.profilingQuerySet, 0);
        }
        computePassEncoder.setPipeline(buildArtifact.computePipeline);
        const entries = [];
        for (const input of inputs) {
            entries.push({ binding: entries.length, resource: { buffer: input.buffer } });
        }
        for (const output of outputs) {
            entries.push({ binding: entries.length, resource: { buffer: output.buffer } });
        }
        const bindGroup = device.createBindGroup({ layout: buildArtifact.computePipeline.getBindGroupLayout(0), entries });
        computePassEncoder.setBindGroup(0, bindGroup);
        computePassEncoder.dispatchWorkgroups(...dispatchGroup);
        this.backend.pendingDispatchNumber++;
        if (this.backend.profilingEnabled) {
            // profiling write end timestamp
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            computePassEncoder.writeTimestamp(this.backend.profilingQuerySet, 1);
            // eslint-disable-next-line no-bitwise
            const queryData = this.backend.gpuDataManager.create(16, GPUBufferUsage.COPY_SRC | GPUBufferUsage.QUERY_RESOLVE);
            // eslint-disable-next-line no-bitwise
            const syncData = this.backend.gpuDataManager.create(16, GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST);
            this.backend.endComputePass();
            this.backend.getCommandEncoder().resolveQuerySet(this.backend.profilingQuerySet, 0, 2, queryData.buffer, 0);
            this.backend.getCommandEncoder().copyBufferToBuffer(queryData.buffer, 0, syncData.buffer, 0, 16);
            this.backend.flush();
            const kernelId = this.backend.currentKernelId;
            const kernelName = this.backend.kernels.get(kernelId)[0];
            syncData.buffer.mapAsync(GPUMapMode.READ).then(() => {
                const mappedData = new BigUint64Array(syncData.buffer.getMappedRange());
                const startTimeU64 = mappedData[0];
                const endTimeU64 = mappedData[1];
                syncData.buffer.unmap();
                if (typeof this.backend.profilingTimeBase === 'undefined') {
                    this.backend.profilingTimeBase = startTimeU64;
                }
                const startTime = Number(startTimeU64 - this.backend.profilingTimeBase);
                const endTime = Number(endTimeU64 - this.backend.profilingTimeBase);
                if (!Number.isSafeInteger(startTime) || !Number.isSafeInteger(endTime)) {
                    throw new RangeError('incorrect timestamp range');
                }
                this.backend.gpuDataManager.release(queryData.id);
                this.backend.gpuDataManager.release(syncData.id);
                // eslint-disable-next-line no-console
                console.log(`[profiling] kernel "${kernelId}|${kernelName}" execution time: ${endTime - startTime} ns`);
            });
        }
        if (this.backend.pendingDispatchNumber >= 16) {
            this.backend.flush();
        }
    }
    dispose() {
        // this.repo.forEach(a => this.glContext.deleteProgram(a.program));
    }
    build(programInfo, normalizedDispatchGroupSize) {
        const device = this.backend.device;
        const code = programInfo.getShaderSource((0, common_1.createShaderHelper)(normalizedDispatchGroupSize));
        const shaderModule = device.createShaderModule({ code });
        (0, log_1.LOG_DEBUG)('verbose', () => `[WebGPU] shader code: ${code}`);
        const computePipeline = device.createComputePipeline({ compute: { module: shaderModule, entryPoint: 'main' }, layout: 'auto' });
        return { programInfo, computePipeline };
    }
    normalizeDispatchGroupSize(dispatchGroup) {
        const x = typeof dispatchGroup === 'number' ? dispatchGroup : dispatchGroup.x;
        const y = typeof dispatchGroup === 'number' ? 1 : (dispatchGroup.y || 1);
        const z = typeof dispatchGroup === 'number' ? 1 : (dispatchGroup.z || 1);
        const limitPerDimension = this.backend.device.limits.maxComputeWorkgroupsPerDimension;
        if (x <= limitPerDimension && y <= limitPerDimension && z <= limitPerDimension) {
            return [x, y, z];
        }
        const size = x * y * z;
        let dispatchAverage = Math.ceil(Math.sqrt(size));
        if (dispatchAverage > limitPerDimension) {
            dispatchAverage = Math.ceil(Math.cbrt(size));
            if (dispatchAverage > limitPerDimension) {
                throw new Error('Total dispatch size exceeds WebGPU maximum.');
            }
            return [dispatchAverage, dispatchAverage, dispatchAverage];
        }
        else {
            return [dispatchAverage, dispatchAverage, 1];
        }
    }
}
exports.ProgramManager = ProgramManager;
//# sourceMappingURL=program-manager.js.map