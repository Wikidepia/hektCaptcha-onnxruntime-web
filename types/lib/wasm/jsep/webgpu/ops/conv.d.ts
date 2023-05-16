import { AttributeWithCacheKey } from '../attribute-with-cache-key';
import { ComputeContext } from '../types';
import { InternalActivationAttributes } from './fuse-utils';
export declare const calculateOutputShape: (inputShape: readonly number[], kernelShape: readonly number[], dilations: readonly number[], adjustPads: readonly number[], strides: readonly number[], isChannelLast: boolean) => number[];
export interface ConvAttributes extends InternalActivationAttributes, AttributeWithCacheKey {
    readonly autoPad: string;
    readonly dilations: readonly number[];
    readonly format: 'NHWC' | 'NCHW';
    readonly group: number;
    readonly kernelShape: readonly number[];
    readonly pads: readonly number[];
    readonly strides: readonly number[];
    readonly wIsConst: boolean;
}
export declare const parseConvAttributes: (attributes: Record<string, unknown>) => ConvAttributes;
export declare const conv: (context: ComputeContext, attributes: ConvAttributes) => void;
