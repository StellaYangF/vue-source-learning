// ?: 匹配不捕获，不不会当前分组
// + 至少一个
// ? 尽可能少
const defaultRE = /\{\{((?:.|\r?\n)+?)\}\}/g;

const util = {
    getValue(vm, expr) {
        let keys = expr.split('.'); // [ obj, age ]
        return keys.reduce((memo, current) => {
            current = current.trim();
            memo = memo[current];
            return memo;
        }, vm)
    },
    compilerText(node, vm) {
        if (!node.expr) {
            node.expr = node.textContent;
        }
        node.textContent = node.expr.replace(defaultRE, (...args) => {
            return util.getValue(vm, args[1]);
        });
    }
}

function compiler(node, vm) {
    let childNodes = node.childNodes;
    [...childNodes].forEach(child => {
        if (child.nodeType == 1) {
            compiler(child, vm);
        } else if (child.nodeType == 3) {
            util.compilerText(child, vm);
        }
    });

}

export {
    compiler,
    util,
}