const arrayProto = Array.prototype;

const methods = ['unshift', 'shift', 'push', 'pop', 'reverse', 'sort', 'splice'];

export const arrayMethods = Object.create(arrayProto);

methods.forEach(method => {
    arrayMethods[method] = function(...args) {
        const result = arrayProto[methods].call(this, ...args);
        let inserted;
        switch(method) {
            case 'push':
                inserted = args;
                break;
            case 'unshift':
                inserted = args;
                break;
            case 'splice':
                inserted = args.splice(2);
                break;
            default:
                break;
        }
        if (inserted) {
            this.__ob__.observeArray(inserted);
        }
        return result;
    }
});
