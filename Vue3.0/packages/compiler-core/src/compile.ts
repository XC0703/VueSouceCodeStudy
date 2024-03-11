import { baseParse } from "./parse";

// 完整编译过程：template -> ast -> codegen -> render
export const baseCompile = (template, options) => {
  // 第一步：将模板字符串转换成AST
  const ast = baseParse(template);
  // 第二步：AST加工
  // 第三步：将AST转换成渲染函数，最终得到一个render渲染函数
};
