import Vue from 'vue';

let vm = new Vue({
    el: '#app',
    data() {
        return {
            a: "a"
        }
    },
    render(h) {
        return h("h1", { style: { background: "#f9b" } }, this.a)
        // h('div', { id: 'container' },
        //     h('li', { style: { background: '#f9b' }, key: 'a' }, 'text a'),
        //     h('li', { style: { background: '#fb9' }, key: 'b' }, 'text b'),
        //     h('li', { style: { background: '#f3a' }, key: 'c' }, 'text c'),
        //     h('li', { style: { background: '#f9d' }, key: 'd' }, 'text d'))
    },
})

setTimeout(() => {
    vm.a = "bbbb";
}, 1000)