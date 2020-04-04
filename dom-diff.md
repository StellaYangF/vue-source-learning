## domDiff 
- 渲染优化
- `vnode`: virtual dom (虚拟 DOM)包含属性
    - tag
    - props
    - key 
    - children
    - text
    - el： 真实 DOM
- 渲染前，新老 `vnode` 进行比对:
    - tag 不同
    - 内容文本不同
    - 属性不同
    - 正序相同
    - 倒序相同
    - 交叉头尾相同
    - 轮序
    - 新的子元素个数 > 老的子元素个数
    - 新的子元素个数 < 老的子元素个数

## DIFF 源码实现

### vdom/index.js
```js
import h from './h';
import { render, patch } from './patch';

export {
    h,
    render,
    patch,
}
```

### vdom/h.js
```js
import { vnode } from './create-element';

export default function h(tag, props, ...children) {
    if (arguments.length === 1) return vnodeEmpty(tag);
    let key = props.key;
    delete props.key;
    children = children.map(child => {
        if (typeof child === 'object') {
            return child;
        } else {
            return vnodeEmpty(child);
        }
    });
    return vnode(tag, props, key, children);
}

function vnodeEmpty(child) {
    return vnode(undefined, undefined, undefined, undefined, child);
}
```

### vdom/patch.js
```js
import h from './h';

function render(vnode, container) {
    let el = createElm(vnode);
    container.appendChild(el);
}

function createElm(vnode) {
    let { tag, props, key, children, text } = vnode;
    if (typeof tag === 'string') {
        vnode.el = document.createElement(tag);
        vnode.el.setAttribute('key', key);
        updateProperties(vnode);
        children.forEach(child => {
            return render(child, vnode.el);
        })
    } else { // 文本
        vnode.el = document.createTextNode(text);
    }
    return vnode.el;
}

function updateProperties(vnode, oldProps = {}) {
    let newProps = vnode.props || {};
    let el = vnode.el;

    let newStyle = newProps.style || {};
    let oldStyle = oldProps.style || {};
    

    Object.keys(oldStyle).forEach(key => {
        if (!newStyle[key]) {
            el.style[key] = '';
        }
    })

    Object.keys(oldProps).forEach(key => {
        if (!newProps[key]) {
            delete el[key];
        }
    })

    Object.keys(newProps).forEach(key => {
        if (key === 'style') {
            Object.entries(newProps.style).forEach(([styleName, value]) => {
                el.style[styleName] = value;
            })
        } else if (key === 'class') {
            el.className = newProps.class;
        } else {
            el[key] = newProps[key];
        }
    })
}

function patch(oldVnode, newVnode) {
    // 标签不同
    if (oldVnode.tag !== newVnode.tag) {
        oldVnode.el.parentNode.replaceChild(createElm(newVnode), oldVnode.el)
    }
    // 内容文本不同
    if (!oldVnode.tag) {
        if (oldVnode.text !== newVnode.text) {
            oldVnode.el.textContent = newVnode.text;
        }
    }
    // 标签相同
    //  属性不同
    let el = newVnode.el = oldVnode.el;
    updateProperties(newVnode, oldVnode.props);

    let oldChildren = oldVnode.children || [];
    let newChildren = newVnode.children || [];

    // 老有子，新有子
    if (oldChildren.length > 0 && newChildren.length > 0) {
        updateChildren(el, oldChildren, newChildren);
    } else if (oldChildren > 0) {
        el.innerHTML = '';
    }
}

function isSameVnode(oldVnode, newVnode) {
    return (oldVnode.tag === newVnode.tag) && (oldVnode.key === newVnode.key);
}


function updateChildren(parent, oldChildren, newChildren) {

    let newStartIndex = 0;
    let newStartVnode = newChildren[0];
    let newEndIndex = newChildren.length - 1;
    let newEndVnode = newChildren[newEndIndex];

    let oldStartIndex = 0;
    let oldStartVnode = oldChildren[0];
    let oldEndIndex = oldChildren.length - 1;
    let oldEndVnode = oldChildren[oldEndIndex];

    // indexMap
    function makeIndexByKey(children) {
        let map = {};
        children.forEach(({key}, index) => {
            map[key] = index;
        });
        return map;
    }

    let map = makeIndexByKey(oldChildren);

    while (newStartIndex <= newEndIndex && oldStartIndex <= oldEndIndex) {
        if (!oldStartVnode) {
            oldStartVnode = oldChildren[++oldStartIndex];
        } else if (!oldEndVnode) {
            oldEndVnode = oldChildren[--oldEndIndex];
        } else if (isSameVnode(oldStartVnode, newStartVnode)) {
            patch(oldStartVnode, newStartVnode);
            newStartVnode = newChildren[++newStartIndex];
            oldStartVnode = oldChildren[++oldStartIndex];
        } else if (isSameVnode(oldEndVnode, newEndVnode)) {
            patch(oldEndVnode, newEndVnode);
            newEndVnode = newChildren[--newEndIndex];
            oldEndVnode = oldChildren[--oldEndIndex];
        } else if (isSameVnode(oldStartVnode, newEndVnode)) {
            patch(oldStartVnode, newEndVnode);
            parent.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling);
            oldStartVnode = oldChildren[++oldStartIndex];
            newEndVnode = newChildren[--newEndIndex];
        } else if (isSameVnode(oldEndVnode, newStartVnode)) {
            patch(oldEndVnode, newStartVnode);
            parent.insertBefore(oldEndVnode.el, oldStartVnode.el);
            oldEndVnode = oldChildren[--oldEndIndex];
            newStartVnode = newChildren[++newStartIndex];
        } else {
            let moveIndex = map[newStartVnode.key];
            if (moveIndex == undefined) {
                parent.insertBefore(createElm(newStartVnode), oldStartVnode.el)
            } else {
                let moveVnode = oldChildren[moveIndex];
                oldChildren[moveIndex] = undefined;
                patch(moveVnode, newStartVnode);
                parent.insertBefore(moveVnode.el, oldStartVnode.el)
            }
            newStartVnode = newChildren[++newStartIndex];
        }
    }

    if (oldStartIndex <= oldEndIndex) {
        for (let i = oldStartIndex; i <= oldEndIndex; i++) {
            let child = oldChildren[i];
            if (child != undefined) {
                parent.removeChild(child.el);
            }
        }
    }

    if (newStartIndex <= newEndIndex) {
        for (let i = newStartIndex; i <= newEndIndex; i++) {
            // 考虑倒序，往后输一个
            let ele = newChildren[newStartIndex + 1] == null ? null : newChildren[newStartIndex + 1].el;
            console.log(ele);
            parent.insertBefore(createElm(newChildren[i]), ele);
        }
    }

}

export {
    render,
    patch,
}
```

