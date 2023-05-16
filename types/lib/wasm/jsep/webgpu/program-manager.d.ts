import { WebGpuBackend } from '../backend-webgpu';
import { Artifact, GpuData, ProgramInfo } from './types';
/**
 * ProgramManager is the main class behind running computations
 * It builds ProgramInfo's into Artifacts
 * It compiles given ProgramInfo's into WebGL Prorams (cached as Artifacts)
 * Uses the artifact to run the computation by calling Draw on
 * the WebGL drawing buffer
 * ProgramManager automatically maps (binds) input variables to their
 * corresponding Location's in the binary program
 */
export declare class ProgramManager {
    private backend;
    repo: Map<unknown, Artifact>;
    attributesBound: boolean;
    constructor(backend: WebGpuBackend);
    getArtifact(key: unknown): Artifact | undefined;
    setArtifact(key: unknown, artifact: Artifact): void;
    run(buildArtifact: Artifact, inputs: GpuData[], outputs: GpuData[], dispatchGroup: [number, number, number]): void;
    dispose(): void;
    build(programInfo: ProgramInfo, normalizedDispatchGroupSize: [number, number, number]): Artifact;
    normalizeDispatchGroupSize(dispatchGroup: ReturnType<ProgramInfo['dispatchGroup']>): [number, number, number];
}
