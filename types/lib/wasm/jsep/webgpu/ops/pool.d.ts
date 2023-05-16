import { AttributeWithCacheKey } from '../attribute-with-cache-key';
import { ComputeContext } from '../types';
export interface FormatAttributes {
    readonly format: 'NHWC' | 'NCHW';
}
export interface PoolCommonAttributes extends FormatAttributes {
    readonly autoPad: string;
    readonly ceilMode: number;
    readonly kernelShape: readonly number[];
    readonly strides: readonly number[];
    readonly pads: readonly number[];
}
export interface AveragePoolAttributes extends PoolCommonAttributes, AttributeWithCacheKey {
    readonly countIncludePad: boolean;
}
export declare const parseAveragePoolAttributes: (attributes: Record<string, unknown>) => AveragePoolAttributes;
export declare const averagePool: (context: ComputeContext, attributes: AveragePoolAttributes) => void;
export declare const parseGlobalAveragePoolAttributes: (attributes: Record<string, unknown>) => AveragePoolAttributes;
export declare const globalAveragePool: (context: ComputeContext, attributes: AveragePoolAttributes) => void;
export interface MaxPoolAttributes extends PoolCommonAttributes, AttributeWithCacheKey {
    readonly storageOrder: number;
    readonly dilations: number[];
}
export declare const maxPool: (context: ComputeContext, attributes: MaxPoolAttributes) => void;
export declare const parseMaxPoolAttributes: (attributes: Record<string, unknown>) => MaxPoolAttributes;
export declare const parseGlobalMaxPoolAttributes: (attributes: Record<string, unknown>) => MaxPoolAttributes;
export declare const globalMaxPool: (context: ComputeContext, attributes: MaxPoolAttributes) => void;
