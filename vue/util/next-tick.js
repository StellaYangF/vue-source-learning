let callbacks = [];
let pending = false;
function flushCallback() {
    callbacks.forEach(cb => cb());
    pending = false;
    callbacks = [];
}

export default function nextTick(cb) {
    callbacks.push(cb);
    if (!pending) {
        pending = true;
        setTimeout(flushCallback, 0);
    }
}