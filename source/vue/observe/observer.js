import { observe } from './index';
import { arrayMethods, observeArray } from './array';
import Dep from './dep'

function defineReactive(data, key, value) {
    observe(value);
    let dep = new Dep();
    Object.defineProperty(data, key, {
        get() {
            if (Dep.target) {
                // watcher 依赖收集 当前 dep
                dep.depend();
            }
            return value;
        },
        set(newValue) {
            if (newValue === value) return;
            observe(newValue);
            value = newValue;
            dep.notify();
        }
    })
}
export default class Observer {
    constructor(data) {
        // 专门为数组设定
        this.dep = new Dep();
        Object.defineProperty(data, '__ob__', {
            get: () => this
        })
        if (Array.isArray(data)) {
            // origin: data.__proto__ => arrayMethods => arrayMethods.__proto__ => Array.prototype
            data.__proto__ = arrayMethods;
            observeArray(data);
        } else {
            this.walk(data);
        }
    }
    walk(data) {
        Object.entries(data).forEach(([key, value]) => defineReactive(data, key, value));
    }
}

export {
    defineReactive,
}