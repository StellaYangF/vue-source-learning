class Watcher{
    /**
     * 
     * @param {Vue} vm Vue 实例
     * @param {string | Function} exprOrFn 渲染 Watcher 的
     * @param {Function} callback 用户定义 watch  对象传入的回调函数
     * @param {Object} options computed 定义：{ lazy: true }
     */
    constructor(vm, exprOrFn, callback, options) {
        exprOrFn.call(vm);
    }
}

export default Watcher;