"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalMaxPool = exports.parseGlobalMaxPoolAttributes = exports.parseMaxPoolAttributes = exports.maxPool = exports.globalAveragePool = exports.parseGlobalAveragePoolAttributes = exports.averagePool = exports.parseAveragePoolAttributes = void 0;
const util_1 = require("../../util");
const attribute_with_cache_key_1 = require("../attribute-with-cache-key");
const types_1 = require("../types");
const common_1 = require("./common");
// TODO: support:
// - ceil_mode                 "test_maxpool_2d_ceil"
// - storage_order             "test_maxpool_with_argmax_2d_precomputed_strides"
// - [MaxPool] dilations       "test_maxpool_2d_dilations"
// - [MaxPool] output[1]       "test_maxpool_with_argmax_2d_precomputed_pads"
const validateInputs = (inputs) => {
    if (!inputs || inputs.length !== 1) {
        throw new Error('Pool ops requires 1 input.');
    }
    if (inputs[0].dims.length !== 4) {
        throw new Error('Pool ops supports 2-D inputs only for now.');
    }
    if (inputs[0].dataType !== 1 /* DataType.float */) {
        throw new Error('Invalid input type.');
    }
};
const getAdjustedPoolAttributesAndOutputShape = (inputs, attributes, isGlobalOperator) => {
    const isChannelsLast = attributes.format === 'NHWC';
    const inputShapeAsChannelFirst = isChannelsLast ?
        [inputs[0].dims[0], inputs[0].dims[3], inputs[0].dims[1], inputs[0].dims[2]] :
        inputs[0].dims.slice();
    const hasDilations = Object.hasOwnProperty.call(attributes, 'dilations');
    const kernelShape = attributes.kernelShape.slice();
    const strides = attributes.strides.slice();
    const dilations = hasDilations ? attributes.dilations.slice() : [];
    const pads = attributes.pads.slice();
    util_1.PoolConvUtil.adjustPoolAttributes(isGlobalOperator, inputShapeAsChannelFirst, kernelShape, strides, dilations, pads);
    const outputShapeAsChannelFirst = util_1.PoolConvUtil.computePoolOutputShape(isGlobalOperator, inputShapeAsChannelFirst, strides, dilations, kernelShape, pads, attributes.autoPad);
    const newAttributes = Object.assign({}, attributes);
    if (hasDilations) {
        Object.assign(newAttributes, { kernelShape, strides, pads, dilations, cacheKey: attributes.cacheKey });
    }
    else {
        Object.assign(newAttributes, { kernelShape, strides, pads, cacheKey: attributes.cacheKey });
    }
    return [
        newAttributes,
        isChannelsLast ?
            [
                outputShapeAsChannelFirst[0], outputShapeAsChannelFirst[2], outputShapeAsChannelFirst[3],
                outputShapeAsChannelFirst[1]
            ] :
            outputShapeAsChannelFirst
    ];
};
const generatePoolingCode = (shaderHelper, inputDims, outputShape, attributes, op1, op2, dataType, start) => {
    const isChannelsLast = attributes.format === 'NHWC';
    const rank = inputDims.length;
    const outputSize = util_1.ShapeUtil.size(outputShape);
    const outputIndicesHelper = (0, common_1.createIndicesHelper)('output', outputShape);
    const xIndicesHelper = (0, common_1.createIndicesHelper)('x', inputDims);
    if (attributes.kernelShape.length <= 2) {
        const kw = attributes.kernelShape[attributes.kernelShape.length - 1];
        const sw = attributes.strides[attributes.strides.length - 1];
        const pwStart = attributes.pads[attributes.pads.length / 2 - 1];
        const pwEnd = attributes.pads[attributes.pads.length - 1];
        const dimIdxW = rank - (isChannelsLast ? 2 : 1);
        let codeW = '';
        let codeH = '';
        let codeHEnd = '';
        if (pwStart + pwEnd !== 0) {
            codeW = `
              for (var i: u32 = 0u; i < ${kw}u; i++) {
                xIndices[${dimIdxW}] = indices[${dimIdxW}] * ${sw} - ${pwStart} + i;
                if (xIndices[${dimIdxW}] < 0 || xIndices[${dimIdxW}] >= ${inputDims[dimIdxW]}) {
                  pad++;
                  continue;
                }
                let x_val = x[${xIndicesHelper.i2oExpression('xIndices')}];
                ${op1}
              }`;
        }
        else {
            codeW = `
              for (var i: u32 = 0u; i < ${kw}u; i++) {
                xIndices[${dimIdxW}] = indices[${dimIdxW}] * ${sw} - ${pwStart} + i;
                let x_val = x[${xIndicesHelper.i2oExpression('xIndices')}];
                ${op1}
              }`;
        }
        if (attributes.kernelShape.length === 2) {
            const kh = attributes.kernelShape[attributes.kernelShape.length - 2];
            const sh = attributes.strides[attributes.strides.length - 2];
            const phStart = attributes.pads[attributes.pads.length / 2 - 2];
            const phEnd = attributes.pads[attributes.pads.length - 2];
            const dimIdxH = rank - (isChannelsLast ? 3 : 2);
            const dimH = inputDims[dimIdxH];
            if (phStart + phEnd !== 0) {
                codeH = `
                for (var j: u32 = 0u; j < ${kh}u; j++) {
                  xIndices[${dimIdxH}] = indices[${dimIdxH}] * ${sh} - ${phStart} + j;
                  if (xIndices[${dimIdxH}] < 0 || xIndices[${dimIdxH}] >= ${dimH}) {
                    pad+= ${kw};
                    continue;
                  }
              `;
            }
            else {
                codeH = `
                for (var j: u32 = 0u; j < ${kh}u; j++) {
                  xIndices[${dimIdxH}] = indices[${dimIdxH}] * ${sh} - ${phStart} + j;
                `;
            }
            codeHEnd = `
              }
            `;
        }
        const poolingCode = `
            @group(0) @binding(0) var<storage, read> x : array<${dataType}>;
            @group(0) @binding(1) var<storage, read_write> output : array<${dataType}>;

            ${outputIndicesHelper.o2iImpl}
            ${xIndicesHelper.i2oImpl}

            ${shaderHelper.mainStart()}
              ${shaderHelper.guardAgainstOutOfBoundsWorkgroupSizes(outputSize)}

              ${outputIndicesHelper.indicesVariableDeclaration('indices')}
              ${outputIndicesHelper.o2iCall('global_idx', 'indices')}
              ${outputIndicesHelper.indicesVariableDeclaration('xIndices')}
              ${outputIndicesHelper.o2iCall('global_idx', 'xIndices')}

              var value: ${dataType} = ${dataType}(${start});
              var pad = 0;
              ${codeH}
              ${codeW}
              ${codeHEnd}
              ${op2}

              output[global_idx] = value;
            }`;
        return poolingCode;
    }
    else {
        if (isChannelsLast) {
            throw new Error('Pooling with kernelShape.length > 2 is not supported for NHWC format.');
        }
        const kernelSize = util_1.ShapeUtil.size(attributes.kernelShape);
        const kernelStrides = util_1.ShapeUtil.computeStrides(attributes.kernelShape);
        const stridesRank = kernelStrides.length;
        const padsRank = attributes.pads.length;
        const hasPads = attributes.pads.reduce((sum, cur) => sum + cur);
        let padCode = '';
        if (hasPads) {
            padCode = `
                if (xIndices[j] >= inputDims[j]) {
                  pad++;
                  isPad = true;
                  break;
                }
              }
              if (!isPad) {
                let x_val = x[${xIndicesHelper.i2oExpression('xIndices')}];
                ${op1}
              }`;
        }
        else {
            padCode = `
              }
              let x_val = x[${xIndicesHelper.i2oExpression('xIndices')}];
              ${op1}
            `;
        }
        const poolingCode = `
            @group(0) @binding(0) var<storage, read> x : array<${dataType}>;
            @group(0) @binding(1) var<storage, read_write> output : array<${dataType}>;

            ${outputIndicesHelper.o2iImpl}
            ${xIndicesHelper.i2oImpl}

            const pads = array<u32, ${padsRank}>(${attributes.pads.map(i => `${i}u`).join(',')});
            const inputDims = array<u32, ${rank}>(${inputDims.map(i => `${i}u`).join(',')});
            const kernelStrides = array<u32, ${stridesRank}>(${kernelStrides.map(i => `${i}u`).join(',')});
            const strides = array<u32, ${stridesRank}>(${attributes.strides.map(i => `${i}u`).join(',')});

            ${shaderHelper.mainStart()}
              ${shaderHelper.guardAgainstOutOfBoundsWorkgroupSizes(outputSize)}

              ${outputIndicesHelper.indicesVariableDeclaration('indices')}
              ${outputIndicesHelper.o2iCall('global_idx', 'indices')}
              ${outputIndicesHelper.indicesVariableDeclaration('xIndices')}
              ${outputIndicesHelper.o2iCall('global_idx', 'xIndices')}

              var offsets: array<u32, ${stridesRank}>;

              var value = ${dataType}(${start});
              var pad = 0;
              var isPad = false;

              for (var i: u32 = 0u; i < ${kernelSize}u; i++) {
                var offset = i;
                for (var j = 0u; j < ${stridesRank - 1}u; j++) {
                  offsets[j] = offset / kernelStrides[j];
                  offset -= offsets[j] * kernelStrides[j];
                }
                offsets[${stridesRank - 1}] = offset;

                isPad = false;
                for (var j = ${rank - stridesRank}u; j < ${rank}u; j++) {
                  xIndices[j] = indices[j] * strides[j - ${rank - stridesRank}u]
                    + offsets[j - ${rank - stridesRank}u] - pads[j - 2u];
                  ${padCode}
              }
              ${op2}

              output[global_idx] = value;
            }`;
        return poolingCode;
    }
};
const parsePoolCommonAttributes = (attributes) => ({
    format: attributes.format,
    autoPad: ['NOTSET', 'VALID', 'SAME_UPPER', 'SAME_LOWER'][attributes.auto_pad],
    ceilMode: attributes.ceil_mode,
    kernelShape: attributes.kernel_shape,
    strides: attributes.strides,
    pads: attributes.pads
});
const createAveragePoolProgramInfo = (inputs, metadata, isGlobalOperator, attributes) => {
    const [adjustedAttributes, outputShape] = getAdjustedPoolAttributesAndOutputShape(inputs, attributes, isGlobalOperator);
    const kernelSize = util_1.ShapeUtil.size(adjustedAttributes.kernelShape);
    const dataType = 'f32';
    const op1 = 'value += x_val;';
    let op2 = '';
    if (adjustedAttributes.countIncludePad) {
        op2 += `value /= ${dataType}(${kernelSize});`;
    }
    else {
        op2 += `value /= ${dataType}(${kernelSize} - pad);`;
    }
    return {
        ...metadata,
        outputs: [{ dims: outputShape, dataType: inputs[0].dataType, gpuDataType: types_1.GpuDataType.default }],
        getShaderSource: shaderHelper => generatePoolingCode(shaderHelper, inputs[0].dims, outputShape, adjustedAttributes, op1, op2, dataType, '0.0'),
        dispatchGroup: () => ({ x: Math.ceil(util_1.ShapeUtil.size(outputShape) / 64 /* workgroup size */) })
    };
};
const parseAveragePoolAttributes = (attributes) => {
    const countIncludePad = attributes.count_include_pad === 0 ? false : true;
    const attr = parsePoolCommonAttributes(attributes);
    // TODO: support attribute 'ceil_mode'
    if (attr.ceilMode !== 0) {
        throw new Error('using ceil() in shape computation is not yet supported for AveragePool');
    }
    return (0, attribute_with_cache_key_1.createAttributeWithCacheKey)({ countIncludePad, ...attr });
};
exports.parseAveragePoolAttributes = parseAveragePoolAttributes;
const averagePool = (context, attributes) => {
    validateInputs(context.inputs);
    const metadata = { name: 'AveragePool', inputTypes: [types_1.GpuDataType.default], cacheHint: attributes.cacheKey };
    context.compute({ ...metadata, get: () => createAveragePoolProgramInfo(context.inputs, metadata, false, attributes) });
};
exports.averagePool = averagePool;
const globalPoolAttributes = {
    autoPad: '',
    ceilMode: 0,
    countIncludePad: false,
    kernelShape: [],
    strides: [],
    pads: [],
    storageOrder: 0,
    dilations: [],
    cacheKey: ''
};
const parseGlobalAveragePoolAttributes = (attributes) => {
    const format = attributes.format;
    return { format, ...globalPoolAttributes, cacheKey: format };
};
exports.parseGlobalAveragePoolAttributes = parseGlobalAveragePoolAttributes;
const globalAveragePool = (context, attributes) => {
    validateInputs(context.inputs);
    const metadata = { name: 'GlobalAveragePool', inputTypes: [types_1.GpuDataType.default], cacheHint: attributes.cacheKey };
    context.compute({ ...metadata, get: () => createAveragePoolProgramInfo(context.inputs, metadata, true, attributes) });
};
exports.globalAveragePool = globalAveragePool;
const createMaxPoolProgramInfo = (inputs, metadata, isGlobalOperator, attributes) => {
    const [adjustedAttributes, outputShape] = getAdjustedPoolAttributesAndOutputShape(inputs, attributes, isGlobalOperator);
    const op1 = `
      value = max(x_val, value);
    `;
    const op2 = '';
    return {
        ...metadata,
        outputs: [{ dims: outputShape, dataType: inputs[0].dataType, gpuDataType: types_1.GpuDataType.default }],
        getShaderSource: shaderHelper => generatePoolingCode(shaderHelper, inputs[0].dims, outputShape, adjustedAttributes, op1, op2, 'f32', '-1e5'),
        dispatchGroup: () => ({ x: Math.ceil(util_1.ShapeUtil.size(outputShape) / 64 /* workgroup size */) })
    };
};
const maxPool = (context, attributes) => {
    validateInputs(context.inputs);
    const metadata = { name: 'MaxPool', inputTypes: [types_1.GpuDataType.default], cacheHint: attributes.cacheKey };
    context.compute({ ...metadata, get: () => createMaxPoolProgramInfo(context.inputs, metadata, false, attributes) });
};
exports.maxPool = maxPool;
const parseMaxPoolAttributes = (attributes) => {
    const storageOrder = attributes.storage_order;
    const dilations = attributes.dilations;
    const attr = parsePoolCommonAttributes(attributes);
    // TODO: support attribute 'ceil_mode' and 'storage_order'
    if (storageOrder !== 0) {
        throw new Error('column major storage order is not yet supported for MaxPool');
    }
    if (attr.ceilMode !== 0) {
        throw new Error('using ceil() in shape computation is not yet supported for MaxPool');
    }
    return (0, attribute_with_cache_key_1.createAttributeWithCacheKey)({ storageOrder, dilations, ...attr });
};
exports.parseMaxPoolAttributes = parseMaxPoolAttributes;
const parseGlobalMaxPoolAttributes = (attributes) => {
    const format = attributes.format;
    return { format, ...globalPoolAttributes, cacheKey: format };
};
exports.parseGlobalMaxPoolAttributes = parseGlobalMaxPoolAttributes;
const globalMaxPool = (context, attributes) => {
    validateInputs(context.inputs);
    const metadata = { name: 'GlobalMaxPool', inputTypes: [types_1.GpuDataType.default], cacheHint: attributes.cacheKey };
    context.compute({ ...metadata, get: () => createMaxPoolProgramInfo(context.inputs, metadata, true, attributes) });
};
exports.globalMaxPool = globalMaxPool;
//# sourceMappingURL=pool.js.map