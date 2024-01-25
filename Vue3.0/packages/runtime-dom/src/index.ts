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
    // 挂载组件之前要清空原来的内容
    container = nodeOps.querySelector(container);
    container.innerHTML = "";
    // 渲染新的内容(挂载dom)
    mount(container);
  };
  return app;
};

export * from "@vue/runtime-core";
