# Vue souce learnging

## mvvm
- `m`: `model` 数据模型，后端请求的数据，需要展示在页面视图中
- `v`: `view` 页面视图，`compiler` 编译绘图
- `vm`: `viewModel` 实现数据模型和视图的关联，数据发生改变就会通知视图更新

**steps**
- 

### Vue
### observe
#### Observer
数据劫持-实现响应式
- 所有属性都会进行劫持
- 对象新增的属性无法监控
- 数组需重写原生 `api`实现响应式
    - unshift
    - push
    - splice
    - shift
    - pop
    - sort
    - reverse
    > `unshift`, `push`, `splice` 三种 `api` 调用时，可能会给原数组新增元素，要进行观察

#### Dep
收集依赖
- 每个对象属性都会 `new` 一个 `Dep` 依赖实例对象
- 

### summary
- `new Vue` 传入 `options`
- `vm._init(options)`
    - `initState(vm)`
        - vm.$options
        - initData(data)
        - vm._data
        - proxy(data) 实现代理 vm.key => vm._data.key
        - observe(data)
        - data 不是 `null` 的 `object`,则`new Observer()` 

    - 用户传入了 `el` 时
        - 就自动调用 `$mount()`
        - vm.$el 要挂在的真实 `dom`
    