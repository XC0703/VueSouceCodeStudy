import { extend, isString } from "@vue/shared";
import { baseParse } from "./parse";
import { transform } from "./transform";
import { transformElement } from "./transforms/transformElement";
import { transformText } from "./transforms/transformText";
import { transformOn } from "./transforms/vOn";
import { transformBind } from "./transforms/vBind";
import { generate } from "./codegen";

export const getBaseTransformPreset: () => [any[], {}] = () => {
  // 插件预设
  return [
    [transformElement, transformText],
    {
      on: transformOn,
      bind: transformBind,
    },
  ];
};

// 完整编译过程：template -> ast -> codegen -> render
export const baseCompile = (template, options: any = {}) => {
  // 第一步：将模板字符串转换成AST
  const ast = isString(template) ? baseParse(template) : template;
  // 第二步：AST加工
  const [nodeTransforms, directiveTransforms] = getBaseTransformPreset();
  transform(
    ast,
    extend({}, options, {
      nodeTransforms: [...nodeTransforms, ...(options.nodeTransforms || [])],
      directiveTransforms: extend(
        {},
        directiveTransforms,
        options.directiveTransforms || {} // user transforms
      ),
    })
  );
  // 第三步：将AST转换成渲染函数，最终得到一个render渲染函数
  return generate(ast);
};
