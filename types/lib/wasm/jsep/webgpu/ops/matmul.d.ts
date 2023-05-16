import { TensorView } from '../../tensor';
import { ComputeContext, ProgramInfoLoader } from '../types';
import { InternalActivationAttributes } from './fuse-utils';
export declare const createMatmulProgramInfoLoader: (inputs: readonly TensorView[], activationAttributes: InternalActivationAttributes) => ProgramInfoLoader;
export declare const matMul: (context: ComputeContext) => void;
