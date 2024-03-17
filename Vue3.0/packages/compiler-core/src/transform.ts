import { NodeTypes } from "./ast";
import { isArray, isString } from "@vue/shared";

// 创建处理节点的上下文
export function createTransformContext(
  root,
  { nodeTransforms = [], directiveTransforms = {} }
) {
  const context = {
    // plugin
    nodeTransforms,
    directiveTransforms,

    // state
    root,
    parent: null,
    currentNode: root,
  };
  return context;
}

// 转换节点
export function transform(root, options) {
  console.log("调用transform方法，开始转换AST");
  const context = createTransformContext(root, options);
  console.log("调用createTransformContext方法生成上下文", context);
  console.log("调用traverseNode方法遍历并转换节点");
  traverseNode(root, context);
  console.log("调用createRootCodegen方法生成根节点的代码生成");
  createRootCodegen(root);
  console.log("转换AST结束，返回根节点", root);
}

// 遍历并转换节点
export function traverseNode(node, context) {
  context.currentNode = node;
  // 获取转换插件序列
  const { nodeTransforms } = context;
  console.log("traverseNode中获取转换插件序列", nodeTransforms);
  const exitFns = [];
  // 通过插件依次对当前节点进行处理
  for (let i = 0; i < nodeTransforms.length; i++) {
    // 获取退出函数并缓存
    const onExit = nodeTransforms[i](node, context);
    console.log("通过插件依次对当前节点进行处理的退出函数结果onExit", onExit);
    if (onExit) {
      if (isArray(onExit)) {
        exitFns.push(...onExit);
      } else {
        exitFns.push(onExit);
      }
    }
    if (!context.currentNode) {
      return;
    } else {
      node = context.currentNode;
    }
  }
  console.log("通过插件依次对当前节点进行处理的退出函数数组exitFns", exitFns);
  // 根据节点类型递归遍历子节点
  console.log("根据节点类型递归遍历子节点");
  console.log("当前节点", node);
  switch (node.type) {
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      console.log("调用traverseChildren方法递归遍历子节点");
      traverseChildren(node, context);
      break;

    case NodeTypes.INTERPOLATION:
    case NodeTypes.TEXT:
      // TODO：处理插值节点和文本节点
      break;
  }

  context.currentNode = node;

  // 执行退出函数
  // 从叶子节点往根节点执行
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}

// 遍历子节点
export function traverseChildren(parent, context) {
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i];
    if (isString(child)) continue;
    context.parent = parent;
    traverseNode(child, context);
  }
}

// 生成根节点的 codegenNode
export function createRootCodegen(root) {
  const { children } = root;
  if (children.length === 1) {
    const child = children[0];
    if (child.type === NodeTypes.ELEMENT && child.codegenNode) {
      const codegenNode = child.codegenNode;

      root.codegenNode = codegenNode;
    } else {
      root.codegenNode = child;
    }
  }
  console.log("生成根节点的 codegenNode", root.codegenNode);

  // 源码中实现了多根节点的支持
  // else if (children.length > 1) {}
}
