"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseInternalActivationAttributes = exports.getActicationSnippet = void 0;
const util_1 = require("../../util");
const getActicationSnippet = (attributes) => {
    switch (attributes.activation) {
        case 'Relu':
            return { activationFunction: '', applyActivation: 'value = max(value, 0.0);' };
        case 'Sigmoid':
            return { activationFunction: '', applyActivation: 'value = (1.0 / (1.0 + exp(-value)));' };
        case 'Clip':
            return {
                activationFunction: `const clip_min_=f32(${attributes.clipMin});const clip_max_=f32(${attributes.clipMax});`,
                applyActivation: 'value = clamp(value, clip_min_, clip_max_);'
            };
        // TODO: adding other activations that can be fused.
        default:
            return { activationFunction: '', applyActivation: '' };
    }
};
exports.getActicationSnippet = getActicationSnippet;
const parseInternalActivationAttributes = (attributes) => {
    const activation = attributes?.activation || '';
    if (activation === 'Clip') {
        const [clipMin, clipMax] = attributes?.activation_params || [util_1.MIN_CLIP, util_1.MAX_CLIP];
        return { activation, clipMax, clipMin, activationCacheKey: `${activation}:${clipMin},${clipMax}` };
    }
    return { activation, activationCacheKey: activation };
};
exports.parseInternalActivationAttributes = parseInternalActivationAttributes;
//# sourceMappingURL=fuse-utils.js.map