export interface AttributeWithCacheKey {
    readonly cacheKey: string;
}
/**
 * create a new object from the given attribute, and add a cacheKey property to it
 */
export declare const createAttributeWithCacheKey: <T extends Record<string, unknown>>(attribute: T) => T & AttributeWithCacheKey;
