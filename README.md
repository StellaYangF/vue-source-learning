# Vue2.x 源码学习记录

本节是关于 Vue 模板的初次渲染

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

### compiler 编译 template 为 render function

相关方法

* compileToFunction
* parseHTML
* generate

编译后结果大概长这样子的：
```js
anonymous() {
with(this) { return _c("div",{id:"app"},_v(_s(name)),_c("p",undefined,_v(_s(age)))
    )
    }
}
```

compileToFunction

```js
import { parseHTML } from './parse-html';
import { generate } from './generate';

export function compileToFunction(template) {
    // html 字符串 => ast 语法树
    let root = parseHTML(template);
    let code = generate(root);
    let renderFn = new Function(`with(this) { return ${code} }`);

    return renderFn;
    // _c("div",{id:app},_c("p",undefined,_v('hello' + _s(name) )),_v('hello'))
}
```

parseHTML

```js
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // abc-aaa
const qnameCapture = `((?:${ncname}\\:)?${ncname})`; // <aaa:asdads>
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 标签开头的正则 捕获的内容是标签名
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签结尾的 </div>
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性的
const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的 >  <div>

export function parseHTML(html) {

    let root = null; // ast语法树的树根
    let currentParent; // 标识当前父亲是谁
    let stack = [];
    const ELEMENT_TYPE = 1;
    const TEXT_TYPE = 3;

    function createASTElement(tagName, attrs) {
        return {
            tag: tagName,
            type: ELEMENT_TYPE,
            children: [],
            attrs,
            parent: null
        }
    }

    function start(tagName, attrs) {
        // 遇到开始标签 就创建一个ast元素s
        let element = createASTElement(tagName, attrs);
        if (!root) {
            root = element;
        }
        currentParent = element; // 把当前元素标记成父ast树
        stack.push(element); // 将开始标签存放到栈中
    }

    function chars(text) {
        text = text.replace(/\s/g, '');
        if (text) {
            currentParent.children.push({
                text,
                type: TEXT_TYPE
            })
        }
    }

    function end(tagName) {
        let element = stack.pop(); // 拿到的是ast对象
        // 我要标识当前这个p是属于这个div的儿子的
        currentParent = stack[stack.length - 1];
        if (currentParent) {
            element.parent = currentParent;
            currentParent.children.push(element); // 实现了一个树的父子关系
        }
    }
    // 不停的去解析html字符串
    while (html) {
        let textEnd = html.indexOf('<');
        if (textEnd == 0) {
            // 如果当前索引为0 肯定是一个标签 开始标签 结束标签
            let startTagMatch = parseStartTag(); // 通过这个方法获取到匹配的结果 tagName,attrs
            if (startTagMatch) {
                start(startTagMatch.tagName, startTagMatch.attrs); // 1解析开始标签
                continue; // 如果开始标签匹配完毕后 继续下一次 匹配
            }
            let endTagMatch = html.match(endTag);
            if (endTagMatch) {
                advance(endTagMatch[0].length);
                end(endTagMatch[1]); // 2解析结束标签
                continue;
            }
        }
        let text;
        if (textEnd >= 0) {
            text = html.substring(0, textEnd);
        }
        if (text) {
            advance(text.length);
            chars(text); // 3解析文本
        }
    }

    function advance(n) {
        html = html.substring(n);
    }

    function parseStartTag() {
        let start = html.match(startTagOpen);
        if (start) {
            const match = {
                tagName: start[1],
                attrs: []
            }
            advance(start[0].length); // 将标签删除
            let end, attr;
            while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
                // 将属性进行解析
                advance(attr[0].length); // 将属性去掉
                match.attrs.push({
                    name: attr[1],
                    value: attr[3] || attr[4] || attr[5]
                });
            }
            if (end) { // 去掉开始标签的 >
                advance(end[0].length);
                return match
            }
        }
    }
    return root;
}
```

generate

