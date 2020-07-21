const LIFECYCLE_HOOKS = [
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted',
    'beforeUpdate',
    'updated',
    'beforeDestroy',
    'destroyed',
];

let strats = {};

LIFECYCLE_HOOKS.forEach(hook => strats[hook] = mergeHook)

function mergeHook(parentVal, childVal) {
    if (childVal) {
        if (parentVal) {
            return parentVal.concat(childVal);
        } else {
            return [childVal];
        }
    } else {
        return parentVal;
    }
}

export default  function mergeOptions(parent = {}, child) {
    const options = {};
    Object.keys(parent).forEach(mergeField);
    debugger
    Object.keys(child).forEach(key => parent.hasOwnProperty(key) || mergeHook(key));
    
    function mergeField(key) {
        if (strats[key]) {
            return options[key] = strats[key](parent[key], child[key])
        }
        if (typeof parent[key] === 'object' && typeof child[key] === 'object') {
            options[key] = {
                ...parent[key],
                ...child[key],
            }
        } else if (child[key] === null) {
            options[key] = parent[key];
        } else {
            options[key] = child[key];
        }
    }

    return options;
}
