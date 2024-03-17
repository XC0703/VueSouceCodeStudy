import { capitalize, toHandlerKey } from "@vue/shared";
import {
  createObjectProperty,
  createSimpleExpression,
  NodeTypes,
} from "../ast";

// 处理 v-on 指令
export const transformOn = (dir) => {
  console.log("调用transformOn方法处理v-on指令，进入的节点为", dir);
  const { arg } = dir;

  // 驼峰化
  let eventName;
  if (arg.type === NodeTypes.SIMPLE_EXPRESSION) {
    if (arg.isStatic) {
      const rawName = arg.content;
      eventName = createSimpleExpression(
        toHandlerKey(capitalize(rawName)),
        true
      );
    }
    // 源码在这里将动态的事件名处理成组合表达式
  } else {
    eventName = arg;
  }

  // 处理表达式
  let exp = dir.exp;
  if (exp && !exp.content.trim()) {
    exp = undefined;
  }
  // 源码在这里会处理事件缓存
  // 源码在这里会处理外部插件 extended compiler augmentor

  // 包装并返回 JS_PROPERTY 节点
  const ret = {
    props: [
      createObjectProperty(
        eventName,
        exp || createSimpleExpression("() => {}", false)
      ),
    ],
  };
  console.log("transformOn方法处理v-on指令返回", ret);
  return ret;
};
