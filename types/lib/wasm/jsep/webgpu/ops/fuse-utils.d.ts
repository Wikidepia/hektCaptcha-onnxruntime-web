export interface InternalActivationAttributes {
    readonly activation: string;
    readonly clipMin?: number;
    readonly clipMax?: number;
    readonly activationCacheKey: string;
}
export declare const getActicationSnippet: (attributes: InternalActivationAttributes) => {
    activationFunction: string;
    applyActivation: string;
};
export declare const parseInternalActivationAttributes: (attributes: Record<string, unknown> | undefined) => InternalActivationAttributes;
