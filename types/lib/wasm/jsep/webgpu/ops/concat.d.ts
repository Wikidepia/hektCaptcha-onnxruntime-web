import { AttributeWithCacheKey } from '../attribute-with-cache-key';
import { ComputeContext } from '../types';
export interface ConcatAttributes extends AttributeWithCacheKey {
    readonly axis: number;
}
export declare const concat: (context: ComputeContext, attributes: ConcatAttributes) => void;
