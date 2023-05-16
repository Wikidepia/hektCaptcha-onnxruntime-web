import { TensorView } from '../../tensor';
import { AttributeWithCacheKey } from '../attribute-with-cache-key';
import { ComputeContext, GpuDataType, ProgramInfo } from '../types';
export interface TransposeAttributes extends AttributeWithCacheKey {
    readonly perm: number[];
}
export declare const transposeProgramMetadata: {
    name: string;
    inputTypes: GpuDataType[];
};
export declare const createTransposeProgramInfo: (input: TensorView, permAttr: number[]) => ProgramInfo;
export declare const transpose: (context: ComputeContext, attributes: TransposeAttributes) => void;
export declare const parseTransposeAttributes: (attributes: Record<string, unknown>) => TransposeAttributes;
