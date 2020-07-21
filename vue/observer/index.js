import { isObject, def } from '../util';
import { arrayMethods } from './array-methods';

class Observer {
    constructor(value) {
        // 供数组内部定义响应式数据时，获取 observeArray
        // value.__ob__ = this; // 会死循环，walk 时会拿到 __ob__
        def(value, '__ob__', this);
        // value 数组，索引不需要观测，导致性能问题
        if (Array.isArray(value)) {
            // Object.setPrototypeOf(value, arrayMethods);
            value.__proto__ = arrayMethods;
            this.observeArray(value);
        } else {
            // value 是对象
            this.walk(value);
        }
        
    }

    observeArray(arr) {
        arr.forEach(item => observe(item));
    }

    walk(obj) {
        Object.entries(obj).forEach(([key, value]) => defineReactive(obj, key, value));
    }
}

function defineReactive(obj, key, value) {
    observe(value);
    Object.defineProperty(obj, key, {
        get(){
            return value;
        },
        set(newValue) {
            if (newValue === value) return;
            observe(newValue);
            value = newValue;
        }
    })
}

export function observe(value) {
    if (!isObject(value)) return 
    return new Observer(value);
}