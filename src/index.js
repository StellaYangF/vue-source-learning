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