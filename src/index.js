import Vue from 'vue';

const vm = new Vue({
    el: '#app',
    data() {
        return {
            name: 'stella',
            age: 18,
            interests: [{
                text: 'sing'
            }, {
                text: 'dance'
            }],
            families: {
                father: 'Dad',
                mother: 'Mom'
            }
        }
    }
});
/**
 * 修改的值需要 劫持
 * 对象每个键也需要劫持
 * 数组下标不需要劫持
 * 数组元素 observe 
 */
// vm._data.name = { nickname: 'fan' }
// vm._data.interests[0] = 'bake';

// 代理 vm[key] => vm._data[key]
vm.interests.push = 'bake';

