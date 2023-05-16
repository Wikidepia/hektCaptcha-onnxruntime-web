"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.thresholdedRelu = exports.tanh = exports.tan = exports.sqrt = exports.sinh = exports.sin = exports.sigmoid = exports.relu = exports.reciprocal = exports.neg = exports.leakyRelu = exports.floor = exports.exp = exports.erf = exports.elu = exports.parseAlphaAttributes = exports.cosh = exports.cos = exports.ceil = exports.clip = exports.clipV10 = exports.atanh = exports.atan = exports.asinh = exports.asin = exports.acosh = exports.acos = exports.abs = void 0;
const util_1 = require("../../util");
const attribute_with_cache_key_1 = require("../attribute-with-cache-key");
const types_1 = require("../types");
const createElementwiseProgramShader = (shaderHelper, datasize, funcCall, additionalImplementation) => {
    const vecSize = Math.ceil(datasize / 4);
    let expression = '';
    if (typeof funcCall === 'string') {
        expression = `${funcCall}(a)`;
    }
    else {
        expression = funcCall('a');
    }
    return `
  @group(0) @binding(0) var<storage, read> inputData : array<vec4<f32>>;
  @group(0) @binding(1) var<storage, read_write> outputData : array<vec4<f32>>;

  ${additionalImplementation ?? ''}

  ${shaderHelper.mainStart()}
    ${shaderHelper.guardAgainstOutOfBoundsWorkgroupSizes(vecSize)}

    let a = inputData[global_idx];
    outputData[global_idx] = ${expression};
  }`;
};
const createElementwiseProgramInfo = (metadata, input, funcCall, additionalImplementation) => ({
    ...metadata,
    getShaderSource: shaderHelper => createElementwiseProgramShader(shaderHelper, util_1.ShapeUtil.size(input.dims), funcCall, additionalImplementation),
    outputs: [{ dims: input.dims, dataType: input.dataType, gpuDataType: types_1.GpuDataType.default }],
    dispatchGroup: (inputTensors) => ({ x: Math.ceil(util_1.ShapeUtil.size(inputTensors[0].dims) / 64 /* workgroup size */ / 4 /* vec size */) })
});
const createElementwiseProgramInfoLoader = (input, name, funcCall, additionalImplementation, cacheKey) => {
    const metadata = { name, inputTypes: [types_1.GpuDataType.default], cacheHint: cacheKey };
    return {
        ...metadata,
        get: () => createElementwiseProgramInfo(metadata, input, funcCall, additionalImplementation)
    };
};
const abs = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Abs', 'abs'));
};
exports.abs = abs;
const acos = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Acos', 'acos'));
};
exports.acos = acos;
const acosh = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Acosh', 'acosh'));
};
exports.acosh = acosh;
const asin = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Asin', 'asin'));
};
exports.asin = asin;
const asinh = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Asinh', 'asinh'));
};
exports.asinh = asinh;
const atan = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Atan', 'atan'));
};
exports.atan = atan;
const atanh = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Atanh', 'atanh'));
};
exports.atanh = atanh;
const clipV10 = (context, attributes) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Clip', a => `clamp(${a}, clip_min_, clip_max_)`, `
    const clip_min_: vec4<f32> = vec4(f32(${attributes.min}));
    const clip_max_: vec4<f32> = vec4(f32(${attributes.max}));
`, attributes.cacheKey), { inputs: [0] });
};
exports.clipV10 = clipV10;
const generateClipAttributesFromInputs = (inputs) => {
    const min = (inputs.length >= 2) ? inputs[1].getFloat32Array()[0] : util_1.MIN_CLIP;
    const max = (inputs.length >= 3) ? inputs[2].getFloat32Array()[0] : util_1.MAX_CLIP;
    return (0, attribute_with_cache_key_1.createAttributeWithCacheKey)({ min, max });
};
const clip = (context) => {
    const attributes = generateClipAttributesFromInputs(context.inputs);
    (0, exports.clipV10)(context, attributes);
};
exports.clip = clip;
const ceil = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Ceil', 'ceil'));
};
exports.ceil = ceil;
const cos = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Cos', 'cos'));
};
exports.cos = cos;
const cosh = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Cosh', 'cosh'));
};
exports.cosh = cosh;
const parseAlphaAttributes = (attributes) => (0, attribute_with_cache_key_1.createAttributeWithCacheKey)(attributes);
exports.parseAlphaAttributes = parseAlphaAttributes;
const elu = (context, attributes) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Elu', a => `elu_vf32(${a})`, `
  const elu_alpha_: f32 = f32(${attributes.alpha});

  fn elu_f32(a: f32) -> f32 {
  return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
  }

  fn elu_vf32(v: vec4<f32>) -> vec4<f32> {
  return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
  }`, attributes.cacheKey));
};
exports.elu = elu;
const erf = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Erf', a => `erf_vf32(${a})`, `
  const r0: f32 = 0.3275911;
  const r1: f32 = 0.254829592;
  const r2: f32 = -0.284496736;
  const r3: f32 = 1.421413741;
  const r4: f32 = -1.453152027;
  const r5: f32 = 1.061405429;

  fn erf_vf32(v: vec4<f32>) -> vec4<f32> {
    let absv = abs(v);
    let x = 1.0 / (1.0 + r0 * absv);
    return sign(v) * (1.0 - ((((r5 * x + r4) * x + r3) * x + r2) * x + r1) * x * exp(-absv * absv));
  }`));
};
exports.erf = erf;
const exp = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Exp', 'exp'));
};
exports.exp = exp;
const floor = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Floor', 'floor'));
};
exports.floor = floor;
const leakyRelu = (context, attributes) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'LeakyRelu', a => `select(leaky_relu_alpha_ * ${a}, ${a}, ${a} >= vec4<f32>(0.0))`, `const leaky_relu_alpha_: f32 = f32(${attributes.alpha});`, attributes.cacheKey));
};
exports.leakyRelu = leakyRelu;
const neg = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Neg', a => `-${a}`));
};
exports.neg = neg;
const reciprocal = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Reciprocal', a => `1.0/${a}`));
};
exports.reciprocal = reciprocal;
const relu = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Relu', a => `select(vec4<f32>(0.0), ${a}, ${a} > vec4<f32>(0.0))`));
};
exports.relu = relu;
const sigmoid = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Sigmoid', a => `(1.0 / (1.0 + exp(-${a})))`));
};
exports.sigmoid = sigmoid;
const sin = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Sin', 'sin'));
};
exports.sin = sin;
const sinh = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Sinh', 'sinh'));
};
exports.sinh = sinh;
const sqrt = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Sqrt', 'sqrt'));
};
exports.sqrt = sqrt;
const tan = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Tan', 'tan'));
};
exports.tan = tan;
const tanh = (context) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'Tanh', 'tanh'));
};
exports.tanh = tanh;
const thresholdedRelu = (context, attributes) => {
    context.compute(createElementwiseProgramInfoLoader(context.inputs[0], 'ThresholdedRelu', a => `select(vec4<f32>(0.0), ${a}, ${a} > thresholded_relu_alpha_)`, `const thresholded_relu_alpha_: vec4<f32> = vec4<f32>(${attributes.alpha});`, attributes.cacheKey));
    return 0;
};
exports.thresholdedRelu = thresholdedRelu;
//# sourceMappingURL=unary-op.js.map