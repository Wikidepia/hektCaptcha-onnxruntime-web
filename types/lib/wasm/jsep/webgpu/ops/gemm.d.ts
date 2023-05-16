import { AttributeWithCacheKey } from '../attribute-with-cache-key';
import { ComputeContext } from '../types';
export interface GemmAttributes extends AttributeWithCacheKey {
    transA: boolean;
    transB: boolean;
    alpha: number;
    beta: number;
}
export declare const gemm: (context: ComputeContext, attributes: GemmAttributes) => void;
export declare const parseGemmAttributes: (attributes: Record<string, unknown>) => GemmAttributes;
