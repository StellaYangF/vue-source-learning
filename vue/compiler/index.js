import { parseHTML } from './parse-html';
import { generate } from './generate';

export function compileToFunction(template) {
    // html 字符串 => ast 语法树
    let root = parseHTML(template);
    let code = generate(root);
    let renderFn = new Function(`with(this) { return ${code} }`);

    return renderFn;
    // _c("div",{id:app},_c("p",undefined,_v('hello' + _s(name) )),_v('hello'))
}

// let root = {
//     tag:'div',
//     attrs:[{name:'id',value:'app'}],
//     parent:null,
//     type:1,
//     children:[{
//         tag:'p',
//         attrs:[],
//         parent:root,
//         type:1,
//         children:[
//             {
//                 text:'hello',
//                 type:3
//             }
//         ]
//     }]
// }