```js
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;

function genProps(attrs){ // 处理属性 拼接成属性的字符串
    let str = '';
    for(let i = 0; i < attrs.length;i++){
        let attr = attrs[i];
        if(attr.name === 'style'){
            // style="color: red;fontSize:14px" => {style:{color:'red'},id:name,}
            let obj = {};
            attr.value.split(';').forEach(item=>{
                let [key,value] = item.split(':');
                obj[key] = value
            });
            attr.value = obj;
        }
        str+= `${attr.name}:${JSON.stringify(attr.value)},`
    }
    return `{${str.slice(0,-1)}}`
}

function genChildren(el){
    let children = el.children;
    if(children && children.length > 0){
        return `${children.map(c=>gen(c)).join(',')}`
    }else{
        return false;
    }
}

function gen(node){
    if(node.type == 1){
        // 元素标签
        return generate(node);
    }else{ // 3 文本内容
        let text = node.text; //   <div>a {{  name  }} b{{age}} c</div>
        let tokens = [];
        let match,index;
        // 每次的偏移量 buffer.split()
        let lastIndex = defaultTagRE.lastIndex = 0; // 只要是全局匹配 就需要将lastIndex每次匹配的时候调到0处
        while(match = defaultTagRE.exec(text)){
            index = match.index;
            if(index > lastIndex){
                tokens.push(JSON.stringify(text.slice(lastIndex,index)));
            }
            tokens.push(`_s(${match[1].trim()})`);
            lastIndex = index + match[0].length;
        }
        if(lastIndex < text.length){
            tokens.push(JSON.stringify(text.slice(lastIndex)))
        }
        return `_v(${tokens.join('+')})`;
    }
}
export function generate(el){ // [{name:'id',value:'app'},{}]  {id:app,a:1,b:2}
    let children = genChildren(el);
    let code = `_c("${el.tag}",${
       el.attrs.length?genProps(el.attrs):'undefined'
    }${
        children? `,${children}` :''
    })
    `
    return code;
}
```

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

observe/index

```js
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
```

observe/array-methods

```js
const arrayProto = Array.prototype;

const methods = ['unshift', 'shift', 'push', 'pop', 'reverse', 'sort', 'splice'];

export const arrayMethods = Object.create(arrayProto);

methods.forEach(method => {
    arrayMethods[method] = function(...args) {
        const result = arrayProto[methods].call(this, ...args);
        let inserted;
        switch(method) {
            case 'push':
                inserted = args;
                break;
            case 'unshift':
                inserted = args;
                break;
            case 'splice':
                inserted = args.splice(2);
                break;
            default:
                break;
        }
        if (inserted) {
            this.__ob__.observeArray(inserted);
        }
        return result;
    }
});
```

## 挂载组件

### 流程

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

### 实现

$mount
```js
function $mount(el) {
    const vm = this;
    const options = vm.$options;
    el = document.querySelector(el);

    if (!options.render) {
        let template = options.template;
        if (!template) {
            template = el.outerHTML;
        }
        const render = compileToFunction(template);
        // console.log(render);
        // _c("div",{id:app},_c("p",undefined,_v('hello' + _s(name) )),_v('hello'))
        options.render = render;
    }

    mountComponent(vm, el);
}
```

lifecycle
```js
import Watcher from './observer/watcher';
import { patch } from './vdom/patch';

export function callHook(vm, hook) {
    const handlers = vm.$options[hook];
    if (handlers) {
        handlers.forEach(cb => cb.call(vm));
    }
}

export function mountComponent(vm, el) {
    const options = vm.$options;
    vm.$el = el; // 真实 DOM 元素

    // 渲染
    const updateComponent = () => {
        vm._update(vm._render()); // VNode
    }
    
    // 这里的回调 () => {} 是指 watch: 定义的监听函数
    new Watcher(vm, updateComponent, () => {}, true)
}

export function lifecycleMixin(Vue) {
    Vue.prototype._update = function(vnode) {
        const vm = this;
        vm.$el = patch(vm.$el, vnode);
        console.log(vnode);
    }
}
```

render
```js
import { createElement, createTextNode } from './vdom/create-element';

export function renderMixin(Vue) {
    Vue.prototype._c = function() {
        //  return _c("div",{id:"app"},_v(_s(name)))
        return createElement(...arguments);// tag, data, children
    }
    Vue.prototype._v = function(text) {
        return createTextNode(text);
    }
    Vue.prototype._s = function(val) {
        return val == null ? '': typeof val === 'object' ? JSON.stringify(val): val;
    }
    Vue.prototype._render = function() {
        const vm = this;
        const { render } = vm.$options;
        /*anonymous() {
            with(this) { return _c("div",{id:"app"},_v(_s(name)),_c("p",undefined,_v(_s(age)))
                )
                }
            }
        */
        // 绑定 this 指向 
        // _c : createVnode
        // _v : create text
        // _s : JSON.stringify()
        const vnode = render.call(vm);
        return vnode;
        // {tag: "div", data: {…}, key: undefined, children: Array(2), text: undefined}
        // { tag, data, key, children, text }
    }
}
```

## vnode 根据虚拟 DOM 创建真实 DOM

### 流程

* create-element
    * createElement
    * createTextNode
    * vnode
* patch 可用于初次渲染或试图更新
    * patch
    * createEle
    * updateProperties

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

