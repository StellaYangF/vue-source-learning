import h  from './h';

function render(vnode, container) {
    let el = createElm(vnode);
    container.appendChild(el);
}

function createElm(vnode) {
    let { tag, props, key, children, text } = vnode;
    if (typeof tag === 'string') {
        vnode.el = document.createElement(tag);
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
            Object.entries(newProps.style).forEach((styleName, value) => {
                el.style[styleName] = value;
            })
        } else if (key === 'class') {
            el.className = newProps.class;
        } else{
            el[key] = newProps[key];
        }
    })
}

function patch(oldVnode, newVnode){
    // 标签不同
    if(oldVnode.tag !== newVnode.tag) {
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
    console.log(el);

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

function updateChildren(parent, olcChildren, newChildren) {
    
}

export {
    render,
    patch,
}