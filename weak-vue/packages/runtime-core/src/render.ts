import { ShapeFlags } from "@vue/shared";
import { effect } from "@vue/reactivity";
import { apiCreateApp } from "./apiCreateApp";
import { createComponentInstance, setupComponet } from "./component";
import { CVnode, TEXT } from "./vnode";
import { invokeArrayFns } from "./apilifecycle";

let curVnode = null; // 当前的vnode
// 实现渲染Vue3组件==>vnode==>render
export function createRender(renderOptionDom) {
  // 获取所有的dom操作
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProps: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
  } = renderOptionDom;

  // 创建一个effect让render函数执行(响应式)
  const setupRenderEffect = (instance, container) => {
    // 创建effect(原理可以回前面的内容找)
    effect(function componentEffect() {
      // 判断是否是初次渲染
      if (!instance.isMounted) {
        // 渲染之前的阶段
        let { bm, m } = instance;
        if (bm) {
          invokeArrayFns(bm);
        }

        // 获取到render返回值
        const proxy = instance.proxy; // 已经代理了组件，可以访问到组件的所有属性和所有方法
        // console.log("这是组件实例proxy：");
        const subTree = instance.render.call(proxy, proxy); // render函数执行，即调用render函数，第一个参数表示render函数的this指向组件实例proxy，第二个参数表示执行render函数的参数也是proxy
        instance.subTree = subTree; // 记得在实例上挂载vnode，方便后面更新时使用
        curVnode = subTree; // 记得在全局挂载vnode，方便后面更新时使用
        patch(null, subTree, container); // 渲染vnode（此时是元素的vnode）
        // 渲染完成的阶段
        if (m) {
          invokeArrayFns(m);
        }
        instance.isMounted = true;
      } else {
        let { bu, u } = instance;
        if (bu) {
          invokeArrayFns(bu);
        }
        // console.log("更新");
        // 对比新旧vnode--diff算法
        let proxy = instance.proxy;
        const prevVnode = instance.subTree; // 旧vnode，记得上面首次渲染在实例上挂载
        const nextVnode = instance.render.call(proxy, proxy); // 新vnode
        instance.subTree = nextVnode;
        patch(prevVnode, nextVnode, container); // 此时在patch方法中会对比新旧vnode，然后更新
        if (u) {
          invokeArrayFns(u);
        }
      }
    });
  };

  /** ---------------处理组件--------------- */
  // 组件的创建方法（分为初次渲染和更新两种情况）
  const processComponent = (n1, n2, container) => {
    if (n1 === null) {
      // 组件第一次加载---负责初次渲染以及实现Effect依赖收集
      mountComponent(n2, container);
    }
  };
  // 组件渲染的真正方法（实现由虚拟dom变成真实dom），步骤（核心）：
  const mountComponent = (InitialVnode, container) => {
    // 1、先有一个组件的实例对象（即Vue3组件渲染函数render传入的第一个参数proxy，其实proxy参数将组件定义的所有属性合并了，等效于在setup入口函数里面返回一个函数，可以用proxy.来获取属性）
    const instanece = (InitialVnode.component =
      createComponentInstance(InitialVnode)); // 记得在Vue3.0\packages\runtime-core\src\vnode.ts文件给vnode定义中加上这个属性
    // 2、解析数据到这个实例对象中
    setupComponet(instanece);
    // 3、创建一个effect让render函数执行
    setupRenderEffect(instanece, container);
  };

  /** ---------------处理元素--------------- */
  const processElement = (n1, n2, container, anchor) => {
    if (n1 === null) {
      // 元素第一次挂载
      mountElement(n2, container, anchor);
    } else {
      // 更新
      // console.log("更新！！！");
      patchElement(n1, n2, container, anchor);
    }
  };
  // 元素的更新方法
  const patchElement = (n1, n2, container, anchor) => {
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    // 1、对比属性
    let el = (n2.el = n1.el); // 获取真实dom
    patchProps(el, oldProps, newProps);
    // 2、对比子节点--与初次挂载一样，需要将可能的字符串也要转换成vnode
    n1.children = n1.children.map((item) => {
      return CVnode(item);
    });
    n2.children = n2.children.map((item) => {
      return CVnode(item);
    });
    patchChildren(n1, n2, el);
  };
  // 对比属性有三种情况：
  // 1、新旧属性都有，但是值不一样
  // 2、旧属性有，新属性没有
  // 3、新属性有，旧属性没有
  const patchProps = (el, oldProps, newProps) => {
    if (oldProps !== newProps) {
      // 1、新旧属性都有，但是值不一样
      for (const key in newProps) {
        const prev = oldProps[key];
        const next = newProps[key];
        if (prev !== next) {
          hostPatchProp(el, key, prev, next); // 替换属性
        }
      }
      // 2、新属性有，旧属性没有
      for (const key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null); // 删除属性
        }
      }
      // 3、旧属性有，新属性没有
      for (const key in newProps) {
        if (!(key in oldProps)) {
          hostPatchProp(el, key, null, newProps[key]); // 新增属性
        }
      }
    }
  };
  // 对比子节点有四种情况：
  // 1、旧的有子节点，新的没有子节点
  // 2、旧的没有子节点，新的有子节点
  // 3、旧的有子节点，新的也有子节点，但是是文本节点（最简单的情况）
  // 4、旧的有子节点，新的也有子节点，但是可能是数组
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children;
    const c2 = n2.children;
    const prevShapeFlag = n1.shapeFlag;
    const newShapeFlag = n2.shapeFlag;
    if (newShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 新的是文本节点，直接替换
      if (c2 !== c1) {
        hostSetElementText(el, c2);
      }
    } else {
      // 新的是数组，此时要判断旧的
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 旧的也是数组（较复杂）
        patchKeyChildren(c1, c2, el);
      } else {
        // 旧的是文本节点，将文本节点清空，然后再将新的节点进行渲染
        hostSetElementText(el, "");
        mountChildren(el, c2);
      }
    }
  };
  // 对比数组子节点
  const patchKeyChildren = (c1, c2, el) => {
    // vue2中使用的是基于递归的双指针的 diff 算法，即双端diff，会对整个组件树进行完整的遍历和比较。详细讲解见：https://segmentfault.com/a/1190000042197936#item-4-4
    // 双端diff的目的是为了尽可能的复用节点，通过移动指针的方式来复用节点

    // vue3中使用的是基于数组的动态规划的 diff 算法。Vue 3 的算法效率更高，因为它使用了一些优化技巧，例如按需更新、静态标记等，会跳过静态子树的比较减少比较次数。
    // 下面是vue3的diff算法，处理简单情况时也用到了双端diff：

    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    // 1、diff from start，即从头开始对比--简单情况1：旧的排列和新的排列前面节点一致，这些节点是可以复用的
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnode(n1, n2)) {
        // 递归对比子节点，先渲染出来，相当于重新走一次流程
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }
    // console.log(
    //   "diff from start停止时的i:",
    //   i,
    //   "当前旧节点停止的位置e1",
    //   e1,
    //   "当前新节点停止的位置e2",
    //   e2
    // );
    // 2、diff from end，即从尾开始对比--简单情况2：旧的排列和新的排列后面节点一致，这些节点是可以复用的
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnode(n1, n2)) {
        // 递归对比子节点，先渲染出来，相当于重新走一次流程
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    // console.log(
    //   "diff from end停止时的i:",
    //   i,
    //   "当前旧节点停止的位置e1",
    //   e1,
    //   "当前新节点停止的位置e2",
    //   e2
    // );

    // 1、新的子节点数量多的情况--要新增，又分为两种情况：1、新增的节点在旧的节点之前，2、新增的节点在旧的节点之后
    if (i > e1) {
      const nextPos = e2 + 1; // e2+1要么表示后面部分可复用的节点的倒数最后一个，要么为null（即后面部分没有可复用的节点）
      const anchor = nextPos < c2.length ? c2[nextPos].el : null;
      while (i <= e2) {
        // console.log(
        //   "要插入的节点：",
        //   c2[i].key,
        //   "，插入到：",
        //   anchor || "null",
        //   "节点之前"
        // );
        patch(null, c2[i], el, anchor); // 记得给patch函数以及里面使用的相关方法传入anchor参数
        i++;
      }
    } else if (i > e2) {
      // 2、旧的子节点数量多的情况--要删除
      while (i <= e1) {
        // console.log("要删除的节点：", c1[i].key);
        unmount(c1[i]);
        i++;
      }
    } else {
      // 3、乱序，并不是简单将中间乱序节点全部删除再全部新增，而是要尽可能的复用节点
      // 解决思路：（1）以新的乱序个数创建一个映射表；（2）再用旧的乱序的数据去映射表中查找，如果有，说明是可以复用的，如果没有，说明是该旧节点需要删除的
      const s1 = i; // 旧的乱序开始位置
      const s2 = i; // 新的乱序开始位置
      // 创建表
      let keyToNewIndexMap = new Map();
      // 解决两个问题：1、复用的节点渲染位置不对；2、要新增的节点没有插入。
      const toBePatched = e2 - s2 + 1; // 新的乱序的数量
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0); // 新的乱序的数量的数组，每个元素都是0

      // 用新的乱序数据去创建映射表
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }
      // console.log("映射表：", keyToNewIndexMap);
      // 新：A B C D E F G==>乱序映射表：D=>3，E=>4，F=>5。
      // 旧：A B C M F E Q G==>乱序映射表：M=>3，F=>4，E=>5，Q=>6。
      // 去旧的乱序数据中查找
      for (let i = s1; i <= e1; i++) {
        const oldChildVnode = c1[i];
        const newIndex = keyToNewIndexMap.get(oldChildVnode.key);
        if (!newIndex) {
          // 说明旧的节点需要删除（即M和Q）
          // console.log("要删除的节点：", oldChildVnode.key);
          unmount(oldChildVnode);
        } else {
          // console.log("要复用的节点：", oldChildVnode.key);
          newIndexToOldIndexMap[newIndex - s2] = i + 1; // 现在将复用的节点的位置改为旧的乱序的位置+1
          // console.log("newIndexToOldIndexMap:", newIndexToOldIndexMap);
          patch(oldChildVnode, c2[newIndex], el);
        }
      }

      // 获取最长递增子序列的索引
      // console.log(
      //   "乱序节点的索引数组newIndexToOldIndexMap:",
      //   newIndexToOldIndexMap
      // );
      const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
      // console.log(
      //   "newIndexToOldIndexMap数组中最长递增子序列数组increasingNewIndexSequence:",
      //   increasingNewIndexSequence
      // );
      let j = increasingNewIndexSequence.length - 1;
      // 此时根据这个位置数组去移动或者新增我们的节点(从后往前处理)
      for (let i = toBePatched - 1; i >= 0; i--) {
        const currentIndex = s2 + i; // 当前要处理的新的乱序的节点的位置
        const anchor =
          currentIndex + 1 < c2.length ? c2[currentIndex + 1].el : null;
        if (newIndexToOldIndexMap[i] === 0) {
          // 说明是新增的节点
          // console.log(
          //   "新增的节点：",
          //   c2[currentIndex].key,
          //   "，插入到：",
          //   anchor || "null",
          //   "节点之前"
          // );
          patch(null, c2[currentIndex], el, anchor); // 比如从后往前遍历到D时，插入到E的前面。
        } else {
          // 说明是要移动的可复用节点
          // console.log(
          //   "要移动的节点：",
          //   c2[currentIndex].key,
          //   "，移动到：",
          //   anchor || "null",
          //   "节点之前"
          // );
          // 这个插入需要一个个的插入，大量情况下会可能导致性能问题。
          // 用最长递增子序列去优化，如果在区间内，就不用移动，如果不在区间内，就移动。
          if (i !== increasingNewIndexSequence[j]) {
            hostInsert(c2[currentIndex].el, el, anchor); // 比如从后往前遍历到F时，应该移动到G的前面；从后往前遍历到E时，应该移动到F的前面。此时已渲染序列为A B C E F G
          } else {
            j--;
          }
        }
      }
    }
  };

  // 最长递增子序列--用于乱序节点的一次性复用
  const getSequence = (nums) => {
    const len = nums.length;
    if (len <= 1) return len;
    let dp = [0];
    let p = [0];
    for (let i = 0; i < len; i++) {
      if (nums[i] > nums[dp[dp.length - 1]]) {
        p[i] = dp[dp.length - 1];
        dp.push(i);
      } else {
        let left = 0;
        let right = dp.length - 1;
        while (left < right) {
          let mid = (left + right) >> 1;
          if (nums[dp[mid]] < nums[i]) {
            left = mid + 1;
          } else {
            right = mid;
          }
        }
        // 直接替换
        if (left > 0) {
          p[i] = dp[left - 1];
        }
        dp[left] = i; // 此时dp前面的元素都比nums[i]小
      }
    }
    let u = dp.length;
    let v = dp[u - 1];
    while (u-- > 0) {
      dp[u] = v;
      v = p[v];
    }
    return dp;
  };
  // 元素的渲染方法
  const mountElement = (vnode, container, anchor) => {
    // 递归渲染子节点==>dom操作==》挂载到container/页面上
    const { shapeFlag, props, type, children } = vnode;
    // 1、创建元素--记得把真实dom挂载到vnode上，方便后面更新时使用
    let el = (vnode.el = hostCreateElement(type));
    // 2、创建元素的属性
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    // 3、处理children
    if (children) {
      if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // console.log("这是文本字符串形式子节点：", children);
        hostSetElementText(el, children); // 文本形式子节点，比如这种情况：h('div',{},'张三')，将children直接插入到el中
      } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 递归渲染子节点
        // console.log("这是数组形式子节点：", children);
        mountChildren(el, children); // 数组形式子节点，比如这种情况：h('div',{},['张三',h('p',{},'李四')])，将children递归渲染插入到el中
      }
    }
    // 4、放入到对应的容器中
    hostInsert(el, container, anchor);
  };
  // 递归渲染子节点
  const mountChildren = (container, children) => {
    for (let i = 0; i < children.length; i++) {
      // children[i]两种情况：1、['张三']这种元素，字符串的形式；2、h('div',{},'张三')这种元素，对象的形式（vnode）
      // 但两种情况都需要转换成vnode来处理，方便借助patch函数来渲染
      const child = (children[i] = CVnode(children[i])); // 第一种情况转换成vnode，记得将children[i]重新赋值
      // 递归渲染子节点（vnode包含了元素、组件、文本三种情况）
      patch(null, child, container);
    }
  };

  /** ---------------处理文本--------------- */
  const processText = (n1, n2, container) => {
    if (n1 === null) {
      // 创建文本==>直接渲染到页面中（变成真实dom==>插入）
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    } else {
      // 更新文本
      if (n2.children !== n1.children) {
        const el = (n2.el = n1.el!); // el是上面初次创建的真实文本节点
        hostSetText(el, n2.children as string);
      }
    }
  };

  /**---------------------------------------------------------- */
  // 判断是否是同一个元素
  const isSameVnode = (n1, n2) => {
    return n1.type === n2.type && n1.key === n2.key;
  };
  // 卸载老的元素
  const unmount = (vnode) => {
    hostRemove(vnode.el);
  };

  // patch函数负责根据vnode的不同情况（组件、元素、文本）来实现对应的渲染
  const patch = (n1, n2, container, anchor = null) => {
    // diff算法
    // 1、判断是不是同一个元素
    if (n1 && n2 && !isSameVnode(n1, n2)) {
      // 卸载老的元素
      unmount(n1);
      n1 = null; // n1置空，可以重新走组件挂载了，即传给processElement的n1为null，走mountElement方法
    }
    // 2、如果是同一个元素，对比props、children，此时传给processElement的n1为老的vnode，走patchElement方法

    // 针对不同的类型采取不同的渲染方式（vonode有一个shapeFlag标识来标识组件/元素）
    const { shapeFlag, type } = n2;
    switch (type) {
      case TEXT:
        // 处理文本
        processText(n1, n2, container);
        break;
      default:
        // 等效于shapeFlag && shapeFlag === ShapeFlags.ELEMENT
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 处理元素(h函数)
          // console.log("此时处理的是元素！！！");
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 处理组件
          // console.log("此时处理的是组件！！！");
          processComponent(n1, n2, container);
        }
    }
  };

  // 真正实现渲染的函数（渲染vnode)
  const render = (vnode, container) => {
    // 第一次渲染（三个参数：旧的节点、当前节点、位置）
    patch(null, vnode, container);
  };

  // 返回一个具有createApp方法的对象，其中createApp负责生成一个具有mount挂载方法的app对象（包含属性、方法等），进而实现1、生成vnode；2、render渲染vnode
  return {
    createApp: apiCreateApp(render),
  };
}
