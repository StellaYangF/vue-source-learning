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
        console.log(this);
        this.__ob__.dep.depend();
        return r;
    }
})

function observeArray(data) {
    data.forEach(key => observe(key));
}

function dependArray(value) {
    // 递归收集数组中的依赖
    value.forEach(currentItem => {
        currentItem.__ob__ && currentItem.__ob__.dep.depend();
        if (Array.isArray(currentItem)){
            dependArray(currentItem);
        }
    })
}

export {
    arrayMethods,
    observeArray,
    dependArray,
}