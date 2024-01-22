import { isArray, isObject, isString, ShapeFlags } from "@vue/shared";
// 生成vnode(本质是一个对象)
export const createVNode = (type, props, children = null) => {
  // console.log(rootComponent, rootProps);

  // 区分是组件的虚拟dom还是元素的虚拟dom
  // 如果是字符串，说明是是一个普通的 HTML 元素节点；如果不是字符串且是一个对象，说明是一个组件（这里简化处理，直接默认有状态组件）
  let shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0;
  const vnode = {
    _v_isVNode: true, //表示是一个虚拟dom
    type, // createVNode时传入的是rootComponent，本质是一个对象，组件的所有属性都在这里，比如setup方法
    props,
    children,
    key: props && props.key, // 后面的diff算法会用到
    el: null, // 虚拟dom对应的真实dom
    component: {}, // 组件的实例对象
    shapeFlag,
  };

  // 儿子标识
  normalizeChildren(vnode, children);
  return vnode;
};

function normalizeChildren(vnode, children) {
  let type = 0;
  if (children === null) {
  } else if (isArray(children)) {
    // 说明该虚拟节点包含数组形式的子节点
    type = ShapeFlags.ARRAY_CHILDREN;
  } else {
    // 简化处理，表示该虚拟节点包含纯文本子节点
    type = ShapeFlags.TEXT_CHILDREN;
  }
  vnode.shapeFlag = vnode.shapeFlag | type; // 可能标识会受儿子影响
}
