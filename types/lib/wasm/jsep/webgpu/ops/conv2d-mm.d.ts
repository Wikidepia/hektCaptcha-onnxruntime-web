import { TensorView } from '../../tensor';
import { ProgramInfoLoader } from '../types';
import { ConvAttributes } from './conv';
export declare const createConv2DMatMulProgramInfoLoader: (inputs: readonly TensorView[], attributes: ConvAttributes, outputShape: readonly number[], dimAOuter: number, dimBOuter: number, dimInner: number, hasBias: boolean, sequentialAccessByThreads: boolean) => ProgramInfoLoader;
