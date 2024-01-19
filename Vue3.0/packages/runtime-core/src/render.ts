import { apiCreateApp } from "./apiCreateApp";

// 实现渲染Vue3组件==>vnode==>render
export function createRender(renderOptionDom) {
  // 真正实现渲染的函数（渲染vnode)
  let render = (vnode, containers) => {};

  // 返回一个具有createApp方法的对象，其中createApp负责生成一个具有mount挂载方法的app对象（包含属性、方法等），进而实现1、生成vnode；2、render渲染vnode
  return {
    createApp: apiCreateApp(render),
  };
}
