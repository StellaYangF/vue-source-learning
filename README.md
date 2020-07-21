# Vue2.x 源码学习记录

## new Vue 流程

### 流程

* 调用构造函数，传入 options
* 混入初始化原型方法
* 混入生命周期
* 混入渲染
* 混入静态 API

### 实现

```js
/* 简化版本 */
import { initMixin } from './init';
import { lifecycleMixin } from './lifecycle';
import { renderMixin } from './render';
import { initGlobalAPI } from './globalAPI';

function Vue(options) {
    this._init(options);
}

initMixin(Vue);
lifecycleMixin(Vue);
renderMixin(Vue);

initGlobalAPI(Vue);
export default Vue;
```

> 这里的 this._init 是由下面要提到的 initMixin 混入添加的。值得注意的是，Vue 的原型方法都是通过混入方式添加，功能集中在特定文件中。

## initMixin 初始化混入方法

### 工作流

* 为 Vue 原型对象添加 **_init**, **$mount**, **$nextTick** 方法
* 为 Vue 实例添加 **$options** 属性
* 执行钩子函数 **beforeCreate**，此前已初始化好了 Events 和 Lifecycle 
* 初始化状态
* 执行钩子函数 **created**，此前已初始化好了 injections 和 reactivity
* 根据 options.el 是否传入，调用 $mount 原型方法，内部需要初始化好 options.render(instance.$options.render)
* 渲染并挂载组件

### 实现

initMixin

```js
import { mergeOptions } from './util/index';
import { callHook, mountComponent } from './lifecycle';
import { initState } from './state';
import { nextTick } from './util/next-tick';

export function initMixin(Vue) {
    Vue.prototype._init = function(options) {
        const vm = this;

        vm.$options = mergeOptions(vm.constructor.options, options);

        // 已初始化 Events 和 Lifecycle 生命周期
        callHook(vm, 'beforeCreate');

        initState(vm);
        
        // 已初始化好 injections注入 和 reactivity 响应式数据
        callHook(vm, 'created');
        
        if (vm.options.el) {
            this.$mount(vm.options.el);
        }
    }

    Vue.prototype.$mount = function(el) {
        const vm = this;
        const options = vm.options;
        el = document.querySelector(el);

        // 判断 render 是否传入
        if (!options.render) {
            let template = options.template;
            // 判断 template 是否传入
            if (!template) {
                // 最后用 el 内部内容作为模板
                template = el.outerHTML;
            }
            const render = compileToFunction(template);
            options.render = render;
        }

        mountComponent(vm, el);
    }

    Vue.prototype.$nextTick = nextTick
}
```


## mergeOptions 合并属性

执行 **._init** 时，内部会将 Vue.constructor 和传入的 options 进行合并。

```js
const LIFECYCLE_HOOKS = [
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted',
    'beforeUpdate',
    'updated',
    'beforeDestroy',
    'destroyed',
];

let strats = {};

LIFECYCLE_HOOKS.forEach(hook => strats[hook] = mergeHook)

function mergeHook(parentVal, childVal) {
    if (childVal) {
        if (parentVal) {
            return parentVal.concat(childVal);
        } else {
            return [childVal];
        }
    } else {
        return parentVal;
    }
}

export default  function mergeOptions(parent = {}, child) {
    const options = {};
    Object.keys(parent).forEach(mergeField);
    debugger
    Object.keys(child).forEach(key => parent.hasOwnProperty(key) || mergeHook(key));
    
    function mergeField(key) {
        if (strats[key]) {
            return options[key] = strats[key](parent[key], child[key])
        }
        if (typeof parent[key] === 'object' && typeof child[key] === 'object') {
            options[key] = {
                ...parent[key],
                ...child[key],
            }
        } else if (child[key] === null) {
            options[key] = parent[key];
        } else {
            options[key] = child[key];
        }
    }

    return options;
}
```

## options.render 函数

这里需要判断开发者是否提供了 render 函数，分三种情况来看

* 检测 options.render 是否存在，如果有，不用额外操作；
* 如果没有，就获取 options.template 模板编译成渲染函数 render function；
* 如果没有 options.template ，就采用 el.outerHTML 模板编译生成渲染函数。

> 提示：开发时最好提供 render 函数，否则 Vue 内部需要多走一步，首先要把 template 通过 parseHTML 方法结合正则表达式，转成 ast 语法树，再通过 generate 函数调用转成 render function。

## initState 初始化数据

### 流程

在执行 ._init 方法时执行 initState 时内部会依次进行初始化

* initProps
* initMethods
* initData
* initComputed
* initWatch

### 实现

```js
import { observe } from './observer';

export function initState(vm) {
    const opts = vm.$options;

    if (opts.props) initProps(vm);
    if (opts.methods) initMethods(vm);
    if (opts.data) initData(vm);
    if (opts.computed) initComputed(vm);
    if (opts.watch) initWatch(vm);
}

function initProps() {}

function initMethods() {}

function initData(vm) {
    let data = vm.$options.data;
    data = vm._data = typeof data === 'function' ? data.call(vm) : data;
    
    observe(data);

}

function initComputed() {}

function initWatch() {}

```

## observe 响应式核心

核心就是 `Object.defineProperty`，不兼容 IE8 及以下版本

* 简单数据直接返回，不需要数据劫持
* 已被定义为响应式数据的，返回其对应的 Observer 实例，不需要再次劫持
* 交给 Observer 构造函数进行处理
* 对象数据，需要对每个键对应的值进行 observe，同时也要对修改的值进行 observe，用户设置的值可能是对象
* 数组数据，需要对每个元素观测，下标一般不观测，重写变异的 API 即可，包括 unshift, shift, pop, push, reverse, sort, splice 。但是 arr[0] = newVal 这种方式改值就无效了
* 给每个待观测的指针上，添加一个 **__ob__**，指向 Observer 实例，以便在数组劫持时，能获取到实例方法的 **observeArray**


### 流程

* vm_data 保存用户传入的 data 值
* observe(data) 实现响应式数据

### 实现

```js

```

## 挂载组件

* $mount
* mountComponent
* updateComponent()=>{vm._update(vm._render)}
    * 执行 options.render 是传入的 render 函数或者是一个经过 parseHTML 和 generate 生成的 匿名函数（）
    * vm._render 在 renderMixin 混入，同时还包括 vm._c, vm._v, vm._s，返回
    * vm._update 更新或者初渲染 vm.$el = patch(oldVnode, vnode)
    * patch 会递归创建真实节点，替换掉老节点
    * vnode 上映射真实 dom，方便后续操作：vnode.el，也就是 vnode 上新增一个 el 属性
    * 递归创建子真实节点，并挂载到 el 上
    * 根据 tag 创建元素
    * 根据 data 更新属性 updateProperties

```js
```

## 生命周期

钩子函数执行前后，会触发一些操作，流程如下：

* beforeCreate: 已初始化 events 和 lifecycle
* created: 已初始化 injections 和 reactivity
* beforeMount: 已准备好 render function 需要分三种情况
* mounted: 已挂载组件到页面中，实例上已有 vm.$el，并用 $el 替换之前的 el
* beforeUpdate
* updated
* beforeDestroy：
* destroyed: 已销毁 watchers, child components, event listeners
* activated：被 keep-alive 缓存的组件激活时调用
* deactivated：被 keep-alive 缓存的组件停用时调用

> 注意：在 SSR 时，只有 `beforeCreate` 和 `created` 会在服务器端渲染 (SSR) 过程中被调用。

## initState 初始化状态

* initData(vm)
* initComputed(vm)
* initWatch(vm)

