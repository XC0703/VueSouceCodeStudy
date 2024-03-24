import { isArray, isObject } from "@vue/shared";
import { createVNode, isVnode } from "./vnode";

// h函数的作用==>生成vnode（createVNode原理可以回去前面的内容看），核心之一==>处理参数
export function h(type, propsOrChildren, children) {
  // 先根据参数个数来处理
  const i = arguments.length;
  if (i === 2) {
    // 情况1：元素+属性(传入一个对象)
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      if (isVnode(propsOrChildren)) {
        // 排除h("div",[h("span")])这种情况，因为h函数返回值也是一个对象，但不是属性
        return createVNode(type, null, [propsOrChildren]);
      }
      return createVNode(type, propsOrChildren); // 没有儿子
    } else {
      // 情况2：元素+children
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    if (i > 3) {
      children = Array.prototype.slice.call(arguments, 2); // 第二个参数后面的所有参数，都应该放在children数组里面
    } else if (i === 3 && isVnode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
}
