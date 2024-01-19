export enum ShapeFlags {
  ELEMENT = 1, // 表示该虚拟节点是一个普通的 HTML 元素节点
  FUNCTIONAL_COMPONENT = 1 << 1, // 表示该虚拟节点是一个函数式组件节点
  STATEFUL_COMPONENT = 1 << 2, // 表示该虚拟节点是一个有状态的组件节点
  TEXT_CHILDREN = 1 << 3, // 表示该虚拟节点包含纯文本子节点
  ARRAY_CHILDREN = 1 << 4, // 表示该虚拟节点包含数组形式的子节点
  SLOTS_CHILDREN = 1 << 5, // 表示该虚拟节点包含插槽形式的子节点
  TELEPORT = 1 << 6, // 表示该虚拟节点是一个传送门（Teleport）节点
  SUSPENSE = 1 << 7, // 表示该虚拟节点是一个异步加载（Suspense）节点
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8, // 表示该虚拟节点的组件应该被缓存而不是销毁
  COMPONENT_KEPT_ALIVE = 1 << 9, // 表示该虚拟节点的组件已被缓存
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT, // 表示该虚拟节点是一个组件节点，可以是函数式组件或者有状态的组件
}
