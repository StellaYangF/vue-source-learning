let id = 0;
export default class Dep {
    constructor() {
        this.id = id++;
        this.subs = [];
    }

    addSub(watcher) {
        this.subs.push(watcher);
    }

    notify() {
        this.subs.forEach(watcher => watcher.update());
    }

    depend() {
        if (Dep.target) {
            Dep.target.addDep(this);
        }
    }
}

let stack = [];

function pushTarget(watcher) { 
    Dep.target = watcher;
    stack.push(watcher);
}

function popTarget() {
    stack.pop();
    Dep.target = stack[stack.length - 1];
}

export {
    pushTarget,
    popTarget,
}