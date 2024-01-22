import { ShapeFlags } from "@vue/shared";
import { apiCreateApp } from "./apiCreateApp";
import {
  createComponentInstance,
  setupComponet,
  setupRenderEffect,
} from "./component";

// 实现渲染Vue3组件==>vnode==>render
export function createRender(renderOptionDom) {
  // 组件渲染的真正方法（实现由虚拟dom变成真实dom），步骤（核心）：
  const mountComponent = (InitialVnode, container) => {
    // 1、先有一个组件的实例对象（即Vue3组件渲染函数render传入的第一个参数proxy，其实proxy参数将组件定义的所有属性合并了，等效于在setup入口函数里面返回一个函数，可以用proxy.来获取属性）
    const instanece = (InitialVnode.component =
      createComponentInstance(InitialVnode)); // 记得在Vue3.0\packages\runtime-core\src\vnode.ts文件给vnode定义中加上这个属性
    // 2、解析数据到这个实例对象中
    setupComponet(instanece);
    // 3、创建一个effect让render函数执行
    setupRenderEffect();
  };

  // 组件的创建方法（分为初次渲染和更新两种情况）
  const processComponent = (n1, n2, container) => {
    if (n1 === null) {
      // 组件第一次加载
      mountComponent(n2, container);
    } else {
      // 更新
    }
  };

  // patch函数负责根据vnode的不同情况（组件、元素）来实现对应的渲染
  const patch = (n1, n2, container) => {
    // 针对不同的类型采取不同的渲染方式（vonode有一个shapeFlag标识来标识组件/元素）
    const { shapeFlag } = n2;
    // 等效于shapeFlag && shapeFlag === ShapeFlags.ELEMENT
    if (shapeFlag & ShapeFlags.ELEMENT) {
      // 处理元素
      // console.log("元素");
    } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      // 处理组件
      processComponent(n1, n2, container);
    }
  };

  // 真正实现渲染的函数（渲染vnode)
  let render = (vnode, container) => {
    // 第一次渲染（三个参数：旧的节点、当前节点、位置）
    patch(null, vnode, container);
  };

  // 返回一个具有createApp方法的对象，其中createApp负责生成一个具有mount挂载方法的app对象（包含属性、方法等），进而实现1、生成vnode；2、render渲染vnode
  return {
    createApp: apiCreateApp(render),
  };
}
