import { WebGpuBackend } from '../backend-webgpu';
import { GpuData, GpuDataId } from './types';
/**
 * manages GpuDataId -> GpuBuffer
 */
export interface GpuDataManager {
    /**
     * copy data from CPU to GPU.
     */
    upload(id: GpuDataId, data: Uint8Array): void;
    /**
     * copy data from GPU to GPU.
     */
    memcpy(sourceId: GpuDataId, destinationId: GpuDataId): void;
    /**
     * create new data on GPU.
     */
    create(size: number, usage?: number): GpuData;
    /**
     * get GPU data by ID.
     */
    get(id: GpuDataId): GpuData | undefined;
    /**
     * release the data on GPU by ID.
     *
     * @return size of the data released
     */
    release(id: GpuDataId): number;
    /**
     * copy data from GPU to CPU.
     */
    download(id: GpuDataId): Promise<ArrayBufferLike>;
    /**
     * refresh the buffers that marked for release.
     *
     * when release() is called, the buffer is not released immediately. this is because we need to wait for the commands
     * to be submitted to the GPU. this function is called after the commands are submitted so that the buffers can be
     * actually released.
     */
    refreshPendingBuffers(): void;
}
export declare const createGpuDataManager: (backend: WebGpuBackend) => GpuDataManager;
