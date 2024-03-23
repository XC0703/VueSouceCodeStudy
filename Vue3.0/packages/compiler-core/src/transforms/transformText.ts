import { NodeTypes } from "../ast";
import { isText } from "../utils";

// 处理组合表达式
export const transformText = (node) => {
  // 只有元素节点和根节点需要处理
  if (node.type === NodeTypes.ROOT || node.type === NodeTypes.ELEMENT) {
    return function postTransformText() {
      // console.log("调用transformText方法处理组合表达式，当前节点为", node);
      const children = node.children;
      let currentContainer = undefined;
      let hasText = false;

      // 遍历查找文本/插值表达式节点
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        // 找到则将 hasText 置为 true 并查找后面的节点
        if (isText(child)) {
          hasText = true;
          // 查找后面的节点
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            // 找到了则进行合并
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child],
                };
              }

              // 合并相邻文本/插值表达式节点到 currentContainer 内，currentContainer 只是children[i]的一个引用，改变currentContainer的值，children[i]也会改变
              currentContainer.children.push(next);
              children.splice(j, 1);
              j--;
            } else {
              // 没找到就直接退出
              currentContainer = undefined;
              break;
            }
          }
        }
      }
      // console.log("处理组合表达式后的结果currentContainer", currentContainer);
    };
  }
};