### vdom/create-element.js
生成 virtual DOM
```js
export function vnode(tag, props, key, children, text) {
    return {
        tag,
        props,
        key,
        children,
        text,
    }
}
```

## mvvm & domDiff 代码合并
### vue/index.js
```js
import { initState } from './observe';
import Watcher from './observe/watcher';
// import { compiler } from './utils';
import { h, patch, render } from './vdom';

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
        vm._update(vm._render());
    };
    new Watcher(vm, updateComponent);
}

Vue.prototype.$watch = function (expr, handler, opts) {
    let vm = this;
    new Watcher(vm, expr, handler, { user: true, ...opts });
}   

Vue.prototype._update = function (vnode) {
    let vm = this;
    let el = vm.$el;
    let preVnode = vm.preVnode;
    if (!preVnode) {
        vm.preVnode = vnode;
        render(vnode, el);
    } else {
        vm.$el = patch(preVnode, vnode);
    }

    // let node = document.createDocumentFragment();
    // let firstChild;
    // while (firstChild = el.firstChild) {
    //     node.appendChild(firstChild);
    // }
    // // compiler
    // compiler(node, vm);
    // el.appendChild(node);
}

Vue.prototype._render = function(){
    let  vm = this;
    let render = vm.$options.render;
    let vnode = render.call(vm, h);
    return vnode;
}

function query(el) {
    if (typeof el === 'string') {
        return document.querySelector(el);
    }
    return el;
}

export default Vue;
```

## 总结
- 循环列表时，`key` 值设定为非数字型，避免页面的重新渲染 