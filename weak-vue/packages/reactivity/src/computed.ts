import { isFunction } from "@vue/shared";
import { effect } from "./effect";

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

class ComputedRefImpl {
  public _dirty = true; // 控制使得获取时才去执行
  public _value; // 计算属性的值
  public effect; // 每个传入的getterOptions对应的effect高阶函数
  constructor(getter, public setter) {
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
