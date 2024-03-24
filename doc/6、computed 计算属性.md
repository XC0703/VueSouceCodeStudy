## 6-1 computed 的基本使用和特性

`computed` 为计算属性，主要用于对 `Vue` 实例的数据进行动态计算，且具有缓存机制，只有在相关依赖发生改变时才会重新计算。这种特性使得计算属性非常适合用于处理模板中的逻辑。

> 接受一个 getter 函数，返回一个只读的响应式 ref 对象。该 ref 通过 .value 暴露 getter 函数的返回值。它也可以接受一个带有 get 和 set 函数的对象来创建一个可写的 ref 对象。

`computed` 的基本特性如下：

```html
<!-- weak-vue\packages\examples\6.computed.html -->
<div id="app">{{age}}</div>
<script>
  // 特性1：computed计算属性，如果没有被使用，则不会触发里面的方法（懒执行）
  let { reactive, effect, ref, computed } = Vue;
  let age = ref(10);
  let myAge = computed(() => {
    console.log("666");
    return age.value + 20;
  });

  // 特性2：两次使用myAge.value，但也只会打印一次666，因为计算的数据没有被改变，存在缓存机制
  // 打印结果：连续打印两次30，但只打印一次666
  console.log(myAge.value);
  console.log(myAge.value);

  // 特性3：此时响应式数据虽然改变了，但是没有重新被使用，依旧不会触发里面的方法
  setTimeout(() => {
    age.value = 20;
    // console.log(myAge.value); // 再次使用到了，打印出40和6666
  }, 1000);
</script>
```

## 6-2 computed 的基本实现

### 6-2-1 获取 computed 的值

我们主要根据上面我们提到的基本使用和特性来实现 `computed`。首先我们实现一个 `computed` 函数，接收传过来的参数（可能是函数（`此时只能读不能写`），也可能是对象(`{get{}、set{}})`），并返回一个 `ref` 实例对象。

```typescript
// weak-vue\packages\reactivity\src\computed.ts
export function computed(getterOptions) {
  // 注意，传过来的可能是函数（此时只能读不能写），也可能是对象({get{}、set{}})
  let getter;
  let setter;
  if (isFunction(getterOptions)) {
    getter = getterOptions;
    setter = () => {
      console.warn("computed value must be readonly");
    };
  } else {
    getter = getterOptions.get;
    setter = getter.set;
  }

  return new ComputedRefImpl(getter, setter);
}
```

### 6-2-2 实现 computed

此时再去实现我们的 `ComputedRefImpl` 类，需要借助我们前面实现过的 `effect` 方法实现（传入 `fn` 和对应的 `effect` 配置，每个 `fn` 都有自己的 `effect` 高阶函数，可以进行依赖收集与触发更新），传入的 `getterOptions` 也要有自己的 `effect` 高阶属性，用于控制 `getterOptions` 执行与否。

这里由于需要实现不使用时不会触发 `computed` 里面的方法（懒执行），也就是不能让 `effect` 高阶函数默认去执行因此需要配置 `lazy` 属性。同时借助`_dirty` 属性控制使得获取时才去执行：

```typescript
// weak-vue\packages\reactivity\src\computed.ts
class ComputedRefImpl {
  public _dirty = true; // 控制使得获取时才去执行
  public _value; // 计算属性的值
  public effect; // 每个传入的getterOptions对应的effect高阶函数
  constructor(getter, public setter) {
    this.effect = effect(getter, {
      lazy: true, // 实现特性1
    });
  }

  // 获取值的时候触发依赖（实现特性1）
  get value() {
    if (this._dirty) {
      this._value = this.effect(); // 此时里面的方法执行，this._value的值就是getterOptions返回return的结果，因此需要this.effect()返回的结果是就是用户传入的fn执行返回的结果（weak-vue\packages\reactivity\src\effect.ts里面改为return fn())
      this._dirty = false; // 这个是为了实现缓存机制，再去获取值的时候，直接返回旧的value即可（实现特性2）
    }
    return this._value;
  }

  set value(newValue) {
    this.setter(newValue);
  }
}
```

此时去执行我们的测试用例：

```html
<!-- weak-vue\packages\examples\6.computed.html -->
<script>
  // 特性1：computed计算属性，如果没有被使用，则不会触发里面的方法（懒执行）
  let { reactive, effect, ref, computed } = VueReactivity;
  let age = ref(10);
  let myAge = computed(() => {
    console.log("computed里面的方法被触发了！！！");
    return age.value + 20;
  });

  // 特性2：两次使用myAge.value，但也只会打印一次666，因为计算的数据没有被改变，存在缓存机制
  // 打印结果：连续打印两次30，但只打印一次666
  console.log(myAge.value);
  console.log("computed里面的方法不会被触发了！！！这是旧的结果！！！");
  console.log(myAge.value);

  //   // 特性3：此时响应式数据虽然改变了，但是没有重新被使用，依旧不会触发里面的方法
  //   setTimeout(() => {
  //     age.value = 20;
  //     // console.log(myAge.value); // 再次使用到了，打印出40和6666
  //   }, 1000);
</script>
```

可以看到结果符合预期：![image.png](../md_images/doc6.1.png)

说明我们的前两个特性已经实现了，还差最后一个赋新值时表现出来的特性（**响应式数据改变了，但是没有重新被使用，依旧不会触发里面的方法，使用到则触发**）。

现在的情况是执行一次 `computed` 里面的方法之后，`this._dirty` 变成已经改为 `false` 了，如果需要重新执行，则需要将该状态变量改为 `true`。

由于 `computed` 计算属性是 `readonly` 的，因此不能在 `set value(){}`里面进行相关操作，而是在 `effect` 里面进行操作。用一个 `sch` 函数使得 `this._dirty = true`，然后 `effectSet` 触发更新时执行（可以回去重新梳理一下 `weak-vue\packages\reactivity\src\effect.ts`的逻辑）。

```typescript
// weak-vue\packages\reactivity\src\computed.ts
  constructor(getter, setter) {
    this.effect = effect(getter, {
      lazy: true, // 实现特性1
      sch: () => {
        // 实现特性3，修改数据时使得有机会被重新执行
        if (!this._dirty) {
          this._dirty = true;
        }
      },
    });
  }
```

```typescript
// weak-vue\packages\reactivity\src\computed.ts
effectSet.forEach((effect: any) => {
  if (effect.options.sch) {
    effect.options.sch(effect); // 用于实现computed计算属性的特性3，触发更新时使得this._dirty = true，以便执行computed里面的方法
  } else {
    effect();
  }
});
```

---

自此，我们关于 `computed` 的基本实现就结束了，到这里的源码请看提交记录：[6、computed 计算属性](https://github.com/XC0703/VueSouceCodeStudy/commit/2a10e665a716ac0bb7485f2706f040ea04c9b4c9)。
