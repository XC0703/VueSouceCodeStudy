import { createVNode } from "./vnode";

// apiCreateApp是起到将组件变成虚拟dom的作用（返回一个对象，对象具有mount挂载方法，该挂载方法做了两件事：1、生成vnode；2、render渲染vnode）
export function apiCreateApp(render) {
  // createApp方法用于指明渲染的组件以及上面的属性
  return function createApp(rootComponent, rootProps) {
    let app = {
      // 添加相关的属性
      _components: rootComponent,
      _props: rootProps,
      _container: null,
      mount(container) {
        // 挂载的位置
        // console.log(renderOptionDom, rootComponent, rootProps, container);
        // 1、创建虚拟dom vnode
        let vnode = createVNode(rootComponent, rootProps);
        // console.log(vnode);
        // 2、将虚拟dom渲染到实际的位置
        render(vnode, container);
        app._container = container;
      },
    };
    return app;
  };
}
