import { isString } from "@vue/shared";

// 节点类型
export const enum NodeTypes {
  // AST节点类型
  ROOT, // 表示根节点
  ELEMENT, // 表示元素节点，可能是div、span等原生标签，也可能是自定义组件
  TEXT, // 表示文本节点
  SIMPLE_EXPRESSION, // 表示简单表达式节点
  ATTRIBUTE, // 表示属性节点
  DIRECTIVE, // 表示指令节点
  INTERPOLATION, // 表示插值节点

  // 表示可以包含子节点的结构，比如元素节点、文本节点等
  TEXT_CALL, // 表示文本节点中的插值节点，比如parse {{ element }}</div>中的{{ element }}
  COMPOUND_EXPRESSION, // 表示复合表达式节点，比如{{ a + b }}中的a + b

  // For codegen，用于代码生成
  VNODE_CALL, // 表示创建VNode节点的代码
  JS_PROPERTY, // 表示JS对象的属性
  JS_CALL_EXPRESSION, // 表示JS的调用表达式
  JS_ARRAY_EXPRESSION, // 表示JS的数组表达式
  JS_OBJECT_EXPRESSION, // 表示JS的对象表达式
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

/**
 * 下面是与创建codegenNode相关的工具函数
 */
// 创建一个简单的表达式节点
export const createSimpleExpression = (content, isStatic = false) => {
  return {
    type: NodeTypes.SIMPLE_EXPRESSION,
    content,
    isStatic,
  };
};
// 创建一个对象属性节点
export const createObjectProperty = (key, value) => {
  return {
    type: NodeTypes.JS_PROPERTY,
    key: isString(key) ? createSimpleExpression(key, true) : key,
    value,
  };
};
// 创建一个函数调用表达式节点
export const createCallExpression = (args = []) => {
  return {
    type: NodeTypes.JS_CALL_EXPRESSION,
    arguments: args,
  };
};
// 创建一个对象表达式节点
export const createObjectExpression = (properties) => {
  return {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    properties,
  };
};
// 这个函数是用来生成 codegenNode 的
export const createVNodeCall = (
  type,
  tag,
  props,
  children,
  patchFlag,
  dynamicProps,
  directives,
  isComponent
) => {
  // 源码这里还会处理 helper，这里为了方便暂不处理
  return {
    // 源码这里是 type：NodeTypes.VNODE_CALL，这里为了方便后面处理直接赋值为原本的节点类型
    type,
    tag,
    props,
    children,
    patchFlag,
    dynamicProps,
    directives,
    isComponent,
  };
};
