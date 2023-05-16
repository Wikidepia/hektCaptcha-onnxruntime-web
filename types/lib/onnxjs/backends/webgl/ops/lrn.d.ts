import { AttributeWithCacheKey } from '../../../attribute-with-cache-key';
import { OperatorImplementation, OperatorInitialization } from '../../../operators';
import { Tensor } from '../../../tensor';
import { ProgramInfoLoader } from '../types';
export interface LrnAttributes extends AttributeWithCacheKey {
    alpha: number;
    beta: number;
    bias: number;
    size: number;
}
export declare const lrn: OperatorImplementation<LrnAttributes>;
export declare const parseLrnAttributes: OperatorInitialization<LrnAttributes>;
export declare function createLrnProgramInfoLoader(inputs: Tensor[], attributes: LrnAttributes): ProgramInfoLoader;
