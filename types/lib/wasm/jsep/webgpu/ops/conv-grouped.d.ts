import { TensorView } from '../../tensor';
import { ProgramInfoLoader } from '../types';
import { ConvAttributes } from './conv';
/**
 * naive grouped conv implementation, supports 1d/2d conv
 * @param squeezeOutputShapeFunction - an optional function to squeeze the output shape, only used in conv1d
 */
export declare const createGroupedConvProgramInfoLoader: (inputs: readonly TensorView[], attributes: ConvAttributes, squeezeOutputShapeFunction?: ((shape: readonly number[]) => number[]) | undefined) => ProgramInfoLoader;
