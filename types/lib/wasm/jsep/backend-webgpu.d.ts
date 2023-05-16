/// <reference types="dist" />
import { TensorView } from './tensor';
import { GpuDataManager } from './webgpu/gpu-data-manager';
import { RunFunction } from './webgpu/op-resolve-rules';
import { ProgramManager } from './webgpu/program-manager';
import { ComputeContext, ProgramInfo, ProgramInfoLoader } from './webgpu/types';
/**
 * this class is designed to store status and being used as a singleton for JSEP. It will be passed to jsepInit() as
 * the first parameter so that it is stored for future use.
 */
export declare class WebGpuBackend {
    device: GPUDevice;
    /**
     * an instance of GpuDataManager to manage a GpuDataId -> GpuBuffer mapping
     */
    gpuDataManager: GpuDataManager;
    /**
     * an instance of ProgramManager to build and run WebGPU compute shader program, and manage a ProgramKey -> Program
     * artifacts mapping
     */
    programManager: ProgramManager;
    /**
     * representing the kernel ID of which is currently being computed (CPU code perspective).
     * `null` means no kernel is being computed.
     * only one kernel can be computed at a moment.
     */
    currentKernelId: number | null;
    /**
     * a list of temporary GPU data for the current kernel. should release when the kernel done computation.
     */
    private temporaryData;
    /**
     * a KernelID -> a GPU data list, which stores persistent GPU data owned by the specific kernel.
     */
    private kernelPersistentData;
    /**
     * a KernelID -> a custom data, which stores custom data owned by the specific kernel.
     */
    private kernelCustomData;
    /**
     * get the custom data of the current kernel
     */
    get currentKernelCustomData(): {
        [key: string]: unknown;
    };
    /**
     * a KernelID -> kernel info mapping. value is [ name, run function, [optional] preprocess_attribute_once function ]
     */
    kernels: Map<number, [string, RunFunction, [((attribute: unknown) => unknown) | undefined, unknown]]>;
    commandEncoder: GPUCommandEncoder | null;
    computePassEncoder: GPUComputePassEncoder | null;
    pendingDispatchNumber: number;
    profilingEnabled: boolean;
    profilingQuerySet: GPUQuerySet;
    profilingTimeBase?: bigint;
    initialize(): Promise<void>;
    dispose(): void;
    getCommandEncoder(): GPUCommandEncoder;
    getComputePassEncoder(): GPUComputePassEncoder;
    endComputePass(): void;
    flush(): void;
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
    run(program: ProgramInfoLoader | ProgramInfo, inputs: readonly TensorView[], outputIndices: readonly number[], createKernelOutput: (index: number, dataType: number, dims: readonly number[]) => TensorView, createIntermediateOutput: (dataType: number, dims: readonly number[]) => TensorView): TensorView[];
    upload(gpuDataId: number, data: Uint8Array): void;
    memcpy(src: number, dst: number): void;
    download(gpuDataId: number, getTargetBuffer: () => Uint8Array): Promise<void>;
    alloc(size: number): number;
    free(ptr: number): number;
    createKernel(name: string, kernelId: number, attribute: unknown): void;
    releaseKernel(kernelId: number): void;
    computeKernel(kernelId: number, context: ComputeContext): number;
}
