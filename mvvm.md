## mvvm 名词解析
- `m`: `model` 数据模型，后端请求的数据，需要展示在页面视图中
- `v`: `view` 页面视图，`compiler` 编译绘图
- `vm`: `viewModel` 实现数据模型和视图的关联，数据发生改变就会通知视图更新

![执行流程](https://user-gold-cdn.xitu.io/2020/4/4/171441e3986c1de3?w=640&h=342&f=jpeg&s=28645)

![官方图](https://img2018.cnblogs.com/blog/940884/201809/940884-20180928112932636-201711232.png)

## 准备工作

### 初始化项目
```cmd
mkdir vue-mvvm
cd vue-mvvm
npm init -y
touch webpack.config.js
mkdir public && cd public && touch index.html 打包
cd ..
mkdir source && cd source && mkdir vue 手写源码的目录
cd ..
mkdir src && cd src && touch index.js 打包入口文件
```

### 下载依赖包
项目以 `webpack-dev-server` 开发
```bash
npm i webpack webpack-cli webpack-dev-server html-webpack-plugin 
```


### webpack.config.js
```js
const path = require('path');
const resolve = (...args) => path.resolve(__dirname, ...args);
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: resolve('src', 'index.js'),
    output: {
        filename: '[name].js',
        path: resolve('dist'),
    },
    resolve: {
        extensions: ['.js'],
        modules: [resolve('source'), resolve('node_modules')]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: resolve('public/index.html'),
        }),
    ],
    // watch: true,
    watchOptions: {
        // ignored: /node_modules/,
        // aggregateTimeout: 300,
        // poll: 1000,
    },
    devServer: {
        // hot: true,
        // open: true,
    }
}
```

### package.json
```json
"scripts": {
    "dev": "webpack-dev-server",
    "start": "webpack"
  },
```

### src/index.js
```js
import Vue from 'vue';
debugger;
let vm = new Vue({
    el: '#app',
    data() {
        return {
            name: "xiangju",
            arr: [1,2,3],
            firstName: '123',
            lastName: '999'
        }
    },
    computed: {
        fullName() {
            return this.firstName + this.lastName;
        }
    },
    watch: {
        firstName(newValue) {
            console.log(newValue);
        },
        name(newValue) {
            console.log('更新 name: ', newValue)
        }
    },
})

setTimeout(() => {
    vm.name = 1;
    vm.name = 2;
    vm.name = 3;
    vm.arr.push(4);
}, 1000)
// vm.obj.age = { number: 1 }
// console.log(vm);
```

## 源码实现
### index.js
```js
import { initState } from './observe';
import Watcher from './observe/watcher';
import { compiler } from './utils';

function Vue(options) {
    this._init(options);
}

Vue.prototype._init = function (options) {
    let vm = this;
    vm.$options = options;

    initState(vm);

    vm.$options.el && vm.$mount();
}

Vue.prototype.$mount = function () {
    let vm = this;
    let el = vm.$options.el;
    el = vm.$el = query(el);

    let updateComponent = () => {
        vm._update();
    };
    new Watcher(vm, updateComponent);
}

Vue.prototype.$watch = function (expr, handler, opts) {
    let vm = this;
    new Watcher(vm, expr, handler, { user: true, ...opts });
}   

Vue.prototype._update = function (vnode) {
    let node = document.createDocumentFragment();
    let firstChild;
    while (firstChild = el.firstChild) {
        node.appendChild(firstChild);
    }
    // compiler
    compiler(node, vm);
    el.appendChild(node);
}

function query(el) {
    if (typeof el === 'string') {
        return document.querySelector(el);
    }
    return el;
}

export default Vue;
```

### utils.js
```js
// ?: 匹配不捕获，不不会当前分组
// + 至少一个
// ? 尽可能少
const defaultRE = /\{\{((?:.|\r?\n)+?)\}\}/g;

const util = {
    getValue(vm, expr) {
        let keys = expr.split('.'); // [ obj, age ]
        return keys.reduce((memo, current) => {
            current = current.trim();
            memo = memo[current];
            return memo;
        }, vm)
    },
    compilerText(node, vm) {
        if (!node.expr) {
            node.expr = node.textContent;
        }
        node.textContent = node.expr.replace(defaultRE, (...args) => {
            return util.getValue(vm, args[1]);
        });
    }
}

function compiler(node, vm) {
    let childNodes = node.childNodes;
    [...childNodes].forEach(child => {
        if (child.nodeType == 1) {
            compiler(child, vm);
        } else if (child.nodeType == 3) {
            util.compilerText(child, vm);
        }
    });

}

export {
    compiler,
    util,
}
```



### observe/index.js
```js
import Observer from './observer';
import Watcher from './watcher';
import Dep from './dep';

function initState(vm) {
    let opts = vm.$options;

    opts.data && initData(vm);
    opts.computed && initComputed(vm, opts.computed);
    opts.watch && initWatch(vm);
}

function observe(data) {
    if (typeof data !== 'object' || data == null) return;
    if (data.__ob__) return data.__ob__;
    return new Observer(data);
}

function proxy(vm, source, key) {
    Object.defineProperty(vm, key, {
        get() {
            return vm[source][key];
        },
        set(newValue) {
            vm[source][key] = newValue;
        },
    })

}

function initData(vm) {
    let data = vm.$options.data; 
    data = vm._data = typeof data === 'function' ? data.call(vm) : data || {};
    // proxy vm.key => vm._data.key
    Object.keys(data).forEach(key => proxy(vm, "_data", key));
    // observe
    observe(data);
}

function createComputedGetter(vm, key) {
    let watcher = vm._watchersComputed[key];
    return function() {
        if (watcher) {
            if (watcher.dirty) {
                watcher.evaluate();
            }
            if (Dep.target) {
                watcher.depend();
            }
            return watcher.value;
        }
    }
}

function initComputed(vm, computed) {
    let watchers = vm._watchersComputed = Object.create(null);
    Object.keys(computed).forEach(key => {
        let userDef = computed[key];
        watchers[key] = new Watcher(vm, userDef, () =>{}, {lazy: true });
        Object.defineProperty(vm, key, {
            get: createComputedGetter(vm, key)
        })
    })
}

function initWatch(vm) {
    let watch = vm.$options.watch;
    Object.keys(watch).forEach(key => {
        let userDef = watch[key];
        let handler = userDef;
        if (userDef.handler) {
            handler = userDef.handler;
        }
        createWatcher(vm, key, handler, { immediate: userDef.immediate })
    })
}

function createWatcher(vm, key, handler, opts){
    return vm.$watch(key, handler, opts);
}

export {
    initState,
    observe,
}
```

### observe/observer.js
- 实现数据劫持
- 收集依赖，即当前 `watcher` 所依赖的数据有哪些
- 数据变化时，就会触发 `Dep.notify`, 通知依赖数据的 `watcher.update` 

```js
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
            get: () =>  this
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
```

### observe/watcher.js
```js
import { pushTarget, popTarget } from './dep';
import { nextTick } from './nextTick';
import { util } from '../utils';

let id = 0;

export default class Watcher {
    /**
     * 
     * @param {*} vm 当前组件实例
     * @param {*} exprOrFn 可能是 updateComponent or express 
     * @param {*} cb 用户传入的 callback vm.$watch('msg', cb)
     * @param {*} opts 
     */
    constructor(vm, exprOrFn, cb = () => { }, opts = {}) {
        this.vm = vm;
        this.exprOrFn = exprOrFn;
        if (typeof exprOrFn === 'function') {
            this.getter = exprOrFn;
        } else {
            this.getter = function() {
                return util.getValue(vm, exprOrFn);
            }
        }
        if (opts.user) {
            this.user = true;
        }
        this.lazy = opts.lazy;
        this.dirty = this.lazy;
        this.cb = cb;
        this.deps = [];
        this.depsId = new Set();
        this.opts = opts;
        this.id = id++;
        this.immediate = opts.immediate;
        this.value = this.lazy ? undefined : this.get();
        this.get();
    }

    evaluate() {
        this.value = this.get();
        this.dirty = false;
    }

    get() {
        // 渲染 watcher Dep.target = watcher  
        // msg 变化了 需要让这个 watcher 重新执行
        pushTarget(this);
        let value = this.getter && this.getter.call(this.vm);
        popTarget();
        return value;
    }

    addDep(dep) {
        let id = dep.id;
        if (!this.depsId.has(id)) {
            this.depsId.add(id);
            this.deps.push(dep);
            dep.addSub(this);
        }
    }

    depend() {
        let i = this.deps.length;
        while(i--) {
            this.deps[i].depend();
        }
    }

    update() {
        // this.get();
        if (this.lazy) {
            this.dirty = true;
        } else {
            queueWatcher(this);
        }
    }

    run() {
        let value = this.get();
        if (this.value !== undefined) {
            this.cb(value, this.value);
        }
        // this.get();
    }
}

let has = {};
let queue = [];

// 异步批量更新
function flushQueue() {
    queue.forEach(watcher => watcher.run());
    has = {};
    queue = [];
}

function queueWatcher(watcher) {
    let id = watcher.id;
    if (has[id] == null) {
        has[id] = true;
        queue.push(watcher);

        nextTick(flushQueue);
    }
}


```

### observe/dep.js
- 可以理解为观察者，观察数据的变化，并进行通知
```js
let id = 0;
export default class Dep {
    constructor() {
        this.id = id++;
        this.subs = [];
    }

    addSub(watcher) {
        this.subs.push(watcher);
    }

    notify() {
        this.subs.forEach(watcher => watcher.update());
    }

    depend() {
        if (Dep.target) {
            Dep.target.addDep(this);
        }
    }
}

let stack = [];

function pushTarget(watcher) { 
    Dep.target = watcher;
    stack.push(watcher);
}

function popTarget() {
    stack.pop();
    Dep.target = stack[stack.length - 1];
}

export {
    pushTarget,
    popTarget,
}
```

### observe/nextTick.js
- `$nextTick` 实现机制
- 浏览器的事件环

```js
let callbacks = [];
function flushCallbacks() {
    callbacks.forEach(cb => cb());
}
export function nextTick(cb) {
    callbacks.push(cb);
    let timerFunc = () => flushCallbacks();

    if (Promise) {
        return Promise.resolve().then(timerFunc);
    }
    if (MutationObserver) {
        let observer = new MutationObserver(timerFunc);
        let textNode = document.createTextNode(1);
        observer.observe(textNode, { characterData: true });
        textNode.textContent = 2;
        return;
    }

    if (setImmediate) {
        return setImmediate(timerFunc);
    }
    setTimeout(timerFunc, 0);
}
```

### observe/array.js
- 数组的数据劫持

```js
import { observe } from '.';
const oldArrayPrototypeMethods = Array.prototype;

// arrayMethods.__proto__ = Array.prototype
const arrayMethods = Object.create(oldArrayPrototypeMethods);
const methods = ['push', 'pop', 'unshift', 'shift', 'sort', 'reverse', 'splice'];

methods.forEach(method => {
    arrayMethods[method] = function (...args) {
        let r = oldArrayPrototypeMethods[method].call(this, ...args);
        let inserted;
        switch (method) {
            case 'push': 
            case 'unshift':
                inserted = args;
                break;
            case 'splice':
                inserted = args.slice(2);
                break;
            default:
                break;
        }
        if (inserted) observeArray(inserted);
        console.log(this);
        this.__ob__.dep.depend();
        return r;
    }
})

function observeArray(data) {
    data.forEach(key => observe(key));
}

function dependArray(value) {
    // 递归收集数组中的依赖
    value.forEach(currentItem => {
        currentItem.__ob__ && currentItem.__ob__.dep.depend();
        if (Array.isArray(currentItem)){
            dependArray(currentItem);
        }
    })
}

export {
    arrayMethods,
    observeArray,
    dependArray,
}
```



### 总结
- 数据劫持实现，用到 `Object.defineProperty` 支持 IE8 
- 数据进来不要多级嵌套，递归性能消耗
- 对象新增属性无法监控

`watch` vs `computed`
- 二者都是在内部 `new Watcher`
- `computed` 计算属性默认不执行，当依赖值变化后，更新 `dirty` 为 `true`，数据不变，就不会重新计算值，有缓存。
- `watch` 不能放在模板，通常放监控的逻辑。
