import { extend } from "@vue/shared";
// runtime-dom是用于操作dom（节点、属性）的模块
// 创建两个文件，分别用于处理节点nodeOps.ts与属性patchProp.ts
import { nodeOps } from "./nodeOps";
import { patchProps } from "./patchProp";

import { createRender } from "@vue/runtime-core";

// Vue3的全部dom操作
const renderOptionDom = extend({ patchProps }, nodeOps);

export const createApp = (rootComponent, rootProps) => {
  // 创建一个渲染的容器
  let app = createRender(renderOptionDom).createApp(rootComponent, rootProps); // createRender返回的是一个具有createApp属性方法的对象，打点执行该createApp方法后返回一个app对象，里面有一个mount属性方法
  let { mount } = app;
  app.mount = function (container) {
    // 挂载组件之前要清空原来的内容，同时把模版字符串处理后（将标签前后的换行空格去除，压缩成一行，防止对AST生成造成影响）挂载到container上
    container = nodeOps.querySelector(container);
    // 第一件事：将模版字符串挂载到container上（把标签前后的空格换行去除，防止对codegen环节造成影响），因为后续会清空container.innerHTML
    container.template = container.innerHTML
      .replace(/\n\s*/g, "")
      .replace(/\s+</g, "<")
      .replace(/>\s+/g, ">");
    container.innerHTML = "";
    // 渲染新的内容(挂载dom)
    mount(container);
  };
  return app;
};

export * from "@vue/runtime-core";
