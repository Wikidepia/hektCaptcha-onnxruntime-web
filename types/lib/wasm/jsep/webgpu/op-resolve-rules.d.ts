import { ComputeContext } from './types';
export type RunFunction = (context: ComputeContext, attribute?: unknown) => void;
export type ParseAttributeFunction = (attributeRaw: unknown) => unknown;
export type OperatorImplementation = [RunFunction] | [RunFunction, ParseAttributeFunction];
export declare const WEBGPU_OP_RESOLVE_RULES: Map<string, OperatorImplementation>;
