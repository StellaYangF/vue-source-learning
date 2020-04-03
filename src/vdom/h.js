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