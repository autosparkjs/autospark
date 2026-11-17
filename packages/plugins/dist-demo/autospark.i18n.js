(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
var{params:e}=AutoSpark,t=new WeakMap,n=new WeakMap;function r(e,n){t.set(e,{...t.get(e),...n})}function i(e,t){n.set(e,{...n.get(e),...t})}function a(e){return e.trim().toLowerCase().replace(/_/g,`-`)}function o(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function s(e,t){return Object.prototype.hasOwnProperty.call(e,t)}var c=new Set,l=new Set;function u(e){let t=e.store?.state;if(!t)return;let n=t.$?.language;if(typeof n==`string`&&n!==``)return n;let r=e.options.i18n??{},i=r.language??r.default;if(typeof i==`string`&&i!==``){try{t.$||={},t.$.language=i}catch{}return i}}function d(e,r,i){let a=[],c=!1,l=r;for(;l;){let e=t.get(l);e&&(c=!0,s(e,i)&&o(e[i])&&a.push(e[i])),l=l.parent}let u=n.get(e);u&&(c=!0,s(u,i)&&o(u[i])&&a.push(u[i]));let d=e.options.i18n?.messages;return o(d)&&(c=!0,s(d,i)&&o(d[i])&&a.push(d[i])),{layers:a,dictPresent:c}}function f(e,t){if(!e||!t)return;let n=a(t);if(n===``)return;for(let t of Object.keys(e))if(a(t)===n)return e[t];let r=n.split(`-`)[0];for(let t of Object.keys(e))if(a(t).split(`-`)[0]===r)return e[t]}function p(e,t){for(let t of e)if(typeof t==`number`)return t;if(t){for(let[e,n]of Object.entries(t))if(e.startsWith(`$`)&&typeof n==`number`)return n}}function m(e,t,n){let r=p(t,n);return r===void 0?e[e.length-1]:e[Math.min(Math.max(Math.floor(r),0),e.length-1)]}function h(t,n,r,...i){let a=null,s=i;i.length>=1&&o(i[0])&&(a=i[0],s=[],i.length>1&&!l.has(r)&&(l.add(r),t.logger?.warn(`t("${r}"): 对象参数与位置参数混用不受支持，复数请用 {$count} 通道——位置参数已忽略（ADR-0136）`)));let{layers:p,dictPresent:h}=d(t,n,r),g;if(p.length>0){let e=u(t),n=t.options.i18n??{};for(let t of p)if(g=f(t,e)??f(t,n.fallback),g!==void 0)break}Array.isArray(g)&&(g=m(g,s,a));let _=g==null?r:String(g),v=a?e(_,a):e(_,...s);return g==null&&h&&!c.has(r)&&(c.add(r),t.logger?.warn(`t("${r}"): 字典中无当前语言的翻译（语言链与 fallback 均未命中），已按原文返回（ADR-0136）`)),v}function g(e){return(t,n,...r)=>h(e,t,n,...r)}var _=`autospark/locales`,v=(e,t,n)=>{let a=e.textContent?.trim();if(!a)return;let o;try{if(o=Function(`return (${a})`)(),!o||typeof o!=`object`||Array.isArray(o)){n.logger.error(`<script type="autospark/locales"> 内容须为字典对象字面量`);return}}catch(e){n.logger.error(`<script type="autospark/locales"> 解析失败: ${e?.message??e}`);return}let s=o;e.hasAttribute(`global`)||!t?i(n,s):r(t,s)},{DirectiveKind:y}=AutoSpark;function b(){return{name:`locales`,kind:y.Compile,created(){let e=this.value;if(e==null||e===``)return;let t=this.binding.read(e);t!=null&&(typeof t!=`object`||Array.isArray(t)?this.engine.logger.warn(`x-locales: 值须为字典对象（原文 → {语言码: 译文}），已忽略: ${typeof t}`):r(this.binding,t))}}}var x=`ready`,S=`__AUTOSPARK_PLUGINS__`;function C(e){let t=globalThis.AutoSpark;if(typeof t?.[x]==`function`){e(t);return}let n=globalThis,r=n[S]??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function w(e){e.translate=g(e),u(e);let t=e.scopes;if(t)for(let e of t.values())e.refresh()}function T(){C(e=>{e.scriptType(_,v),e.directive(b()),e.ready(w)})}T();};
    if (AutoSpark === undefined) {
        // 插件先于引擎加载（engine ADR-0114）：入预加载队列，engine 构造 drain 时以命名空间回放
        var queue = (globalThis.__AUTOSPARK_PLUGINS__ ??= []);
        if (Object.isFrozen(queue)) {
            console.error("插件闭包: 预加载队列已消费且全局 AutoSpark 不可达，插件未注册");
            return;
        }
        queue.push(function (engine, ns) { run(ns); });
    } else {
        run(AutoSpark);
    }
})(globalThis.AutoSpark);

//# sourceMappingURL=autospark.i18n.js.map
