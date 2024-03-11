// AST节点类型
export const enum NodeTypes {
  ROOT, // 表示根节点
  ELEMENT, // 表示元素节点，可能是div、span等原生标签，也可能是自定义组件
  TEXT, // 表示文本节点
  SIMPLE_EXPRESSION, // 表示简单表达式节点
  ATTRIBUTE, // 表示属性节点
  DIRECTIVE, // 表示指令节点
  INTERPOLATION, // 表示插值节点
}
// 标签类型
export const enum ElementTypes {
  ELEMENT,
  COMPONENT,
}
// 创建AST的根节点
export const createRoot = (children) => {
  return {
    type: NodeTypes.ROOT,
    children,
  };
};
