import Vue from 'vue';

let vm = new Vue({
    el: '#app',
    data() {
        return {
            name: "xiangju",
        }
    }
})

setTimeout(() => {
    vm.name = 1;
    vm.name = 2;
    vm.name = 3;
}, 1000)
// vm.obj.age = { number: 1 }
// console.log(vm);