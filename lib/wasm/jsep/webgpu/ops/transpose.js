"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTransposeAttributes = exports.transpose = exports.createTransposeProgramInfo = exports.transposeProgramMetadata = void 0;
const util_1 = require("../../util");
const attribute_with_cache_key_1 = require("../attribute-with-cache-key");
const types_1 = require("../types");
const common_1 = require("./common");
exports.transposeProgramMetadata = {
    name: 'Transpose',
    inputTypes: [types_1.GpuDataType.default]
};
const validateInputs = (inputs) => {
    if (!inputs || inputs.length !== 1) {
        throw new Error('Transpose requires 1 input.');
    }
    if (inputs[0].dataType !== 1 /* DataType.float */) {
        throw new Error('input should be float tensor');
    }
};
const getAdjustedPerm = (inputShape, perm) => (perm && perm.length !== inputShape.length) ? [...(inputShape.keys())].reverse() : perm;
const getOutputShape = (inputShape, perm) => util_1.ShapeUtil.sortBasedOnPerm(inputShape, getAdjustedPerm(inputShape, perm));
const permFunctionBody = (perm, rank) => {
    const reverseFunc = [];
    reverseFunc.push(`fn perm(a: ptr<function, array<u32, ${rank}>>, i: ptr<function, array<u32, ${rank}>>) {`);
    for (let i = 0; i < rank; ++i) {
        reverseFunc.push(`\t(*a)[${perm[i]}]=(*i)[${i}];`);
    }
    reverseFunc.push('\t}');
    return reverseFunc.join('\n');
};
const createTransposeProgramInfo = (input, permAttr) => {
    const dataType = 'f32'; // TODO: support other data type
    const inputShape = input.dims;
    const perm = getAdjustedPerm(inputShape, permAttr);
    const outputShape = getOutputShape(inputShape, perm);
    const rank = inputShape.length;
    const outputSize = util_1.ShapeUtil.size(outputShape);
    // A dims=[${inputs[0].dims.toString()}]
    // out Dims=[${unpackedOutputShape.toString()}]
    // based on perm=[${perm.toString()}]
    const outputIndicesHelper = (0, common_1.createIndicesHelper)('output', outputShape);
    const inputIndicesHelper = (0, common_1.createIndicesHelper)('a', inputShape);
    const getShaderSource = (shaderHelper) => `
  @group(0) @binding(0) var<storage, read> a : array<${dataType}>;
  @group(0) @binding(1) var<storage, read_write> output : array<${dataType}>;

  ${permFunctionBody(perm, rank)}
  ${outputIndicesHelper.o2iImpl}
  ${inputIndicesHelper.i2oImpl}

  ${shaderHelper.mainStart()}
    ${shaderHelper.guardAgainstOutOfBoundsWorkgroupSizes(outputSize)}

    ${outputIndicesHelper.indicesVariableDeclaration('indices')}
    ${outputIndicesHelper.o2iCall('global_idx', 'indices')}
    ${inputIndicesHelper.indicesVariableDeclaration('aIndices')}
    perm(&aIndices, &indices);

    output[global_idx] = a[${inputIndicesHelper.i2oExpression('aIndices')}];
  }`;
    return {
        ...exports.transposeProgramMetadata,
        outputs: [{ dims: outputShape, dataType: input.dataType, gpuDataType: types_1.GpuDataType.default }],
        getShaderSource,
        dispatchGroup: () => ({ x: Math.ceil(outputSize / 64 /* workgroup size */) })
    };
};
exports.createTransposeProgramInfo = createTransposeProgramInfo;
const transpose = (context, attributes) => {
    validateInputs(context.inputs);
    context.compute({
        ...exports.transposeProgramMetadata,
        cacheHint: attributes.cacheKey,
        get: () => (0, exports.createTransposeProgramInfo)(context.inputs[0], attributes.perm)
    });
};
exports.transpose = transpose;
const parseTransposeAttributes = (attributes) => (0, attribute_with_cache_key_1.createAttributeWithCacheKey)({ perm: attributes.perm });
exports.parseTransposeAttributes = parseTransposeAttributes;
//# sourceMappingURL=transpose.js.map