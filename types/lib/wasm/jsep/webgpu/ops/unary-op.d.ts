import { AttributeWithCacheKey } from '../attribute-with-cache-key';
import { ComputeContext } from '../types';
export declare const abs: (context: ComputeContext) => void;
export declare const acos: (context: ComputeContext) => void;
export declare const acosh: (context: ComputeContext) => void;
export declare const asin: (context: ComputeContext) => void;
export declare const asinh: (context: ComputeContext) => void;
export declare const atan: (context: ComputeContext) => void;
export declare const atanh: (context: ComputeContext) => void;
export interface ClipAttributes extends AttributeWithCacheKey {
    readonly min: number;
    readonly max: number;
}
export declare const clipV10: (context: ComputeContext, attributes: ClipAttributes) => void;
export declare const clip: (context: ComputeContext) => void;
export declare const ceil: (context: ComputeContext) => void;
export declare const cos: (context: ComputeContext) => void;
export declare const cosh: (context: ComputeContext) => void;
export interface AlphaAttributes extends AttributeWithCacheKey {
    readonly alpha: number;
}
export declare const parseAlphaAttributes: (attributes: Record<string, unknown>) => AlphaAttributes;
export declare const elu: (context: ComputeContext, attributes: AlphaAttributes) => void;
export declare const erf: (context: ComputeContext) => void;
export declare const exp: (context: ComputeContext) => void;
export declare const floor: (context: ComputeContext) => void;
export declare const leakyRelu: (context: ComputeContext, attributes: AlphaAttributes) => void;
export declare const neg: (context: ComputeContext) => void;
export declare const reciprocal: (context: ComputeContext) => void;
export declare const relu: (context: ComputeContext) => void;
export declare const sigmoid: (context: ComputeContext) => void;
export declare const sin: (context: ComputeContext) => void;
export declare const sinh: (context: ComputeContext) => void;
export declare const sqrt: (context: ComputeContext) => void;
export declare const tan: (context: ComputeContext) => void;
export declare const tanh: (context: ComputeContext) => void;
export declare const thresholdedRelu: (context: ComputeContext, attributes: AlphaAttributes) => number;
