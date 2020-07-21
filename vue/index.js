import { initMixin } from './init';
import { lifecycleMixin } from './lifecycle';
import { renderMixin } from './render';
import { initGlobalAPI } from './globalAPI';

function Vue(options) {
    this._init(options);
}

initMixin(Vue);
lifecycleMixin(Vue);
renderMixin(Vue);

initGlobalAPI(Vue);

export default Vue;