import { Track, trigger } from "./effect";
import { TrackOpType, TriggerOpType } from "./operations";
import { hasChange, isArray } from "@vue/shared";

// 普通ref代理
export function ref(target) {
  return createRef(target);
}

// 如果target是一个对象，则浅层代理
export function shallowRef(target) {
  return createRef(target, true);
}

// 创建ref类
class RefImpl {
  // 给实例添加一些公共属性（实例对象都有的，相当于this.XXX = XXX）
  public __v_isRef = true; // 用来表示target是通过ref实现代理的
  public _value; // 值的声明
  constructor(public rawValue, public shallow) {
    // 参数前面添加public标识相当于在构造函数调用了this.target = target,this.shallow = shallow
    this._value = rawValue; // 用户传入的值赋给_value
  }

  // 响应式的实现需要借助两个方法：收集依赖（Track）和触发更新（trigger）。
  // 借助类的属性访问器实现value属性的访问以及更改
  get value() {
    Track(this, TrackOpType.GET, "value"); // get的时候实现依赖收集
    return this._value;
  }
  set value(newValue) {
    // 如果值已变，则赋新值并触发更新
    if (hasChange(newValue, this._value)) {
      this._value = newValue;
      this.rawValue = newValue;
      trigger(this, TriggerOpType.SET, "value", newValue);
    }
  }
}

// 创建ref实例对象(rawValue表示传入的目标值)
function createRef(rawValue, shallow = false) {
  return new RefImpl(rawValue, shallow);
}

class ObjectRefImlp {
  public __v_isRef = true; // 用来表示target是通过ref实现代理的
  constructor(public target, public key) {}

  // 获取值
  get value() {
    return this.target[this.key];
  }
  // 设置值
  set value(newValue) {
    this.target[this.key] = newValue;
  }
}

// 创建toRef对象
export function toRef(target, key) {
  return new ObjectRefImlp(target, key);
}

// 实现toRefs
export function toRefs(target) {
  // 判断是否为数组
  let ret = isArray(target) ? new Array(target.length) : {};
  // 遍历target对象的每个属性key
  for (const key in target) {
    ret[key] = toRef(target, key); // 每个属性都有自己的toRef实例对象
  }

  return ret;
}
