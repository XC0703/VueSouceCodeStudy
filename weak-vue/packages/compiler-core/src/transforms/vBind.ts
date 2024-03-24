import {
  createObjectProperty,
  createSimpleExpression,
  NodeTypes,
} from "../ast";

// 处理 v-bind 指令
export const transformBind = (dir) => {
  // console.log("调用transformBind方法处理v-bind指令，进入的节点为", dir);
  const { exp } = dir;
  const arg = dir.arg;

  // 容错处理，如果为空则输出一个空字符串
  if (arg.type !== NodeTypes.SIMPLE_EXPRESSION) {
    arg.children.unshift("(");
    arg.children.push(') || ""');
  } else if (!arg.isStatic) {
    arg.content = `${arg.content} || ""`;
  }

  // 包装并返回 JS_PROPERTY 节点
  if (
    !exp ||
    (exp.type === NodeTypes.SIMPLE_EXPRESSION && !exp.content.trim())
  ) {
    return {
      props: [createObjectProperty(arg, createSimpleExpression("", true))],
    };
  }

  const ret = {
    props: [createObjectProperty(arg, exp)],
  };
  // console.log("transformBind方法处理v-bind指令返回", ret);

  return ret;
};
