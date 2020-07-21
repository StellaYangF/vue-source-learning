export function patch(oldVnode, vnode) {
    // 1. 判断更新还是渲染
    const isRealElement = oldVnode.nodeType;
    if (isRealElement) {
        const oldEle = oldVnode;
        const parentEle = oldEle.parentNode;

        const el = createEle(vnode);
        parentEle.insertBefore(el, oldEle.nextSibling);
        parentEle.removeChild(oldEle);
    }
}

// 需要递归创建真实节点
function createEle(vnode) {
    const { tag, data, key, children, text } = vnode;
    if (typeof tag === 'string') {
        // 1. 创建元素节点
        vnode.el = document.createElement(tag);
        // 更新元素属性
        updateProperties(vnode)
        children.forEach(child => vnode.el.appendChild(createEle(child)));
    } else {
        vnode.el = document.createTextNode(text);
    }
    return vnode.el;
}

function updateProperties(vnode) {
    const newProps = vnode.data;
    const el = vnode.el;
    // console.log(el, newProps);

    Object.entries(newProps).forEach(([key, kValue]) => {
        switch(key) {
            case 'style':
                Object.entries(kValue).forEach(([name, nValue])=> el.style[name] = nValue);
                break;
            case 'class':
                el.className = kValue;
                break;
            default:
                el.setAttribute(key, kValue);
        }
    })
}