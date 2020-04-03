import { h, render, patch } from './vdom/index.js';

let oldVnode = h('div', { id: 'container' },
    h('li', { style: { background: '#f9b' }, key: 'a' }, 'text a'),
    h('li', { style: { background: '#fb9' }, key: 'b' }, 'text b'),
    h('li', { style: { background: '#f3a' }, key: 'c' }, 'text c'),
    h('li', { style: { background: '#f9d' }, key: 'd' }, 'text d'),
);


let container = document.getElementById('app');
render(oldVnode, container);

let newVnode = h('div', );

// newVnode = h('div', { id: 'container-update' },
//     h('li', { style: { background: '#f9d' }, key: 'd' }, 'text d'),
//     h('li', { style: { background: '#f3a' }, key: 'c' }, 'text c'),
//     h('li', { style: { background: '#fb9' }, key: 'b' }, 'text b'),
//     h('li', { style: { background: '#f9b' }, key: 'a' }, 'text a'),

// )
setTimeout(() => patch(oldVnode, newVnode), 1000);