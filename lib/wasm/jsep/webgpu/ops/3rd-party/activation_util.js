"use strict";
/**
 * @license
 * Copyright 2021 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.biasActivationSnippet = exports.activationFnSnippet = exports.typeSnippet = void 0;
const typeSnippet = (component) => {
    switch (component) {
        case 1:
            return 'f32';
        case 2:
            return 'vec2<f32>';
        case 3:
            return 'vec3<f32>';
        case 4:
            return 'vec4<f32>';
        default:
            throw new Error(`${component}-component is not supported.`);
    }
};
exports.typeSnippet = typeSnippet;
const activationFnSnippet = (activation, _hasPreluActivationWeights = false, _packed = false, _coordsLength = 3) => {
    if (!activation) {
        return '';
    }
    // TODO: add implementations
    return '';
};
exports.activationFnSnippet = activationFnSnippet;
const biasActivationSnippet = (hasBias, activation) => `
      ${hasBias ? 'value = value + getBiasByOutputCoords(coords);' : ''}
      ${activation ? 'value = activation(value, coords);' : ''}
      `;
exports.biasActivationSnippet = biasActivationSnippet;
//# sourceMappingURL=activation_util.js.map