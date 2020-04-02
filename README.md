# Vue souce learnging

## mvvm
- `m`: `model` 数据模型，后端请求的数据，需要展示在页面视图中
- `v`: `view` 页面视图，`compiler` 编译绘图
- `vm`: `viewModel` 实现数据模型和视图的关联，数据发生改变就会通知视图更新

## 源码分析与实现
### 分析
**steps**
- vue 对象劫持
- 数组劫持
- 编译文本
- 对象依赖收集
- 异步批量更新
- 数组依赖收集
- watch 实现
- computed 实现
- 虚拟 dom 和初次渲染
- 子节点比较
- 融合 vue 代码
- 源码调试

### 实现
#### Vue
#### observe
Observer
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

## vue 核心运用
**steps**
- 核心概念
- 响应式特点
- proxy 使用
- 实例属性
- 指令相关
- v-model 使用
- computed 和 watch
- filter 使用
- 指令的用法
- 生命周期
- 多元素动画
- 组件声明
- 组件间通信
    - props
    - events
    - \$parent, $children
    - provide, inject
    - $attrs
    - $listeners
    - \$dispatch, $broadcast
    - \$bus
    - v-model [ :value & input ]
    - .sync [ :value & update ]

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

    - `$mount()`
        - vm.$el 要挂在的真实 `dom`
        - `new Watcher(vm, updateComponent)` 
        - `pushTarget` 将当前 `watcher` 放在 `Dep.target` 上
        > 以便在渲染取值时，如 `{{someData}}`, `new Dep`
        - `updateComponent()`
        - `popTarget`