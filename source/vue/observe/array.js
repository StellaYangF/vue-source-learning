import { observe } from '.';
const oldArrayPrototypeMethods = Array.prototype;

// arrayMethods.__proto__ = Array.prototype
const arrayMethods = Object.create(oldArrayPrototypeMethods);
const methods = ['push', 'pop', 'unshift', 'shift', 'sort', 'reverse', 'splice'];

methods.forEach(method => {
    arrayMethods[method] = function (...args) {
        let r = oldArrayPrototypeMethods[method].call(this, ...args);
        let inserted;
        switch (method) {
            case 'push': 
            case 'unshift':
                inserted = args;
                break;
            case 'splice':
                inserted = args.slice(2);
                break;
            default:
                break;
        }
        if (inserted) observeArray(inserted);
        console.log('调用数组更新方法 ', method);
        return r;
    }
})

function observeArray(data) {
    data.forEach(key => observe(key));
}

export {
    arrayMethods,
    observeArray,
}