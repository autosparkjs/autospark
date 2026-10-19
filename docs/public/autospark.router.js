var AutoSparkRouter=(function(exports){'use strict';var U=(a=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(a,{get:(t,e)=>(typeof require<"u"?require:t)[e]}):a)(function(a){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+a+'" is not supported')});function Ae(a,t,e){a.dispatchEvent(new CustomEvent(t,{detail:e,bubbles:true,composed:true}));}var mt=class a extends HTMLElement{constructor(){super(...arguments);this._contextRequested=false;this._contextCallback=e=>{this.router=e,this.onRouterReady();};}connectedCallback(){if(!this._contextRequested){let e=this._getRouterSync();e?(this.router=e,this.onRouterReady()):this.getRouter(),this._contextRequested=true;}}disconnectedCallback(){}onRouterReady(){}_getRouterSync(){let e=this,r=[];for(;e;){if(r.push(e instanceof HTMLElement?`${e.tagName.toLowerCase()}${e.id?"#"+e.id:""}${e.className?"."+e.className:""}`:e.tagName),e instanceof HTMLElement&&e.hasAttribute("data-autospark-router")||e instanceof a&&e.router)return e.router;e=e.parentElement;}}getRouter(e=this._contextCallback){if(this.router){e(this.router);return}Ae(this,"context-request",{context:"AutoSparkRouter",contextTarget:this,callback:r=>{this.router=r,e(r);}});}};function M(a,t){let e=a.replace(/\/+$/,""),r=t.replace(/^\/+/,"");return e?r?`${e}/${r}`:e||"/":`/${r}`}function j(a,t){if(a.includes("://")||a.startsWith("//"))return a;let e=t||"";return !e||e==="/"?a:a.startsWith("/")?a.startsWith(e)?a:M(e,a):M(e,a)}function _e(a){return a?a.startsWith("/")&&!a.includes("://"):false}function te(a){let t=a.trim().toLowerCase();return t.startsWith("javascript:")||t.startsWith("data:")}var F=class extends mt{constructor(){super(...arguments);this._to="";this._replace=false;this._target="";this._rel="";this._anchor=null;}get to(){return this._to}set to(e){let r=this._to;this._to=e,r!==e&&this._updateAnchor();}get href(){return this._to}set href(e){this.to=e;}get replace(){return this._replace}set replace(e){this._replace=e;}get target(){return this._target}set target(e){let r=this._target;this._target=e,r!==e&&this._updateAnchor();}get rel(){return this._rel}set rel(e){let r=this._rel;this._rel=e,r!==e&&this._updateAnchor();}connectedCallback(){super.connectedCallback(),this._render();}attributeChangedCallback(e,r,o){if(e==="href"){o!==null&&(this.to=o);return}let n=this._attributeToProperty(e);o!==null&&(this[n]=this._coerceAttributeValue(n,o));}_render(){if(!this._anchor){for(this._anchor=document.createElement("a");this.firstChild;)this._anchor.appendChild(this.firstChild);this.appendChild(this._anchor);}this._updateAnchor();}_updateAnchor(){if(!this._anchor)return;let e=this._anchor,r=this._resolveHref(this._to);r?e.setAttribute("href",r):e.removeAttribute("href"),this._target?e.setAttribute("target",this._target):e.removeAttribute("target");let o=this._getComputedRel();o?e.setAttribute("rel",o):e.removeAttribute("rel");}_resolveHref(e){return e?_e(e)?j(e,this.router?.options?.base):e:""}_getComputedRel(){return this.rel?this.rel:this.target==="_blank"?"noopener noreferrer":""}handleClick(e){if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button===1)return;let r=this.to;if(te(r)){e.preventDefault();return}_e(r)&&(this.getRouter(()=>{this.router&&(this.replace?this.router.replace(r):this.router.push(r));}),e.preventDefault());}_attributeToProperty(e){return e}_coerceAttributeValue(e,r){return e==="replace"?r!==null&&r!=="false":r}};F.observedAttributes=["to","replace","target","rel","href"];customElements.get("auto-link")||customElements.define("auto-link",F);var ee=class extends HTMLElement{constructor(){super(),this.style.display="none";}get(t){return this.getAttribute(t)}set(t,e){e===null?this.removeAttribute(t):this.setAttribute(t,e);}getAll(){let t={};for(let e of this.attributes)t[e.name]=e.value;return t}has(t){return this.hasAttribute(t)}getJSON(t,e){let r=this.get(t);if(!r)return e;try{return JSON.parse(r)}catch{return e}}getBoolean(t){let e=this.get(t);return e==="true"||e===""}getArray(t,e=","){let r=this.get(t);return r?r.split(e).map(o=>o.trim()).filter(Boolean):[]}toString(){let t=this.getAll();return JSON.stringify(t,null,2)}};customElements.get("autospark-view-meta")||customElements.define("autospark-view-meta",ee);function q(a,...t){let e=a.valueOf(),r={},o=[...t];try{if(o.length===0)return e;if(o.length===1){let n=o[0];if(n==null)return e;Array.isArray(n)?o=n:typeof n=="object"&&(r=n,o=[]);}return e=e.replace(/\{\s*([a-zA-Z\d]*)\s*\}/g,(n,i)=>{let s;return i&&r.hasOwnProperty(i)?s=r[i]:!i&&o.length>0&&(s=o.shift()),s==null?"":(typeof s=="function"&&(s=s()),String(s))}),e}catch{return e}}String.prototype.params=function(){return q(this,...arguments)};function we(a){return {all:a=a||new Map,on:function(t,e){var r=a.get(t);r?r.push(e):a.set(t,[e]);},off:function(t,e){var r=a.get(t);r&&(e?r.splice(r.indexOf(e)>>>0,1):a.set(t,[]));},emit:function(t,e){var r=a.get(t);r&&r.slice().map(function(o){o(e);}),(r=a.get("*"))&&r.slice().map(function(o){o(t,e);});}}}var gt=class{constructor(){this._initEmitter();}_initEmitter(){this._emitter=we();}on(t,e){this._emitter.on(t,e);let r=this._retainEvents?.get(t);return r!==void 0&&e(r),()=>this.off(t,e)}once(t,e){let o=(()=>{let n=true,i=s=>{n&&(n=false,e(s),this._emitter.off(t,i));};return i})();return this._emitter.on(t,o),()=>this._emitter.off(t,o)}off(t,e){e?this._emitter.off(t,e):this._emitter.all.clear();}onAny(t){return this._emitter.on("*",t),()=>this._emitter.off("*",t)}emit(t,e,r){r&&(this._retainEvents||(this._retainEvents=new Map),this._retainEvents.set(t,e)),this._emitter.emit(t,e);}};function lr(a,t){let e=a.parentElement;for(;e;){if(e===t)return  false;if(e instanceof HTMLElement&&e.hasAttribute("data-autospark-outlet"))return  true;e=e.parentElement;}return  false}function at(a){if(!a)return [];let t=[],e=[a];for(;e.length>0;){let r=e.shift();for(let o of Array.from(r.children))lr(o,a)||(o instanceof HTMLElement&&o.hasAttribute("data-autospark-outlet")?t.push(o):o instanceof HTMLElement&&e.push(o));}return t}function yt(a,t=12){let e=3735928559,r=1103547991;for(let s=0;s<a.length;s++){let u=a.charCodeAt(s);e=Math.imul(e^u,2246822507),e=e<<13|e>>>19,r=Math.imul(r^u,3266489909),r=r<<7|r>>>25;}let o="",n=(e^r)>>>0,i=n%26+10;for(o+=i.toString(36);o.length<t;)n=Math.imul(n,2654435769),n=n<<5|n>>>27,o+=(n>>>0).toString(36);return o.substring(0,t)}function _o(a,t){let e=(a||"{path}").replace(/\s+/g,""),r=yt(q(e,t));return isNaN(parseInt(r.substring(0,1)))?r:"h"+r}function B(){return B=Object.assign?Object.assign.bind():function(a){for(var t=1;t<arguments.length;t++){var e=arguments[t];for(var r in e)({}).hasOwnProperty.call(e,r)&&(a[r]=e[r]);}return a},B.apply(null,arguments)}var C;(function(a){a.Pop="POP",a.Push="PUSH",a.Replace="REPLACE";})(C||(C={}));var vt=function(a){return a};var bt="beforeunload",cr="hashchange",xe="popstate";function Ee(a){a===void 0&&(a={});var t=a,e=t.window,r=e===void 0?document.defaultView:e,o=r.history;function n(){var g=r.location,d=g.pathname,k=g.search,w=g.hash,v=o.state||{};return [v.idx,vt({pathname:d,search:k,hash:w,state:v.usr||null,key:v.key||"default"})]}var i=null;function s(){if(i)b.call(i),i=null;else {var g=C.Pop,d=n(),k=d[0],w=d[1];if(b.length){if(k!=null){var v=c-k;v&&(i={action:g,location:w,retry:function(){R(v*-1);}},R(v));}}else S(g);}}r.addEventListener(xe,s);var u=C.Pop,l=n(),c=l[0],p=l[1],f=St(),b=St();c==null&&(c=0,o.replaceState(B({},o.state,{idx:c}),""));function h(g){return typeof g=="string"?g:kt(g)}function A(g,d){return d===void 0&&(d=null),vt(B({pathname:p.pathname,hash:"",search:""},typeof g=="string"?re(g):g,{state:d,key:Me()}))}function m(g,d){return [{usr:g.state,key:g.key,idx:d},h(g)]}function y(g,d,k){return !b.length||(b.call({action:g,location:d,retry:k}),false)}function S(g){u=g;var d=n();c=d[0],p=d[1],f.call({action:u,location:p});}function E(g,d){var k=C.Push,w=A(g,d);function v(){E(g,d);}if(y(k,w,v)){var O=m(w,c+1),L=O[0],I=O[1];try{o.pushState(L,"",I);}catch{r.location.assign(I);}S(k);}}function x(g,d){var k=C.Replace,w=A(g,d);function v(){x(g,d);}if(y(k,w,v)){var O=m(w,c),L=O[0],I=O[1];o.replaceState(L,"",I),S(k);}}function R(g){o.go(g);}var _={get action(){return u},get location(){return p},createHref:h,push:E,replace:x,go:R,back:function(){R(-1);},forward:function(){R(1);},listen:function(d){return f.push(d)},block:function(d){var k=b.push(d);return b.length===1&&r.addEventListener(bt,Rt),function(){k(),b.length||r.removeEventListener(bt,Rt);}}};return _}function At(a){a===void 0&&(a={});var t=a,e=t.window,r=e===void 0?document.defaultView:e,o=r.history;function n(){var d=re(r.location.hash.substr(1)),k=d.pathname,w=k===void 0?"/":k,v=d.search,O=v===void 0?"":v,L=d.hash,I=L===void 0?"":L,D=o.state||{};return [D.idx,vt({pathname:w,search:O,hash:I,state:D.usr||null,key:D.key||"default"})]}var i=null;function s(){if(i)b.call(i),i=null;else {var d=C.Pop,k=n(),w=k[0],v=k[1];if(b.length){if(w!=null){var O=c-w;O&&(i={action:d,location:v,retry:function(){_(O*-1);}},_(O));}}else E(d);}}r.addEventListener(xe,s),r.addEventListener(cr,function(){var d=n(),k=d[1];kt(k)!==kt(p)&&s();});var u=C.Pop,l=n(),c=l[0],p=l[1],f=St(),b=St();c==null&&(c=0,o.replaceState(B({},o.state,{idx:c}),""));function h(){var d=document.querySelector("base"),k="";if(d&&d.getAttribute("href")){var w=r.location.href,v=w.indexOf("#");k=v===-1?w:w.slice(0,v);}return k}function A(d){return h()+"#"+(typeof d=="string"?d:kt(d))}function m(d,k){return k===void 0&&(k=null),vt(B({pathname:p.pathname,hash:"",search:""},typeof d=="string"?re(d):d,{state:k,key:Me()}))}function y(d,k){return [{usr:d.state,key:d.key,idx:k},A(d)]}function S(d,k,w){return !b.length||(b.call({action:d,location:k,retry:w}),false)}function E(d){u=d;var k=n();c=k[0],p=k[1],f.call({action:u,location:p});}function x(d,k){var w=C.Push,v=m(d,k);function O(){x(d,k);}if(S(w,v,O)){var L=y(v,c+1),I=L[0],D=L[1];try{o.pushState(I,"",D);}catch{r.location.assign(D);}E(w);}}function R(d,k){var w=C.Replace,v=m(d,k);function O(){R(d,k);}if(S(w,v,O)){var L=y(v,c),I=L[0],D=L[1];o.replaceState(I,"",D),E(w);}}function _(d){o.go(d);}var g={get action(){return u},get location(){return p},createHref:A,push:x,replace:R,go:_,back:function(){_(-1);},forward:function(){_(1);},listen:function(k){return f.push(k)},block:function(k){var w=b.push(k);return b.length===1&&r.addEventListener(bt,Rt),function(){w(),b.length||r.removeEventListener(bt,Rt);}}};return g}function Rt(a){a.preventDefault(),a.returnValue="";}function St(){var a=[];return {get length(){return a.length},push:function(e){return a.push(e),function(){a=a.filter(function(r){return r!==e});}},call:function(e){a.forEach(function(r){return r&&r(e)});}}}function Me(){return Math.random().toString(36).substr(2,8)}function kt(a){var t=a.pathname,e=t===void 0?"/":t,r=a.search,o=r===void 0?"":r,n=a.hash,i=n===void 0?"":n;return o&&o!=="?"&&(e+=o.charAt(0)==="?"?o:"?"+o),i&&i!=="#"&&(e+=i.charAt(0)==="#"?i:"#"+i),e}function re(a){var t={};if(a){var e=a.indexOf("#");e>=0&&(t.hash=a.substr(e),a=a.substr(0,e));var r=a.indexOf("?");r>=0&&(t.search=a.substr(r),a=a.substr(0,r)),a&&(t.pathname=a);}return t}function To(a){let t=a.replace(/^#\/?/,"");return t.startsWith("/")||(t="/"+t),t=t.replace(/\/+/g,"/"),t.length>1&&(t=t.replace(/\/+$/,"")),t}function Lo(){return At()}function oe(a){if(!a||!a.trim())return  false;if(a.startsWith("//")){let{hostname:t}=window.location,e=document.createElement("a");return e.href=a,e.hostname!==t}if(/^[a-z][a-z0-9+.-]*:/i.test(a)){let t=document.createElement("a");return t.href=a,t.protocol!=="http:"&&t.protocol!=="https:"?true:t.hostname!==window.location.hostname||t.port!==window.location.port}return  false}function Oe(a){if(!a)return {};let t=new URLSearchParams(a.startsWith("?")?a.slice(1):a),e={};return t.forEach((r,o)=>{e[o]=r;}),e}function J(a){return {name:a.route.name,path:a.path,curPath:a.path,url:a.url,timestamp:Date.now(),query:new URLSearchParams(a.query).toString(),...a.route.meta,...a.params,...a.state}}function $(a,t){let e=J(t),r=yt(q(a,e));return isNaN(parseInt(r.substring(0,1)))?r:"h"+r}function nt(a){let t=a?.route?.hash||"{url}";return $(t,a)}var X=class extends Error{constructor(e,r,o){super(e);this.status=0;this.status=r||0,this.route=o;}},it=class extends Error{constructor(t,e){super(t),this.route=e;}},st=class extends Error{constructor(e,r="_self"){super(`External redirect: ${e}`);this.target="_self";this.name="AutoSparkExternalRouteError";this.url=e,this.target=r;}},W=class extends it{constructor(t,e){super(`Redirect target not found: ${t}`,e),this.name="AutoSparkNotFoundRouteError",this.target=t;}},_t=class extends it{constructor(t){let e=t.redirectFrom?.map(r=>r.url).join(" -> ");super(`Maximum redirect limit exceeded:${e} -> ...`,t);}},wt=class extends it{constructor(t){let e=t.redirectFrom?.map(r=>r.url).join(" -> ");super(`Redirect loop detected: ${e} -> ${e}`,t);}},H=class extends X{},xt=class extends X{};var pr=0;function Mt(a){return a==="/"||a===""?"/":a.replace(/\/+$/,"")}function ne(a){let t=a;return t.startsWith("/")||(t="/"+t),t=t.replace(/\/+$/,""),t===""&&(t="/"),t.toLowerCase()}function ae(a,t){if(a.startsWith("/"))return a;let e=t.path.split("/").filter(Boolean).slice(0,-1).join("/"),r=e?e.split("/"):[];if(a.startsWith("./")){let o=a.slice(2);return "/"+[...r,o].join("/")}if(a.startsWith("../")){let o=a,n=[...r];for(;o.startsWith("../");)o=o.slice(3),n.length>0&&n.pop();return o&&n.push(o),"/"+n.join("/")}return M(e||"/",a)}function ie(a,t,e){if(typeof a=="function"){let r=a(e);return r===null?null:ie(r,t,e)}if(typeof a=="string")return oe(a)?{target:a,mode:"replace",isExternal:true}:{target:ae(a,e),mode:"replace"};if("path"in a){let r=a;return oe(r.path)?{target:r.path,mode:r.mode||"replace",windowTarget:r.target,isExternal:true}:{target:ae(r.path,e),mode:r.mode||"replace",windowTarget:r.target}}if("name"in a){let r=a,n=t?.get(r.name)?.deref();if(!n)return {target:`name:${r.name}`,mode:r.mode||"replace",windowTarget:r.target,notFound:true};let i=n.path;if(r.params)for(let[s,u]of Object.entries(r.params))i=i.replace(`:${s}`,u).replace(`<${s}>`,u);if(r.query){let s=new URLSearchParams(r.query).toString();s&&(i+=`?${s}`);}return {target:ae(i,e),mode:r.mode||"replace",windowTarget:r.target}}return null}function dr(a){return a.replace(/[.+^${}()|[\]\\]/g,"\\$&")}function Pe(a){let t=a.indexOf("#");return t>=0?a.slice(0,t):a}function se(a){let t=Pe(a),[e,r=""]=t.split("?",2),o=r?Oe("?"+r):{};return {pathname:e,query:o}}function Te(a,t){let e=[],r=a.split("/").filter(Boolean),o=[];for(let u=0;u<r.length;u++){let l=r[u];if(l==="**"){if(u!==r.length-1)throw new Error("Multi-wildcard '**' can only appear at the end of a pattern");o.push(".+");continue}if(l==="*"){o.push("[^/]+");continue}let c=l.match(/^:(\w+)(?:\((.+)\))?$/);if(c){let f=c[1],b=c[2];e.push(f),o.push(`(${b||"[^/]+"})`);continue}let p=l.match(/^<(\w+)(?:\((.+)\))?>$/);if(p){let f=p[1],b=p[2];e.push(f),o.push(`(${b||"[^/]+"})`);continue}o.push(dr(l.toLowerCase()));}let n;o.length>0&&o[o.length-1]===".*"?n=o.slice(0,-1).map(l=>"/"+l).join("")+"(?:/.*)?":n=o.map(u=>"/"+u).join("");let s;return t?s=`^${n}/?$`:s=`^${n}(?:/(.*))?$`,{regex:new RegExp(s),paramNames:e}}function hr(a,t){let r=a.split("/").filter(Boolean).map(o=>{let n=o.match(/^:(\w+)(?:\(.+\))?$/);if(n){let s=n[1];return t[s]??o}let i=o.match(/^<(\w+)(?:\(.+\))?>$/);if(i){let s=i[1];return t[s]??o}return o});return r.length>0?"/"+r.join("/"):"/"}function le(a,t,e,r){for(let o of a)if(o.default===true){let n=M(t.path,o.path),i={...t.params,...o.params},s={...o.query,...e},u=hr(n,i),l=Mt(u),c={route:o,params:i,query:s,state:{},path:n,url:l,hash:"",id:r};if(c.hash=nt(c),Array.isArray(o.children)&&o.children.length>0){let p=le(o.children,c,e,r);if(p&&p.length>0)return [c,...p]}return [c]}return null}function Et(a,t,e,r){let o=t?.path||"",n=t?.url||"",i=t?.params||{},s=M(o,a),u=Mt(M(n,a));return {route:void 0,params:i,query:e,state:{},path:s,url:u,hash:`unmatched-${s.replace(/\//g,"-")}`,id:r}}function fr(a,t=false){let e=a.path;if(e==="*"){let{regex:s,paramNames:u}=Te("/*",false);return l=>{let p=ne(se(l).pathname).match(s);if(p){let f={};u.forEach((A,m)=>{f[A]=p[m+1]||"";});let b="",h=u.length+1;return b=p[h]||"",{matched:true,params:f,remainingPath:b}}return {matched:false,params:{},remainingPath:l}}}let r=e==="/"?"/":e.replace(/^\/+/,""),o=r.startsWith("/")?r:"/"+r,{regex:n,paramNames:i}=Te(o,!t);return s=>{let l=ne(se(s).pathname).match(n);if(l){let c={};i.forEach((f,b)=>{c[f]=l[b+1]||"";});let p="";if(t){let f=i.length+1;p=l[f]||"";}return {matched:true,params:c,remainingPath:p}}return {matched:false,params:{},remainingPath:s}}}function Le(a,t,e,r,o){let n=e?.path||"",i=e?.params||{},s=e?.url||"",u=!Array.isArray(a.children)||a.children.length===0,c=fr(a,true)(t);if(!c.matched||(a.path===""||a.path==="/")&&c.remainingPath&&(e||u))return null;let p=Mt(t.slice(0,t.length-(c.remainingPath?.length||0))),f=Mt(M(s,p)),b=M(n,a.path),h=Object.assign({},a.params,i,c.params),A=a.query||{},m={route:a,params:h,query:A,state:{},path:b,url:f,hash:"",id:o};if(m.hash=nt(m),!c.remainingPath){if(Array.isArray(a.children)&&a.children.length>0){let y=le(a.children,m,r,o);if(y&&y.length>0)return [m,...y];let S=ue("/",a.children,m,r,o);return S.length>0?[m,...S]:[m]}return m.query={...A,...r},[m]}if(Array.isArray(a.children)&&a.children.length>0){let y="/"+c.remainingPath,S=ue(y,a.children,m,r,o);if(S.length>0)return [m,...S];if(a.path==="*"||a.path.endsWith("/*")){let x=Et(c.remainingPath,m,r,o);return [m,x]}let E=Et(c.remainingPath,m,r,o);return [m,E]}if(!u&&c.remainingPath)return null;if(c.remainingPath&&a.path==="*"){if(!e||e.path==="/")return null;let y=Et(c.remainingPath,m,r,o);return [m,y]}return [m]}function ue(a,t,e,r={},o){for(let n of t){if(n.path==="*"||n.path.includes("*"))continue;let i=Le(n,a,e,r,o);if(i)return i}for(let n of t){if(!n.path.includes("*"))continue;let i=Le(n,a,e,r,o);if(i)return i}return e===null?a==="/"||a===""?[]:[Et(a,null,r,o)]:[]}function Y(a,t,e){let{pathname:r,query:o}=se(a),n=ne(r),i=Pe(a),s=i.includes("?")?i.slice(i.indexOf("?")+1):"",u=e?._redirectChain||[],l=e?.maxRedirect??10,c=e?.namedRoutes,p=++pr,f={id:p,route:t,params:{},query:o,url:"/",path:"/",hash:""};f.hash=nt(f);let b=Array.isArray(t.children)?t.children:[],h=ue(n,b,null,o,p);if(h.some(y=>y.route!==void 0))h=[f,...h];else if(n==="/"||n===""){let y=le(b,f,o,p);y&&y.length>0?h=[f,...y]:h=[f];}else if(h.length>0)h=[f,...h];else return [];s&&h.forEach(y=>{y.url.includes("?")||(y.url=`${y.url}?${s}`,y.route&&(y.hash=nt(y)));});let m=h[h.length-1];if(l<0){let y=h[h.length-1];return [...h.slice(0,-1),{...y,route:void 0,error:new _t(y),redirectFrom:u.length>0?[...u]:void 0}]}if(u.some(y=>y.url===n)){let y=h[h.length-1];return [...h.slice(0,-1),{...y,route:void 0,error:new wt(y),redirectFrom:u.length>0?[...u]:void 0}]}if(m?.route?.redirect){let y=ie(m.route.redirect,c,m);if(y===null)return h.map(v=>({...v,redirectFrom:void 0}));let{target:S,mode:E,windowTarget:x,notFound:R,isExternal:_}=y;if(R){let v=h[h.length-1];return [...h.slice(0,-1),{...v,target:x,error:new W(S,v),redirectFrom:u.length>0?[...u]:void 0}]}if(_){let v=h[h.length-1];return [...h.slice(0,-1),{...v,target:x||"_blank",error:new st(S,x||"_blank"),redirectFrom:u.length>0?[...u]:void 0}]}let g=[...u,{url:n,mode:E}],d=Y(S,t,{...e,_redirectChain:g,maxRedirect:l-1});if(d.some(v=>v.error!==void 0))return d;if(!(d.length>1&&d.slice(1).some(v=>v.route!==void 0))){let v=h[h.length-1];return [...h.slice(0,-1),{...v,target:x,error:new W(S,v),redirectFrom:u.length>0?[...u]:void 0}]}return d.map(v=>({...v,target:x}))}if(e?.redirect&&!m?.route?.redirect&&u.length===0){let y=ie(e.redirect,c,m);if(y){let{target:S,mode:E,windowTarget:x,notFound:R,isExternal:_}=y;if(R){let v=h[h.length-1];return [...h.slice(0,-1),{...v,target:x,error:new W(S,v),redirectFrom:u.length>0?[...u]:void 0}]}if(_){let v=h[h.length-1];return [...h.slice(0,-1),{...v,target:x||"_blank",error:new st(S,x||"_blank"),redirectFrom:u.length>0?[...u]:void 0}]}let g=[...u,{url:n,mode:E}],d=Y(S,t,{...e,_redirectChain:g,maxRedirect:l-1});if(d.some(v=>v.error!==void 0))return d;if(!(d.length>1&&d.slice(1).some(v=>v.route!==void 0))){let v=h[h.length-1];return [...h.slice(0,-1),{...v,target:x,error:new W(S,v),redirectFrom:u.length>0?[...u]:void 0}]}return d.map(v=>({...v,target:x}))}}return h.map(y=>({...y,redirectFrom:u.length>0?[...u]:void 0}))}function mr(a){let t=a.trim();if(t==="/"||t===""||t==="./")return ["/"];let e=t.replace(/^\/+|\/+$/g,"");return e?e.split("/").filter(Boolean):["/"]}function Ie(a){let t=a.path.trim();return t===""||t==="/"||t==="./"}function gr(a,t){let e=!a.children.has(t);return e&&a.children.set(t,{route:{path:t},children:new Map}),{node:a.children.get(t),isNew:e}}function yr(a){return a.default===true}function Ce(a){let t=[];for(let[,e]of a.children){let{children:r,...o}=e.route,n={...o};e.children.size>0?n.children=Ce(e):r!==void 0&&!Array.isArray(r)?n.children=r:Array.isArray(r)&&(n.children=[]),t.push(n);}return t}function Ot(a,t){let e=mr(t.path);if(e.length===1&&e[0]==="/"&&!yr(t)){if(Array.isArray(t.children))for(let i of t.children)Ot(a,i);return}let o=e[e.length-1]==="**",n=a;for(let i=0;i<e.length;i++){let s=e[i],u=i===e.length-1,{node:l}=gr(n,s);if(n=l,u){let c=o?{...t,path:s,children:void 0}:{...t,path:s};if(n.route=c,Array.isArray(t.children)&&!o)for(let p of t.children)Ot(n,p);}}}function Tt(a){let t=a?Array.isArray(a)?a:[a]:[];if(t.length===0)return {path:"/"};let e=t.find(Ie),r=t.filter(s=>!Ie(s)),o={route:{},children:new Map};if(e&&Array.isArray(e.children))for(let s of e.children)Ot(o,s);for(let s of r)Ot(o,s);let n={path:"/"};if(e){let{path:s,children:u,...l}=e;Object.assign(n,l);}let i=Ce(o);return i.length>0?n.children=i:e&&!Array.isArray(e.children)&&e.children!==void 0?n.children=e.children:e&&Array.isArray(e.children)&&(n.children=[]),n}function kr(a){let t=[],e=a.split("/").filter(Boolean),r=[];for(let n of e){if(n==="*"){r.push(".*");continue}let i=n.match(/^:(\w+)(?:\((.+)\))?$/);if(i){t.push(i[1]),r.push(`(${i[2]||"[^/]+"})`);continue}let s=n.match(/^<(\w+)(?:\((.+)\))?>$/);if(s){t.push(s[1]),r.push(`(${s[2]||"[^/]+"})`);continue}r.push(n.toLowerCase().replace(/[.+^${}()|[\]\\]/g,"\\$&"));}let o=r.map(n=>"/"+n).join("");return {regex:new RegExp(`^${o}/?$`,"i"),paramNames:t}}function Yo(a,t){let{regex:e,paramNames:r}=kr(a),n=(t.replace(/\/+$/,"")||"/").match(e);if(!n)return {};let i={};return r.forEach((s,u)=>{let l=n[u+1];l!==void 0&&(i[s]=l);}),i}function vr(a){return a.includes("://")||a.startsWith("//")}function br(a,t){return t.split(".").reduce((e,r)=>e?.[r],a)}function Rr(a,t){let e=a.replace(/\{\s*meta\.([\w.]+)\s*\}/g,(r,o)=>{let n=br(t.meta,o);return n==null?"":String(n)});return q(e,{path:t.path,name:t.name??"",timestamp:Date.now()})}function He(a,t,e){let r=a===true?t.routesFile||"routes.json":a,o=Rr(r,t),n=vr(o)||o.startsWith("/")?o:M(t.path,o);return j(n,e)}function Sr(a){let t=[],e=0,r=/\{\}/g,o;for(;(o=r.exec(a))!==null;)o.index>e&&t.push(a.slice(e,o.index)),t.push({placeholder:true}),e=o.index+o[0].length;return e<a.length&&t.push(a.slice(e)),t}function De(a){function t(e,r){return (o,...n)=>{if(!a.debug&&["debug","info"].includes(e))return;if(o instanceof Error){r(`[${e.toUpperCase()}] ${o.message}`,...n);return}let i=[];for(let c of n)if(typeof c=="function"){let p=c();Array.isArray(p)?i.push(...p):i.push(p);}else i.push(c);let s=Sr(o),u=[`[${e.toUpperCase()}]`],l=0;for(let c of s)if(typeof c=="object"&&c.placeholder){if(l<i.length){let p=i[l++];if(p==null||p==="")continue;u.push(p);}}else c&&u.push(c);for(;l<i.length;)u.push(i[l++]);r(...u);}}return {debug:t("debug",console.debug),info:t("info",console.info),warn:t("warn",console.warn),error:t("error",console.error)}}function Ne(a=10){let t=Math.random().toString(36).substring(2,a+2);return /^\d/.test(t)?t:"s"+t.substring(1)}function Lt(a,t){if(typeof document>"u")return;let{id:e,mode:r="default",location:o="head"}=t||{},n=e||Ne(),i=document.querySelector(`#${n}`);return !i||i.tagName!=="STYLE"?(i=document.createElement("style"),i.id=n,i.textContent=a,(o==="head"?document.head:o==="body"?document.body:o instanceof HTMLElement?o:document.head).appendChild(i),i):(r==="replace"?i.textContent=a:r==="append"&&(i.textContent+=a),i)}var z="autospark.outlet",ce="autospark-outlet-styles",pe=`.autospark-outlet-tabs{display:flex;flex-wrap:wrap;align-items:flex-end;gap:var(--autospark-outlet-tab-gap,2px);padding:var(--autospark-outlet-tabs-padding,0 8px);border-bottom:1px solid var(--autospark-outlet-tab-border-color,#e5e6eb);background:var(--autospark-outlet-tabs-bg,transparent)}
.autospark-outlet-tab{display:inline-flex;align-items:center;gap:6px;padding:var(--autospark-outlet-tab-padding,6px 12px);font-size:var(--autospark-outlet-tab-font-size,13px);line-height:1.4;color:var(--autospark-outlet-tab-color,#4e5969);background:var(--autospark-outlet-tab-bg,transparent);border:1px solid transparent;border-bottom:none;border-radius:var(--autospark-outlet-tab-radius,6px 6px 0 0);cursor:pointer;user-select:none;position:relative;top:1px}
.autospark-outlet-tab:hover{color:var(--autospark-outlet-tab-hover-color,#1d2129);background:var(--autospark-outlet-tab-hover-bg,rgba(0,0,0,.04))}
.autospark-outlet-tab.is-active{color:var(--autospark-outlet-tab-active-color,#165dff);background:var(--autospark-outlet-tab-active-bg,#fff);border-color:var(--autospark-outlet-tab-border-color,#e5e6eb)}
.autospark-outlet-tab-close{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;font-size:12px;line-height:1;color:var(--autospark-outlet-tab-close-color,#86909c);cursor:pointer}
.autospark-outlet-tab-close:hover{color:var(--autospark-outlet-tab-close-hover-color,#1d2129);background:var(--autospark-outlet-tab-close-hover-bg,rgba(0,0,0,.08))}
/* \u89C6\u56FE\u5BB9\u5668\uFF1A\u52A0\u8F7D\u8986\u76D6\u5C42\u7684\u5B9A\u4F4D\u4E0A\u4E0B\u6587\uFF08ADR-0012 \u51B3\u7B56 1\uFF09 */
.autospark-outlet-view,.autospark-outlet-ephemeral{position:relative}
/* \u5185\u5EFA\u9519\u8BEF\u5757\uFF08ADR-0012 \u51B3\u7B56 2\uFF09 */
.autospark-outlet-error{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--autospark-outlet-error-gap,6px);padding:var(--autospark-outlet-error-padding,56px 24px);text-align:center}
.autospark-outlet-error-status{font-size:var(--autospark-outlet-error-status-font-size,32px);font-weight:600;line-height:1.2;color:var(--autospark-outlet-error-status-color,#1d2129)}
.autospark-outlet-error-message{font-size:var(--autospark-outlet-error-message-font-size,14px);line-height:1.6;color:var(--autospark-outlet-error-message-color,#86909c)}
.autospark-outlet-error-actions{display:flex;align-items:center;gap:var(--autospark-outlet-error-actions-gap,10px);margin-top:var(--autospark-outlet-error-actions-margin-top,10px)}
.autospark-outlet-error-btn{padding:var(--autospark-outlet-error-btn-padding,6px 18px);border:1px solid var(--autospark-outlet-error-btn-border-color,#e5e6eb);border-radius:var(--autospark-outlet-error-btn-radius,4px);background:var(--autospark-outlet-error-btn-bg,transparent);color:var(--autospark-outlet-error-btn-color,#4e5969);font-size:var(--autospark-outlet-error-btn-font-size,13px);line-height:1.5;cursor:pointer;transition:color .15s ease,border-color .15s ease,background .15s ease}
.autospark-outlet-error-btn:hover{color:var(--autospark-outlet-error-btn-hover-color,#165dff);border-color:var(--autospark-outlet-error-btn-hover-border-color,#165dff)}
.autospark-outlet-error-btn:active{background:var(--autospark-outlet-error-btn-active-bg,rgba(22,93,255,.06))}`,Pt=`<div x-define="${z}" class="autospark-outlet" data-autospark-outlet :data-mode="mode">
    <script setup>
    {
        data: function () {
            return {
                views: [],
                ephemeral: {
                    hash: "",
                    html: "",
                    ready: false,
                    raw: false,
                    loading: false,
                    loadingOptions: "",
                    error: null
                },
                active: "",
                mode: "stack",
                keepAlive: false
            };
        },
        methods: {
            /* \u7EC4\u4EF6\u5185\u67E5\u627E router \u5B9E\u4F8B\uFF08DOM \u5411\u4E0A\u904D\u5386\u534F\u8BAE\uFF1Adata-autospark-router \u5BBF\u4E3B\u6302 .router\uFF09 */
            _findRouter: function () {
                var el = this.scope.el;
                while (el) {
                    if (el.hasAttribute && el.hasAttribute("data-autospark-router")) {
                        return el.router || null;
                    }
                    el = el.parentElement;
                }
                return null;
            },
            /* \u5185\u5EFA\u9519\u8BEF\u5757\u300C\u91CD\u8BD5\u300D\uFF08ADR-0012 \u51B3\u7B56 2/3\uFF09\uFF1A\u91CD\u8DD1\u94FE\u4E0A error \u5C42\u52A0\u8F7D */
            retry: function () {
                var router = this._findRouter();
                if (router) router.retry();
            },
            /* \u5185\u5EFA\u9519\u8BEF\u5757\u300C\u8FD4\u56DE\u300D\uFF08ADR-0012 \u51B3\u7B56 2\uFF09\uFF1A\u590D\u7528 router.back() */
            goBack: function () {
                var router = this._findRouter();
                if (router) router.back();
            },
            /* \u9875\u7B7E\u70B9\u51FB\uFF1A\u8D70 router \u5BFC\u822A\uFF08URL \u552F\u4E00\u771F\u76F8\u6E90\uFF0CADR-0003 \u51B3\u7B56 3\uFF09 */
            tabGo: function (tab) {
                if (!tab || !tab.url || tab.hash === this.data.active) return;
                var router = this._findRouter();
                if (router) router.push(tab.url);
            },
            /* \u9875\u7B7E\u5173\u95ED\uFF1A\u5173\u95ED\u5373\u9500\u6BC1\uFF08x-for \u79FB\u9664\u5BF9\u5E94\u89C6\u56FE DOM\uFF09\uFF1B\u5173\u95ED active \u5BFC\u822A\u5230\u76F8\u90BB\u9875\u7B7E\uFF08\u51B3\u7B56 4\uFF09 */
            tabClose: function (tab, event) {
                if (event && event.stopPropagation) event.stopPropagation();
                var views = this.data.views;
                if (!views || views.length <= 1) return;
                var idx = -1;
                for (var i = 0; i < views.length; i++) {
                    if (views[i].hash === tab.hash) { idx = i; break; }
                }
                if (idx < 0) return;
                views.splice(idx, 1);
                if (this.data.active === tab.hash) {
                    var next = views[idx] || views[idx - 1];
                    if (next) {
                        var router = this._findRouter();
                        if (router) router.push(next.url);
                    }
                }
            }
        }
    }
    </script>
    <div class="autospark-outlet-tabs" x-show="mode === 'tabs'" role="tablist" x-for="tab of views" :key="tab.hash">
        <div class="autospark-outlet-tab" role="tab"
            :class="{ 'is-active': tab.hash === active }"
            :aria-selected="tab.hash === active"
            @click="tabGo(tab)">
            <span class="autospark-outlet-tab-title" x-text="tab.title"></span>
            <span class="autospark-outlet-tab-close" x-show="views.length > 1" aria-label="\u5173\u95ED\u9875\u7B7E" @click="tabClose(tab, $event)">\xD7</span>
        </div>
    </div>
    <div class="autospark-outlet-views" x-for="view of views" :key="view.hash">
        <div class="autospark-outlet-view" x-show="view.hash === active" :data-view-hash="view.hash">
            <!-- \u52A0\u8F7D\u8986\u76D6\u5C42\uFF08ADR-0012 \u51B3\u7B56 1\uFF09\uFF1Ax-if \u95E8\u63A7\u663E\u9690\uFF08\u8986\u76D6\u5C42\u5EFA\u62C6\u7531 x-if \u589E\u5220\u7ECF
                 observer \u901A\u9053\u9A71\u52A8\uFF09\uFF1B\u5408\u5E76\u914D\u7F6E\uFF08JSON \u4E32\uFF09\u7ECF\u5C5E\u6027\u7ED1\u5B9A\u6CE8\u5165 x-loading\u2014\u2014
                 \u65E0 value \u5B57\u6BB5 \u2261 \u5B57\u9762\u91CF\u6052\u663E\u793A\uFF0C\u663E\u9690\u5B8C\u5168\u5F52 x-if -->
            <div class="autospark-outlet-loading" x-if="view.loading" :x-loading="view.loadingOptions"></div>
            <!-- \u5185\u5EFA\u9519\u8BEF\u5757\uFF08ADR-0012 \u51B3\u7B56 2\uFF09\uFF1Aview.error = {status, message} \u9A71\u52A8\uFF1B
                 404 \u4EC5\u300C\u8FD4\u56DE\u300D\uFF0C\u5176\u4F59\u300C\u91CD\u8BD5\u300D+\u300C\u8FD4\u56DE\u300D -->
            <div class="autospark-outlet-error" x-if="view.error">
                <div class="autospark-outlet-error-status" x-text="view.error.status"></div>
                <div class="autospark-outlet-error-message" x-text="view.error.message"></div>
                <div class="autospark-outlet-error-actions">
                    <button type="button" class="autospark-outlet-error-btn" x-show="view.error.status !== 404" @click="retry()">\u91CD\u8BD5</button>
                    <button type="button" class="autospark-outlet-error-btn" @click="goBack()">\u8FD4\u56DE</button>
                </div>
            </div>
            <!-- raw \u89C6\u56FE\u8D70\u666E\u901A x-html \u76F4\u6302\uFF08\u4E0D\u7F16\u8BD1\uFF0CADR-0008\uFF09\uFF1B\u4E24\u8005 x-show \u4E92\u65A5 -->
            <div class="autospark-outlet-view-content" x-show="!view.raw" x-html.compile="view.html"></div>
            <div class="autospark-outlet-view-content" x-show="!!view.raw" x-html="view.html"></div>
        </div>
    </div>
    <div class="autospark-outlet-ephemeral" x-show="ephemeral.hash !== '' && active === ephemeral.hash" :data-view-hash="ephemeral.hash">
        <div class="autospark-outlet-loading" x-if="ephemeral.loading" :x-loading="ephemeral.loadingOptions"></div>
        <div class="autospark-outlet-error" x-if="ephemeral.error">
            <div class="autospark-outlet-error-status" x-text="ephemeral.error.status"></div>
            <div class="autospark-outlet-error-message" x-text="ephemeral.error.message"></div>
            <div class="autospark-outlet-error-actions">
                <button type="button" class="autospark-outlet-error-btn" x-show="ephemeral.error.status !== 404" @click="retry()">\u91CD\u8BD5</button>
                <button type="button" class="autospark-outlet-error-btn" @click="goBack()">\u8FD4\u56DE</button>
            </div>
        </div>
        <div class="autospark-outlet-view-content" x-show="!ephemeral.raw" x-html.compile="ephemeral.html"></div>
        <div class="autospark-outlet-view-content" x-show="!!ephemeral.raw" x-html="ephemeral.html"></div>
    </div>
</div>`;function de(a){Lt(pe,{id:ce}),!a.getComponentDeclaration(z)&&a.registerComponent(Pt,{name:z});}var It="x-outlet",he="x-component:autospark.outlet";function ut(a){a.querySelectorAll(`[${It}]`).forEach(e=>{let r=e.getAttribute(It);e.removeAttribute(It),e.hasAttribute(he)||e.setAttribute(he,r??"");});}var P=class{constructor(t){this.router=t;}test(t,e){return  true}render(t,e,r){return Promise.resolve({value:"",hash:r.hash})}};var G=class extends P{test(t,e){return  true}async render(t,e,r){let o=await t.text(),{selector:n}=r,i={value:o.trim()};try{let s=new DOMParser().parseFromString(o,"text/html");if(ut(s),i.value=s.body.innerHTML.trim(),typeof n=="string"&&n.length>0)try{let u=s.querySelector(n.params({...e.params,...e.query,...e.state}));u&&(i.value=u.innerHTML);}catch(u){this.router.logger.warn(`Invalid selector: ${n}, ${u.message}`);}}catch(s){this.router.logger.error(`\u89C6\u56FE\u5185\u5BB9\u63D0\u53D6\u5931\u8D25: ${s.message}`);}return i}};function lt(a){return a.startsWith("!")}function je(a){return lt(a)?a.slice(1):a}function V(a){let t=a.route;if(!t)return;let e=t._viewOptions?.from??t.view;if(typeof e=="string")return e;if(e&&typeof e=="object"&&typeof e.from=="string")return e.from}var ct=class extends P{test(t,e){return lt(V(e)??"")}async render(t,e,r){return {value:await t.text(),meta:{raw:true}}}};var Ar=[".json"],fe=class extends P{test(t,e){let r=V(e);if(!r)return  false;let o=r.split("?")[0].split("#")[0].toLowerCase();return Ar.some(n=>o.endsWith(n))}async render(t,e,r){let o=await t.text(),n;try{n=JSON.parse(o);}catch(u){return {value:o,error:new Error(`JSON \u89C6\u56FE\u89E3\u6790\u5931\u8D25: ${u.message}`)}}return {value:`<pre class="autospark-json-view">${JSON.stringify(n,null,2).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>`}}};var $e=[".png",".jpg",".jpeg",".gif",".webp",".svg",".bmp",".ico",".avif"],me=class extends P{test(t,e){let r=V(e);if(!r)return  false;let o=r.split("?")[0].split("#")[0].toLowerCase();return $e.some(n=>o.endsWith(n))}async render(t,e,r){return {value:`<img class="autospark-image-view" src="${(r.url||t.url).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}" alt="">`}}};var Be=(a,t,e=[])=>{let r=Object.getOwnPropertyDescriptors(t);for(let o of e)delete r[o];Object.defineProperties(a,r);},Z=(a,t=[a])=>{let e=Object.getPrototypeOf(a);return e===null?t:Z(e,[...t,e])},_r=(...a)=>{if(a.length===0)return;let t,e=a.map(r=>Z(r));for(;e.every(r=>r.length>0);){let r=e.map(n=>n.pop()),o=r[0];if(r.every(n=>n===o))t=o;else break}return t},Ve=(a,t,e=[])=>{var r;let o=(r=_r(...a))!==null&&r!==void 0?r:Object.prototype,n=Object.create(o),i=Z(o);for(let s of a){let u=Z(s);for(let l=u.length-1;l>=0;l--){let c=u[l];i.indexOf(c)===-1&&(Be(n,c,["constructor",...e]),i.push(c));}}return n.constructor=t,n},ge=a=>a.filter((t,e)=>a.indexOf(t)==e),ze=new WeakMap,xr=a=>ze.get(a),Er=(a,t)=>ze.set(a,t);var Ue=(a,t)=>{var e,r;let o=ge([...Object.getOwnPropertyNames(a),...Object.getOwnPropertyNames(t)]),n={};for(let i of o)n[i]=ge([...(e=a?.[i])!==null&&e!==void 0?e:[],...(r=t?.[i])!==null&&r!==void 0?r:[]]);return n},Fe=(a,t)=>{var e,r,o,n;return {property:Ue((e=a?.property)!==null&&e!==void 0?e:{},(r=t?.property)!==null&&r!==void 0?r:{}),method:Ue((o=a?.method)!==null&&o!==void 0?o:{},(n=t?.method)!==null&&n!==void 0?n:{})}},Ke=(a,t)=>{var e,r,o,n,i,s;return {class:ge([...(e=a?.class)!==null&&e!==void 0?e:[],...(r=t?.class)!==null&&r!==void 0?r:[]]),static:Fe((o=a?.static)!==null&&o!==void 0?o:{},(n=t?.static)!==null&&n!==void 0?n:{}),instance:Fe((i=a?.instance)!==null&&i!==void 0?i:{},(s=t?.instance)!==null&&s!==void 0?s:{})}},ye=new Map,Mr=(...a)=>{var t;let e=new Set,r=new Set([...a]);for(;r.size>0;)for(let o of r){let n=Z(o.prototype).map(l=>l.constructor),i=(t=xr(o))!==null&&t!==void 0?t:[],u=[...n,...i].filter(l=>!e.has(l));for(let l of u)r.add(l);e.add(o),r.delete(o);}return [...e]},Or=(...a)=>{let t=Mr(...a).map(e=>ye.get(e)).filter(e=>!!e);return t.length==0?{}:t.length==1?t[0]:t.reduce((e,r)=>Ke(e,r))};function Je(...a){var t,e,r;let o=a.map(u=>u.prototype);function i(...u){for(let l of a)Be(this,new l(...u));}i.prototype=Ve(o,i),Object.setPrototypeOf(i,Ve(a,null,["prototype"]));let s=i;{let u=Or(...a);for(let l of (t=u?.class)!==null&&t!==void 0?t:[]){let c=l(s);c&&(s=c);}qe((e=u?.static)!==null&&e!==void 0?e:{},s),qe((r=u?.instance)!==null&&r!==void 0?r:{},s.prototype);}return Er(s,a),s}var qe=(a,t)=>{let e=a.property,r=a.method;if(e)for(let o in e)for(let n of e[o])n(t,o);if(r)for(let o in r)for(let n of r[o])n(t,o,Object.getOwnPropertyDescriptor(t,o));};var Ht=class{attachContextProvider(){this._onContextRequest=this.onContextRequest.bind(this),this.host.addEventListener("context-request",this._onContextRequest);}removeContextProvider(){this._onContextRequest&&this.host.removeEventListener("context-request",this._onContextRequest);}onContextRequest(t){let e=t.detail;e.context==="AutoSparkRouter"&&(t.stopPropagation(),e.callback(this));}};var tt=class extends Error{constructor(){super(...arguments),this.name="AbortError";}},ke=class extends Error{constructor(){super(...arguments),this.name="TimeoutError";}},Pr=0;function N(a){let{autoReset:t=false,abortAt:e="all",until:r,abortSignal:o}=a||{},n=false,i=false,s=true,u=false,l,c,p=0,f,b=++Pr,h=null,A=null,m,y,S=0,E={},x=function(){clearTimeout(p),h&&e==="all"&&h.abort(),n=false,i=false,s=true,u=false,y=void 0,m=void 0,S=0,h=null,f=new Promise((_,g)=>{l=_,c=g;});};x();async function R(_){let{timeout:g=0,returns:d,abortSignal:k}=_||{};if(k&&!k.aborted&&k.addEventListener("abort",()=>R.abort(),{once:true}),typeof r=="function"&&r())return n=true,m;if(n||i)if(t)x();else {if(i)throw y;return m}return g>0&&(p=setTimeout(()=>{if(!(u||!s||n||i)){u=true,s=false,d instanceof Error?(i=true,n=false):(n=true,i=false);try{S=Date.now(),d instanceof Error?(y=d,c(d)):(m=d,l(m));}catch{}finally{u=false;}}},g)),f}return R.id=b,R.resolve=_=>{if(clearTimeout(p),!(typeof r=="function"&&!r())&&!(u||!s||n||i)){u=true,s=false,n=true,i=false;try{h&&(e==="all"||e==="resolve")&&h.abort(),m=_,y=void 0,S=Date.now(),l(_);}catch{}finally{u=false;}}},R.reject=_=>{if(clearTimeout(p),!(u||!s||n||i)){u=true,s=false,n=false,i=true;try{let g=typeof _=="string"?new Error(_):_ instanceof Error?_:new Error;y=g,S=Date.now(),h&&(e==="all"||e==="reject")&&h.abort(),f?.catch(()=>{}),c(g);}catch{}finally{u=false;}}},R.destroy=()=>{try{clearTimeout(p),A&&o&&(o.removeEventListener("abort",A),A=null),s&&(setTimeout(()=>{try{c(new tt);}catch{}}),h&&h.abort()),n=!1,i=!1,s=!1,u=!1,f=null,h=null,m=void 0,y=void 0,S=0;}catch{}},R.reset=x,R.isFulfilled=()=>n,R.isRejected=()=>i,R.isPending=()=>s,Object.defineProperty(R,"result",{get:()=>m,enumerable:true,configurable:true}),Object.defineProperty(R,"error",{get:()=>y,enumerable:true,configurable:true}),Object.defineProperty(R,"timestamp",{get:()=>S,enumerable:true,configurable:true}),Object.defineProperty(R,"meta",{get:()=>E,enumerable:true,configurable:true}),R.abort=()=>{h&&h.abort(),R.reject(new tt);},o&&!o.aborted&&(A=()=>{R.abort(),A&&o&&(o.removeEventListener("abort",A),A=null);},o.addEventListener("abort",A)),R.getAbortSignal=()=>(h===null&&(h=new AbortController),h?.signal),R}N.resolve=a=>{let t=N();return t.resolve(a),t};N.reject=a=>{let t=N();return t().catch(()=>{}),t.reject(a),t};var Q;function Dt(){Q||(Q=new Map);}var ve={get:a=>(Dt(),Q.get(a)),set:(a,t)=>{Dt(),Q.set(a,t);},delete:a=>{Dt(),Q.delete(a);},clear:()=>{Dt(),Q.clear();}};function Xe(a){let t=a.trim(),e=t.indexOf("?");e!==-1&&(t=t.substring(0,e));let r=t.indexOf("#");r!==-1&&(t=t.substring(0,r));let o=t;if(o.endsWith("/"))o=o+"data.json";else {let n=o.lastIndexOf("/"),i=o.lastIndexOf(".");i!==-1&&i>n?o=o.substring(0,i)+".json":o=o+".json";}return o}function dt(a){if(!a||typeof a!="object")return  false;let t=Object.getPrototypeOf(a);return t===null||t===Object.prototype||Object.getPrototypeOf(t)===null?Object.prototype.toString.call(a)==="[object Object]":false}function et(a){return a&&typeof a=="function"}(a=>typeof U<"u"?U:typeof Proxy<"u"?new Proxy(a,{get:(t,e)=>(typeof U<"u"?U:t)[e]}):a)(function(a){if(typeof U<"u")return U.apply(this,arguments);throw Error('Dynamic require of "'+a+'" is not supported')});var Ir=/<[^>]+>/;function rt(a){if(typeof a!="string"||a.trim()==="")return  false;let t=a.trim();return !(t.includes(`
`)||Ir.test(t))}function Ye(a,t){let e=t;for(let r=0;r<a.length;r++)e^=a.charCodeAt(r),e=Math.imul(e,16777619),e|=0;return e}function Cr(a){let t=a.toString(),e=Ye(t,2166136261),r=Ye(t,2216829733),o=(e>>>0).toString(16).padStart(8,"0"),n=(r>>>0).toString(16).padStart(8,"0");return o+n}function Hr(a){return a.map(t=>Cr(t)).join("|")}function Ge(...a){if(a.length!==0){if(a.length===1)return a[0];for(let t of a)if(t.aborted)return t;return typeof AbortSignal.any=="function"?AbortSignal.any(a):Dr(a)}}function Dr(a){let t=new AbortController,e=()=>{t.abort();for(let r of a)r.removeEventListener("abort",e);};for(let r of a)r.addEventListener("abort",e);return t.signal}function ht(a,...t){if(!a)return;let e=Array.isArray(a)?a:[a];for(let r of e)if(typeof r=="function")try{let o=r(...t);o&&typeof o=="object"&&typeof o.then=="function"&&o.catch(()=>{});}catch{}}var Ze=class T{constructor(t,e){this.loader=t,this.loading=false,this.id=0,this._retryTimerId=0,this._loadToken=0,this._strategy="fallback",this._presetSettled=false;var r;if(this.options=Object.assign({autostart:true,cache:0,retry:0,retryDelay:0,storage:ve,multiplex:"off",meta:{}},e),this._loaders.length===0)throw new Error("AsyncLoader requires at least one loader");let o=this._loaders.length>1;if(this.options.multiLoaderStrategy==="combine"&&o){if(typeof this.options.onResults!="function")throw new Error('multiLoaderStrategy="combine" requires onResults');this._strategy="combine";}else this._strategy="fallback";let n=(r=this.options.multiplex)!=null?r:"off";if((n!=="off"||this.options.cache>0)&&!this.options.hash&&(this.options.hash=Hr(this._loaders)),n!=="off"){T.loaderCache!=null||(T.loaderCache=new Map);let i=T._getLoader(this.options.hash);if(i)return i.loading&&this.options.multiplex==="restart"&&(i.clear(),i.abort(),i.load()),i;T.loaderCache.set(this.options.hash,new WeakRef(this));}this.id=++T.seq,this.signal=N(),this.options.autostart&&this.load();}static _getLoader(t){let e=T.loaderCache;if(!e)return;let r=e.get(t);if(!r)return;let o=r.deref();return o||e.delete(t),o}static clearLoaderCache(){var t;(t=T.loaderCache)==null||t.clear();}static resolve(t){let e=new T(()=>t,{autostart:false});return e._presetSettled=true,e.signal.resolve(t),e}static reject(t){let e=new T(()=>{throw t},{autostart:false});return e._presetSettled=true,e.signal.reject(t),e}get _loaders(){return Array.isArray(this.loader)?this.loader:[this.loader]}get storage(){return this.options.storage}get hash(){return this.options.hash}get meta(){return this.options.meta}get error(){return this.signal.error}get result(){return this.signal.result}load(){var t;if(this.loading)return;(this.signal.isFulfilled()||this.signal.isRejected())&&this.signal.reset();let e=this._getCacheItem();if(e){this.signal.resolve(e.value),this._removeFromLoaderCache();return}let r=[this.signal.getAbortSignal()];this.options.abortSignal&&r.push(this.options.abortSignal);let o=Ge(...r);((t=this.options.multiplex)!=null?t:"off")!=="off"&&this.options.hash&&(T.loaderCache!=null||(T.loaderCache=new Map),T.loaderCache.set(this.options.hash,new WeakRef(this))),ht(this.options.onPending),this.loading=true,this._loadToken++,this._executeLoad(o,0);}_executeLoad(t,e){let r=this._loadToken,o=0,n=null;this.options.timeout&&this.options.timeout>0&&(n=new AbortController,o=setTimeout(()=>n.abort(),this.options.timeout));let i=[t];n&&i.push(n.signal);let s={abortSignal:Ge(...i),meta:this.meta},u;try{u=this._composedLoader(s);}catch(l){u=Promise.reject(l);}Promise.resolve(u).then(l=>{o&&clearTimeout(o),r===this._loadToken&&(this._setCacheItem(l),this.loading=false,this.signal.resolve(l),this._removeFromLoaderCache(),ht(this.options.onFulfilled,l));}).catch(l=>{var c,p;if(o&&clearTimeout(o),r!==this._loadToken)return;let f=(c=this.options.retry)!=null?c:0;if(e<f&&!t.aborted)this._retryTimerId=setTimeout(()=>{this._retryTimerId=0,this._executeLoad(t,e+1);},(p=this.options.retryDelay)!=null?p:0);else {let b=n!=null&&n.signal.aborted?new ke:l;if(this.loading=false,!t.aborted&&this.options.defaultValue!==void 0)this.signal.resolve(this.options.defaultValue),this._removeFromLoaderCache(),ht(this.options.onFulfilled,this.options.defaultValue);else {let h=t.aborted;this.signal.reject(b),this._removeFromLoaderCache(),h||ht(this.options.onRejected,b);}}});}_composedLoader(t){let e=this._loaders;return this._strategy==="combine"&&e.length>1?this._composeCombine(t):e.length===1?e[0](t):this._composeFallback(t)}_composeFallback(t){return new Promise((e,r)=>{let o=this._loaders,n=t.abortSignal,i=0,s,u=()=>{if(n.aborted){r(new tt);return}if(i>=o.length){r(s??new Error("all loaders failed"));return}let l=o[i++],c;try{c=l(t);}catch(p){c=Promise.reject(p);}Promise.resolve(c).then(p=>e(p),p=>{s=p instanceof Error?p:new Error(String(p)),u();});};u();})}_composeCombine(t){let e=this._loaders.map(r=>{try{return Promise.resolve(r(t))}catch(o){return Promise.reject(o)}});return Promise.allSettled(e).then(r=>{if(t.abortSignal.aborted)throw new tt;let o=r.map(n=>n.status==="fulfilled"?n.value:n.reason instanceof Error?n.reason:new Error(String(n.reason)));return this.options.onResults(o,this.options.defaultValue)})}_removeFromLoaderCache(){var t;let e=T.loaderCache;this.options.hash&&((t=e?.get(this.options.hash))==null?void 0:t.deref())===this&&e.delete(this.options.hash);}_useCache(){return this.options.cache>0&&this.options.hash}_setCacheItem(t){this._useCache()&&this.storage.set(this.options.hash,{value:t,timestamp:Date.now()});}_getCacheItem(){if(!this._useCache())return;let t=this.storage.get(this.options.hash);if(t){if(Date.now()-t.timestamp>this.options.cache){this.storage.delete(this.options.hash);return}return t}}get(t){let e=this._useCache()&&!this._getCacheItem();return !this._presetSettled&&!this.loading&&(!this.signal.isFulfilled()||e)&&this.load(),this.signal(t)}invalidate(){this._presetSettled=false,this.clear(),!this.loading&&(this.signal.isFulfilled()||this.signal.isRejected())&&this.signal.reset();}refresh(t){return this._presetSettled=false,this.loading&&this.abort(),this.clear(),this.load(),this.signal(t)}abort(){let t=this.loading;this.signal.abort(),this.loading=false,this._removeFromLoaderCache(),this._retryTimerId&&(clearTimeout(this._retryTimerId),this._retryTimerId=0),t&&ht(this.options.onRejected,this.signal.error);}clear(){this._useCache()&&this.options.hash&&this.storage.delete(this.options.hash);}clearAll(){this.storage.clear();}isPending(){return this.loading}isFulfilled(){return this.signal.isFulfilled()}isRejected(){return this.signal.isRejected()}};Ze.seq=0;var Qe=Ze;var Nt=class{constructor(t){this.cache=new Map;this.router=t,this.options=Object.assign({timeout:0,cache:0,hash:"{path}"},t.options.dataOptions||{});}getLoader(t){return t.route._getData}getSignal(t){return this.getLoader(t)?.signal}_createLoader(t,e,r){let o=this._createLoaderFn(t,e),n=new Qe(o,{hash:t.hash,meta:{hash:t.hash},cache:e.cache,timeout:e.timeout,retry:e.retry,retryDelay:e.retryDelay,multiplex:e.multiplex,defaultValue:e.default,abortSignal:r,storage:this.cache});return t.route._getData=n,n}_createLoaderFn(t,e){return async({abortSignal:r,meta:o})=>{let n=e.from;if(dt(n)&&!rt(n))return this._validateData(n);if(rt(n)||n===true){let i=n===true?this._getAutoUrl(t):n;if(!i)throw new H("No valid URL found");let s=i.params(J(t)),u=j(this.router.language?.rewriteUrl(s,"data")??s,this.router.options.base);o.url=u;let l=await fetch(u,{signal:r});if(!l.ok)throw o.statusCode=l.status,new H(`Failed to load ${u} : ${l.statusText}`,l.status);return this._validateData(await l.json())}if(et(n))return this._validateData(await n(t));throw new H("Invalid data source")}}_getRouteOptions(t){return t.route._dataOptions||(t.route._dataOptions=this._mergeRouteOptions(t)),t.route._dataOptions}_mergeRouteOptions(t){let e=t.route.data||{},r=dt(e)&&"from"in e;return {...this.options,...r?e:{from:e}}}loadStateOf(t){if(t.route)return t.route._dataLoadState}setLoadState(t,e){t.route&&(t.route._dataLoadState=e);}resetLoadStates(t){for(let e of t)e.route&&delete e.route._dataLoadState;}loadRoutes(t,e,r=0){return Promise.allSettled(t.map((o,n)=>{if(!(n<r&&this.loadStateOf(o)==="ok"))return this._loadRoute(o,e)}))}async _loadRoute(t,e){if(!t.route?.data)return;let r=this._getRouteOptions(t);try{await this._createLoader(t,r,e).get(),this.setLoadState(t,"ok");}catch(o){o.name!=="AbortError"&&(this.setLoadState(t,"error"),this.router.logger.error(`DataLoader: Failed to load data for route ${t.path}`,()=>[o]));}}_getHash(t,e){return e.hash?$(e.hash,t):$("{path}",t)}_isValidData(t){return dt(t)}_validateData(t){if(!this._isValidData(t))throw new H("Invalid data format: expected plain object");return t}_getAutoUrl(t){if(t.route){let e=t.route.view,r=typeof e=="function"?e(t):e;if(typeof r=="string")return Xe(r)}}async loadDatas(t,e,r=0){return this.loadRoutes(t,e,r)}invalidateRoute(t){this.getLoader(t)?.invalidate();}async refreshRoute(t){let e=this.getLoader(t);if(!e)throw new Error("No loader found for this route");return await e.refresh()}abortRoute(t){this.getLoader(t)?.abort();}isLoading(t){return this.getLoader(t)?.loading||false}cleanup(){this.cache.clear();}};var jt=class{constructor(t){this.router=t,this.hooks={beforeRoute:[],afterRoute:[],beforeRender:[],afterRender:[],routeError:[]},this.options=Object.assign({timeout:3e3},t.options.hookOptions),this._addGlobalHooks();}_addGlobalHooks(){let t=["beforeRoute","afterRoute","beforeRender","afterRender"];for(let e of t){let r=this.router.options[e];r&&(Array.isArray(r)?this.hooks[e].push(...r):typeof r=="function"&&this.hooks[e].push(r));}}add(t,e){this.hooks[t].push(e);}remove(t,e){let r=this.hooks[t].indexOf(e);r>-1&&this.hooks[t].splice(r,1);}clear(t){t?this.hooks[t]=[]:Object.keys(this.hooks).forEach(e=>{this.hooks[e]=[];});}async runBeforeRoute(t){return this._runHooks("beforeRoute",t)}async runAfterRoute(t){return this._runHooks("afterRoute",t,{mode:"parallel"})}async runBeforeRender(t){return this._runHooks("beforeRender",t)}async runAfterRender(t){return this._runHooks("afterRender",t,{mode:"parallel"})}async runRouteError(t){return this._runHooks("routeError",t,{mode:"parallel"})}async _runHooks(t,e,r){let{mode:o,ignoreErrors:n}=Object.assign({mode:"serial",ignoreErrors:true},r),{to:i}=e,s=[...this.hooks[t],...i.flatMap(u=>u.route?.[t]||[])];if(o==="serial")for(let u of s)try{let l=await this._runHook(u,e);if(l===!1)return !1;if(typeof l=="string")return l}catch(l){if(n)continue;throw this.router.logger.error(`Error executing hook: ${l.message}`),l}else return await Promise.allSettled(s.map(u=>this._runHook(u,e)));return  true}_runHook(t,e){return new Promise((r,o)=>{let n=this.options.timeout>0?setTimeout(()=>{o(new Error(`Hook timeout after ${this.options.timeout}ms`));},this.options.timeout):0;Promise.resolve(t.apply(this.router,[e])).then(i=>{clearTimeout(n),r(i);}).catch(i=>{clearTimeout(n),o(i);});})}};var $t=class{};var Vt=class{};var Ut=class{};var Nr=new Set(["STYLE","SCRIPT","TITLE","TEXTAREA"]),jr={delay:200,bgColor:"white",opacity:.6},qt=class qt{async _loadSignal(t){if(!t)return;let e=typeof t=="function"?t:t.signal,r={};try{let o=await e();r.value=o&&typeof o=="object"&&"value"in o?o.value:o,r.hash=e.meta.hash,r.meta=o&&typeof o=="object"&&"meta"in o?o.meta:void 0;}catch(o){r.error=new X(o.message,o.status||500);}return r}async _loadView(t){let e=t.route;return await this._loadSignal(e._getView)}async _loadData(t){let e=t.route;return await this._loadSignal(e._getData)}_resolveLoadingOptions(t){let e=t.loading;if(e===false)return {loading:false,loadingOptions:""};let r;typeof e=="string"?r={message:e}:e&&typeof e=="object"&&(r=e);let o={...jr,...r??{}};return {loading:true,loadingOptions:JSON.stringify(o)}}_routeReject(t,e,r,o,n,i){if(this.hooks.runRouteError({error:t,to:i}),!e||!r)return;let s=typeof t?.status=="number"?t.status:500,u=this._getErrorPage(t,i),l=u?{...o,html:u.outerHTML,ready:true,loading:false,loadingOptions:"",error:null}:{...o,html:"",ready:false,loading:false,loadingOptions:"",error:{status:s,message:t?.message}};n?this._mountView(e,r,l):this._mountEphemeral(e,l);}_getCommonRouteIndex(t,e){let r=0;if(t&&t.length>0)for(let o=0;o<Math.min(t.length,e.length)&&t[o].url===e[o].url;o++)r=o+1;return this.logger.debug("{} -> \u516C\u5171\u8DEF\u7531\u5C42\u6570: {}",e[0].id,r),r}_injectRouteData(t,e,r){let o=r.route,n={...e&&typeof e=="object"?e:{},$route:{path:o?.path,name:o?.name,title:o?.title},$params:r.params||{},$query:r.query||{},$state:r.state||{}},s=`<script type="autospark/data">${JSON.stringify(n).replace(/</g,"\\u003c")}</script>`,u=document.createElement("template");u.innerHTML=t;let l=false;for(let c of Array.from(u.content.children))Nr.has(c.tagName)||(c.insertAdjacentHTML("beforeend",s),l=true);return l?u.innerHTML:(this.logger.debug("{} -> \u89C6\u56FE\u65E0\u53EF\u6CE8\u5165\u5143\u7D20\u6839\uFF0C\u8DEF\u7531\u6570\u636E\u672A\u6CE8\u5165",r.id),t)}_getOutletComponent(t){let e=this.engine?.getComponent(t);return e||(this.logger.error("{} -> outlet \u5BBF\u4E3B\u672A\u5173\u8054\u7EC4\u4EF6\u5B9E\u4F8B\uFF0C\u65E0\u6CD5\u6E32\u67D3\u89C6\u56FE",t.tagName),null)}_getRootOutlet(){return at(this.host)[0]??null}_resolveKeepAlive(t,e){return e?.data.mode==="tabs"?true:typeof t.keepAlive=="boolean"?t.keepAlive:e?.data.keepAlive===true}_outletData(t,e){this.engine?.data(t,e);}_mountView(t,e,r){let o=e.data.views,n=o.find(s=>s.hash===r.hash);if(n&&n.ready&&!n.error){this._outletData(t,{active:r.hash});return}let i=n?o.map(s=>s.hash===r.hash?{...s,html:r.html||"",ready:!!r.ready,raw:!!r.raw,loading:!!r.loading,loadingOptions:r.loadingOptions??"",error:r.error??null}:s):[...o,{hash:r.hash,url:r.url,title:r.title,html:r.html||"",ready:!!r.ready,raw:!!r.raw,loading:!!r.loading,loadingOptions:r.loadingOptions??"",error:r.error??null}];this._outletData(t,{views:i,active:r.hash});}_mountEphemeral(t,e){this._outletData(t,{ephemeral:{hash:e.hash,html:e.html||"",ready:!!e.ready,raw:!!e.raw,loading:!!e.loading,loadingOptions:e.loadingOptions??"",error:e.error??null},active:e.hash});}_findNestedOutlet(t,e){let r=t.querySelector(`[data-view-hash="${e}"]`);return r instanceof HTMLElement?at(r)[0]??null:null}async _awaitNestedOutlet(t,e,r){for(let o=0;o<=qt.NESTED_OUTLET_MICROTASK_RETRIES;o++){if(t.aborted)return null;let n=this._findNestedOutlet(e,r);if(n)return n;await Promise.resolve();}return null}_isCommonLayerReusable(t,e){let r=this.engine?.getComponent(t);if(r?.data.active!==e)return  false;let o=r.data.ephemeral;if(o&&o.hash===e)return !!o.ready&&!o.error;let n=r.data.views.find(i=>i.hash===e);return !!n?.ready&&!n.error}_closestOutlet(t,e){let r=t.parentElement;for(;r&&r!==e;){if(r instanceof HTMLElement&&r.hasAttribute("data-autospark-outlet"))return r;r=r.parentElement;}return null}async _renderRoutes(t,e,r){let o,n=null;try{let i=this._getRootOutlet();if(!i){this.logger.error("\u5BBF\u4E3B\u5185\u672A\u627E\u5230 autospark.outlet \u51FA\u53E3\uFF0C\u8DF3\u8FC7\u6E32\u67D3\uFF08\u6CE8\u5165\u6A21\u5F0F\u987B\u5728\u6A21\u677F\u4E2D\u58F0\u660E\u51FA\u53E3\u5143\u7D20\uFF09"),this.emit("render:after",{route:t,error:o,slot:null});return}this.emit("render:before",{route:t});let s=this._getCommonRouteIndex(e,t),u="",l=i,c=!1;for(let p=0;p<t.length;p++){if(r.aborted)return;let f=t[p],b=f.route;if(b){if(p===0)l=i;else if(c){let E=await this._awaitNestedOutlet(r,l,u);if(r.aborted)return;if(E)l=E;else {let x=t.map(R=>R.route?.path??"?").join(" > ");p===1?this.logger.debug("{} -> \u5C42 {} \u672A\u627E\u5230\u5D4C\u5957\u51FA\u53E3\uFF0C\u56DE\u9000\u6CBF\u7528\u4E0A\u4E00\u5C42\u51FA\u53E3\uFF08\u8DEF\u5F84\u94FE {}\uFF09",t[0].id,p,x):this.logger.warn("{} -> \u5C42 {} \u672A\u627E\u5230\u5D4C\u5957\u51FA\u53E3\uFF0C\u56DE\u9000\u6CBF\u7528\u4E0A\u4E00\u5C42\u51FA\u53E3\uFF08\u8DEF\u5F84\u94FE {}\uFF09",t[0].id,p,x);}}let h=f.hash;u=h;let A=!!f.route?.view;if(c=A,p<s&&(!A||this._isCommonLayerReusable(l,h)))continue;let m=A?this._getOutletComponent(l):null,y=this._resolveKeepAlive(b,m),S={hash:h,url:f.url,title:b.title||h,raw:!1};A&&(this._lastViewSlot=l,n=l);try{if(r.aborted){this.logger.debug("\u6570\u636E\u52A0\u8F7D\u524D\u88AB\u4E2D\u6B62");return}let E=m?.data.views.find(g=>g.hash===h&&g.ready&&!g.error)??null,x=!!(y&&E);if(!x&&m&&b._getView){let g=this._resolveLoadingOptions(b),d={...S,html:"",ready:!1,loading:g.loading,loadingOptions:g.loadingOptions,error:null};y?this._mountView(l,m,d):this._mountEphemeral(l,d);}m&&this._outletData(l,{active:h});let R=await this._loadData(f);if(r.aborted){this.logger.debug("\u89C6\u56FE\u52A0\u8F7D\u524D\u88AB\u4E2D\u6B62");return}let _=await this._loadView(f);if(_)if(_.error){this._routeReject(_.error,l,m,S,y,t);break}else {if(await this._runBeforeRender(e||[],t,l,R?.value),m)if(x)this._outletData(l,{active:h});else {let g=_.meta?.raw===!0,d=g?_.value:this._injectRouteData(_.value,R?.value,f),k={...S,html:d,ready:!0,loading:!1,loadingOptions:"",error:null,raw:g};y?this._mountView(l,m,k):this._mountEphemeral(l,k);}this._runAfterRender(e||[],t,l);}}catch(E){this.logger.error("\u89C6\u56FE\u6216\u6570\u636E\u52A0\u8F7D\u5931\u8D25",E),m&&this._routeReject(E,l,m,S,y,t);break}}else {let h=this._getOutletComponent(l);h&&this._mountView(l,h,{hash:f.hash,url:f.url,title:"404",html:"",ready:!1,raw:!1,loading:!1,loadingOptions:"",error:{status:404,message:`\u9875\u9762\u672A\u627E\u5230: ${f.url}`}});break}}if(e&&e.length>t.length&&!r.aborted){let p=l;for(let f=t.length;f<e.length&&!r.aborted;f++){let b=e[f];if(!b.route?.view)break;let h=p.querySelector(`[data-view-hash="${b.hash}"]`);if(!(h instanceof HTMLElement))break;let A=this._closestOutlet(h,p);if(!A)break;this._outletData(A,{active:""}),p=A;}}}catch(i){this.logger.error(`\u6E32\u67D3\u5931\u8D25: ${i.message}`,i),o=i;}finally{this.emit("render:after",{route:t,error:o,slot:n});}}async _runBeforeRender(t,e,r,o){try{await this.hooks.runBeforeRender({from:t,to:e,view:r,data:o});}catch(n){this.logger.error("\u6E32\u67D3\u6D41\u7A0B: beforeRender \u94A9\u5B50\u6267\u884C\u5931\u8D25",n);}}_runAfterRender(t,e,r){this.hooks.runAfterRender({from:t,to:e,el:r}).catch(o=>{this.logger.error("\u6E32\u67D3\u6D41\u7A0B: afterRender \u94A9\u5B50\u6267\u884C\u5931\u8D25",o);});}_getErrorPage(t,e){let r=String(t.status||500),o=this.options.errorPages??{},n=o[r]||o["*"];if(!n)return null;try{return typeof n=="function"?n(t,e):n}catch(i){this.logger.error("\u9519\u8BEF\u5904\u7406\u5668\u6267\u884C\u5931\u8D25",i);let s=o["*"];return !s||s===n?null:typeof s=="function"?s(i,e):s}}_findOutlet(t){return at(t)[0]||null}_ensureDefaultOutlet(){at(this.host).length>0||this.logger.warn("\u5BBF\u4E3B\u5185\u672A\u627E\u5230 autospark.outlet \u51FA\u53E3\uFF1A\u8BF7\u5728\u6A21\u677F\u4E2D\u58F0\u660E <div x-component:autospark.outlet>\uFF08x-outlet \u7B80\u5199\u4EC5\u5BF9\u63D2\u4EF6\u81EA\u4E3E\u8DEF\u5F84\u4E0E\u8FDC\u7A0B\u6A21\u677F\u751F\u6548\uFF09");}};qt.NESTED_OUTLET_MICROTASK_RETRIES=20;var Ft=qt;var $r=0,Bt=class{async openModal(t){let e=this.modalState,r=this.maxModals,o=this._resolveModalRoute(t);if(!o)throw new Error("Invalid modal route");let n=this._getModalConfig(o);if(!n)throw new Error("Route is not configured as modal");if(e.stack.length>=r){console.warn("Maximum modal stack depth reached");return}let i=await this._createModalElement(o),s;n.backdrop!==false&&(s=this._createBackdrop(n));let u={route:o,element:i,backdrop:s,timestamp:Date.now()};e.stack.push(u),e.current=u,await this._renderModal(u),this.emit("modal:open",{route:o,stackItem:u}),n.autoClose&&n.autoClose>0&&setTimeout(()=>{e.current===u&&this._closeTopModal();},n.autoClose),this._updateModalURL(o);}async closeModal(t){let e=this.modalState;if(t){let r;if(typeof t=="string"){let n=this.routes.match(t);r=n?.[n.length-1]?.route||null;}else r=t;if(!r)return;let o=e.stack.findIndex(n=>n.route===r);if(o!==-1)for(;e.stack.length>o;)await this._closeTopModal();}else await this._closeTopModal();}async closeAllModals(){for(;this.modalState.stack.length>0;)await this._closeTopModal();}get hasOpenModals(){return this.modalState.stack.length>0}get modalCount(){return this.modalState.stack.length}get currentModal(){return this.modalState.current}_initModals(){this._createModalContainer(),this._setupModalEventListeners(),this._injectModalStyles();}injectModalStyles(){if(document.querySelector("#autospark-modal-styles"))return;let t=document.createElement("style");t.id="autospark-modal-styles",t.textContent=`
            .autospark-modals {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 9999;
                pointer-events: none;
            }
            .autospark-modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                pointer-events: auto;
            }
            .autospark-modal-content {
                position: relative;
                pointer-events: auto;
                z-index: 1;
                background: white;
                padding: 20px;
                border-radius: 4px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }
            /* Drawer \u6837\u5F0F */
            .autospark-modal-drawer {
                background: white;
                box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
            }
            .autospark-modal-drawer.autospark-modal-left {
                box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
            }
            .autospark-modal-drawer.autospark-modal-top {
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .autospark-modal-drawer.autospark-modal-bottom {
                box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
            }
            /* \u9ED8\u8BA4\u5185\u5BB9\u6837\u5F0F */
            .autospark-modal-content .custom-modal-content {
                padding: 0;
            }
        `,document.head.appendChild(t);}_createModalContainer(){let t=this.host.querySelector(".autospark-modals");return t||(t=document.createElement("div"),t.className="autospark-modals",this.host.appendChild(t)),this.modalContainer=t,t}_setupModalEventListeners(){document.addEventListener("keydown",t=>{let e=this.modalState;t.key==="Escape"&&e.current&&this._getModalConfig(e.current.route)?.closeOnEsc!==false&&this._closeTopModal();});}_getModalConfig(t){return typeof t.modal=="boolean"?t.modal?{}:null:t.modal||null}_injectModalStyles(){if(document.querySelector("#autospark-modal-styles"))return;let t=document.createElement("style");t.id="autospark-modal-styles",t.textContent=`
            /* ==================== \u6A21\u6001\u5BB9\u5668 ==================== */
            .autospark-modals {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 9999;
                pointer-events: none;
            }

            /* ==================== \u80CC\u666F\u906E\u7F69 ==================== */
            .autospark-modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                pointer-events: auto;
                animation: autospark-fade-in 0.2s ease-out;
            }

            .autospark-modal-backdrop.closing {
                animation: autospark-fade-out 0.2s ease-in forwards;
            }

            /* ==================== \u6A21\u6001\u5185\u5BB9\u57FA\u7840\u6837\u5F0F ==================== */
            .autospark-modal-content {
                position: fixed;
                pointer-events: auto;
                z-index: 10000;
                background: white;
                padding: 20px;
                border-radius: 4px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }

            /* ==================== Dialog \u6837\u5F0F\u548C\u52A8\u753B ==================== */
            .autospark-modal-dialog {
                max-width: 600px;
                max-height: 80vh;
                overflow: auto;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }

            /* \u5C45\u4E2D\u5BF9\u8BDD\u6846 */
            .autospark-modal-dialog.autospark-modal-center {
                animation: autospark-dialog-center-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .autospark-modal-dialog.autospark-modal-center.closing {
                animation: autospark-dialog-center-out 0.2s ease-in forwards;
            }

            /* \u9876\u90E8\u5BF9\u8BDD\u6846 */
            .autospark-modal-dialog.autospark-modal-top {
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                animation: autospark-dialog-top-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .autospark-modal-dialog.autospark-modal-top.closing {
                animation: autospark-dialog-top-out 0.2s ease-in forwards;
            }

            /* \u5DE6\u4E0A\u5BF9\u8BDD\u6846 */
            .autospark-modal-dialog.autospark-modal-top-left {
                top: 0;
                left: 0;
                animation: autospark-dialog-top-left-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .autospark-modal-dialog.autospark-modal-top-left.closing {
                animation: autospark-dialog-top-left-out 0.2s ease-in forwards;
            }

            /* \u53F3\u4E0A\u5BF9\u8BDD\u6846 */
            .autospark-modal-dialog.autospark-modal-top-right {
                top: 0;
                right: 0;
                animation: autospark-dialog-top-right-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .autospark-modal-dialog.autospark-modal-top-right.closing {
                animation: autospark-dialog-top-right-out 0.2s ease-in forwards;
            }

            /* \u53F3\u4FA7\u5BF9\u8BDD\u6846 */
            .autospark-modal-dialog.autospark-modal-right {
                top: 50%;
                right: 0;
                animation: autospark-dialog-right-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .autospark-modal-dialog.autospark-modal-right.closing {
                animation: autospark-dialog-right-out 0.2s ease-in forwards;
            }

            /* \u53F3\u4E0B\u5BF9\u8BDD\u6846 */
            .autospark-modal-dialog.autospark-modal-bottom-right {
                bottom: 0;
                right: 0;
                animation: autospark-dialog-bottom-right-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .autospark-modal-dialog.autospark-modal-bottom-right.closing {
                animation: autospark-dialog-bottom-right-out 0.2s ease-in forwards;
            }

            /* \u5E95\u90E8\u5BF9\u8BDD\u6846 */
            .autospark-modal-dialog.autospark-modal-bottom {
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                animation: autospark-dialog-bottom-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .autospark-modal-dialog.autospark-modal-bottom.closing {
                animation: autospark-dialog-bottom-out 0.2s ease-in forwards;
            }

            /* \u5DE6\u4E0B\u5BF9\u8BDD\u6846 */
            .autospark-modal-dialog.autospark-modal-bottom-left {
                bottom: 0;
                left: 0;
                animation: autospark-dialog-bottom-left-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .autospark-modal-dialog.autospark-modal-bottom-left.closing {
                animation: autospark-dialog-bottom-left-out 0.2s ease-in forwards;
            }

            /* \u5DE6\u4FA7\u5BF9\u8BDD\u6846 */
            .autospark-modal-dialog.autospark-modal-left {
                top: 50%;
                left: 0;
                animation: autospark-dialog-left-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .autospark-modal-dialog.autospark-modal-left.closing {
                animation: autospark-dialog-left-out 0.2s ease-in forwards;
            }

            /* ==================== Drawer \u6837\u5F0F\u548C\u52A8\u753B ==================== */
            .autospark-modal-drawer {
                background: white;
                max-height: 100vh;
                overflow: auto;
            }

            /* \u5DE6\u4FA7\u62BD\u5C49 - \u6C34\u5E73\u6ED1\u52A8\uFF0C\u56FA\u5B9A\u9AD8\u5EA6 */
            .autospark-modal-drawer.autospark-modal-left {
                width: 300px;
                top: 0;
                left: 0;
                height: 100vh;
                animation: autospark-slide-in-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .autospark-modal-drawer.autospark-modal-left.closing {
                animation: autospark-slide-out-left 0.2s ease-in forwards;
            }

            /* \u53F3\u4FA7\u62BD\u5C49 - \u6C34\u5E73\u6ED1\u52A8\uFF0C\u56FA\u5B9A\u9AD8\u5EA6 */
            .autospark-modal-drawer.autospark-modal-right {
                width: 300px;
                top: 0;
                right: 0;
                height: 100vh;
                animation: autospark-slide-in-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .autospark-modal-drawer.autospark-modal-right.closing {
                animation: autospark-slide-out-right 0.2s ease-in forwards;
            }

            /* \u9876\u90E8\u62BD\u5C49 - \u4ECE\u9876\u90E8\u6ED1\u5165\uFF0C\u6EE1\u5BBD */
            .autospark-modal-drawer.autospark-modal-top {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                width: 100vw;
                max-width: 100vw;
                height: 300px;
                box-sizing: border-box;
                padding: 0;
                border-radius: 0;
                animation: autospark-slide-in-top 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }

            /* \u9876\u90E8\u62BD\u5C49\u5185\u5BB9\u6EE1\u5BBD */
            .autospark-modal-drawer.autospark-modal-top .custom-modal-content {
                max-width: none;
                width: auto;
            }

            .autospark-modal-drawer.autospark-modal-top.closing {
                animation: autospark-slide-out-top 0.2s ease-in forwards;
            }

            /* \u5E95\u90E8\u62BD\u5C49 - \u4ECE\u5E95\u90E8\u6ED1\u5165\uFF0C\u6EE1\u5BBD */
            .autospark-modal-drawer.autospark-modal-bottom {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                width: 100vw;
                max-width: 100vw;
                height: 300px;
                box-sizing: border-box;
                padding: 0;
                border-radius: 0;
                animation: autospark-slide-in-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }

            /* \u5E95\u90E8\u62BD\u5C49\u5185\u5BB9\u6EE1\u5BBD */
            .autospark-modal-drawer.autospark-modal-bottom .custom-modal-content {
                max-width: none;
                width: auto;
            }

            .autospark-modal-drawer.autospark-modal-bottom.closing {
                animation: autospark-slide-out-bottom 0.2s ease-in forwards;
            }

            /* ==================== \u52A8\u753B\u5173\u952E\u5E27 ==================== */
            /* \u6DE1\u5165/\u6DE1\u51FA */
            @keyframes autospark-fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes autospark-fade-out {
                from { opacity: 1; }
                to { opacity: 0; }
            }

            /* \u5BF9\u8BDD\u6846\u52A8\u753B */
            @keyframes autospark-dialog-center-in {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }

            @keyframes autospark-dialog-center-out {
                from {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.9);
                }
            }

            @keyframes autospark-dialog-top-in {
                from {
                    opacity: 0;
                    transform: translate(-50%, -20px);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, 0);
                }
            }

            @keyframes autospark-dialog-top-out {
                from {
                    opacity: 1;
                    transform: translate(-50%, 0);
                }
                to {
                    opacity: 0;
                    transform: translate(-50%, -20px);
                }
            }

            @keyframes autospark-dialog-top-left-in {
                from {
                    opacity: 0;
                    transform: translate(-20px, -20px);
                }
                to {
                    opacity: 1;
                    transform: translate(0, 0);
                }
            }

            @keyframes autospark-dialog-top-left-out {
                from {
                    opacity: 1;
                    transform: translate(0, 0);
                }
                to {
                    opacity: 0;
                    transform: translate(-20px, -20px);
                }
            }

            @keyframes autospark-dialog-top-right-in {
                from {
                    opacity: 0;
                    transform: translate(20px, -20px);
                }
                to {
                    opacity: 1;
                    transform: translate(0, 0);
                }
            }

            @keyframes autospark-dialog-top-right-out {
                from {
                    opacity: 1;
                    transform: translate(0, 0);
                }
                to {
                    opacity: 0;
                    transform: translate(20px, -20px);
                }
            }

            @keyframes autospark-dialog-right-in {
                from {
                    opacity: 0;
                    transform: translate(20px, -50%);
                }
                to {
                    opacity: 1;
                    transform: translate(0, -50%);
                }
            }

            @keyframes autospark-dialog-right-out {
                from {
                    opacity: 1;
                    transform: translate(0, -50%);
                }
                to {
                    opacity: 0;
                    transform: translate(20px, -50%);
                }
            }

            @keyframes autospark-dialog-bottom-right-in {
                from {
                    opacity: 0;
                    transform: translate(20px, 20px);
                }
                to {
                    opacity: 1;
                    transform: translate(0, 0);
                }
            }

            @keyframes autospark-dialog-bottom-right-out {
                from {
                    opacity: 1;
                    transform: translate(0, 0);
                }
                to {
                    opacity: 0;
                    transform: translate(20px, 20px);
                }
            }

            @keyframes autospark-dialog-bottom-in {
                from {
                    opacity: 0;
                    transform: translate(-50%, 20px);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, 0);
                }
            }

            @keyframes autospark-dialog-bottom-out {
                from {
                    opacity: 1;
                    transform: translate(-50%, 0);
                }
                to {
                    opacity: 0;
                    transform: translate(-50%, 20px);
                }
            }

            @keyframes autospark-dialog-bottom-left-in {
                from {
                    opacity: 0;
                    transform: translate(-20px, 20px);
                }
                to {
                    opacity: 1;
                    transform: translate(0, 0);
                }
            }

            @keyframes autospark-dialog-bottom-left-out {
                from {
                    opacity: 1;
                    transform: translate(0, 0);
                }
                to {
                    opacity: 0;
                    transform: translate(-20px, 20px);
                }
            }

            @keyframes autospark-dialog-left-in {
                from {
                    opacity: 0;
                    transform: translate(-20px, -50%);
                }
                to {
                    opacity: 1;
                    transform: translate(0, -50%);
                }
            }

            @keyframes autospark-dialog-left-out {
                from {
                    opacity: 1;
                    transform: translate(0, -50%);
                }
                to {
                    opacity: 0;
                    transform: translate(-20px, -50%);
                }
            }

            /* \u62BD\u5C49\u52A8\u753B */
            @keyframes autospark-slide-in-left {
                from { transform: translateX(-100%); }
                to { transform: translateX(0); }
            }

            @keyframes autospark-slide-out-left {
                from { transform: translateX(0); }
                to { transform: translateX(-100%); }
            }

            @keyframes autospark-slide-in-right {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }

            @keyframes autospark-slide-out-right {
                from { transform: translateX(0); }
                to { transform: translateX(100%); }
            }

            @keyframes autospark-slide-in-top {
                from {
                    transform: translateY(-100%);
                }
                to {
                    transform: translateY(0);
                }
            }

            @keyframes autospark-slide-out-top {
                from {
                    transform: translateY(0);
                }
                to {
                    transform: translateY(-100%);
                }
            }

            @keyframes autospark-slide-in-bottom {
                from {
                    transform: translateY(100%);
                }
                to {
                    transform: translateY(0);
                }
            }

            @keyframes autospark-slide-out-bottom {
                from {
                    transform: translateY(0);
                }
                to {
                    transform: translateY(100%);
                }
            }

            /* ==================== \u81EA\u5B9A\u4E49\u5185\u5BB9\u6837\u5F0F ==================== */
            .autospark-modal-content .custom-modal-content {
                padding: 0;
            }

            /* ==================== \u65E0\u52A8\u753B\u652F\u6301 ==================== */
            .autospark-modal-content.no-animation,
            .autospark-modal-backdrop.no-animation {
                animation: none !important;
            }
        `,document.head.appendChild(t);}_closeTopModal(){let t=this.modalState;if(t.stack.length===0)return Promise.resolve();let e=t.stack.pop();return e?(e.element.classList.add("closing"),e.backdrop&&e.backdrop.classList.add("closing"),new Promise(r=>{setTimeout(()=>{e.element.remove(),e.backdrop?.remove(),t.current=t.stack[t.stack.length-1]||null,this.emit("modal:close",{route:e.route,stackItem:e}),this._restoreModalURL(),r();},200);})):Promise.resolve()}_createModalElement(t){let e=document.createElement("div");if(e.className="autospark-modal-content",t.view)if(typeof t.view=="string"){let r={id:++$r,route:t,params:{},query:{},state:{},path:t.path,url:t.path,hash:t.path};return this.viewLoader.loadViews([r]).then(async()=>{let o=t._getView;if(o)try{let n=await o(),i=n&&typeof n=="object"&&"value"in n?n.value:n;typeof i=="string"?e.innerHTML=i:i instanceof HTMLElement&&e.appendChild(i);}catch{}return e})}else {let r=t.view;if(r.tagName==="TEMPLATE"){let n=r.content.cloneNode(true);e.appendChild(n);}else e.appendChild(r);}return Promise.resolve(e)}createModalContainer(){let t=this.host.querySelector(".autospark-modals");return t||(t=document.createElement("div"),t.className="autospark-modals",this.host.appendChild(t)),this.modalContainer=t,t}setupModalEventListeners(){document.addEventListener("keydown",t=>{t.key==="Escape"&&this.modalState.current&&this.getModalConfig(this.modalState.current.route)?.closeOnEsc!==false&&this.closeTopModal();});}getModalConfig(t){return typeof t.modal=="boolean"?t.modal?{}:null:t.modal||null}async closeTopModal(){if(this.modalState.stack.length===0)return;let t=this.modalState.stack.pop();t&&(t.element.remove(),t.backdrop?.remove(),this.modalState.current=this.modalState.stack[this.modalState.stack.length-1]||null,this.emit("modal-close",{route:t.route,stackItem:t}),this._restoreModalURL());}_createBackdrop(t){if(t.backdrop===false)return;let e=document.createElement("div");return e.className="autospark-modal-backdrop",t.closeOnBackdropClick!==false&&e.addEventListener("click",()=>{this._closeTopModal();}),e}_renderModal(t){let e=this.modalContainer,r=this._getModalConfig(t.route);return t.backdrop&&e.appendChild(t.backdrop),this._applyModalStyles(t.element,r),e.appendChild(t.element),Promise.resolve()}_applyModalStyles(t,e){if(!e)return;let r=e.type||"dialog",o=e.position||"center",n=e.offset||[0,0];t.classList.add(`autospark-modal-${r}`),t.classList.add(`autospark-modal-${o}`),this._applyPositionStyles(t,r,o,n);}_applyPositionStyles(t,e,r,o){let n=t.style;if(n.position="fixed",n.zIndex="10000",e==="dialog"?(n.maxWidth="600px",n.maxHeight="80vh",n.overflow="auto"):e==="drawer"&&(r==="left"||r==="right"?(n.width="300px",n.maxHeight="100vh",n.overflow="auto"):(n.maxHeight="100vh",n.overflow="auto")),e!=="drawer")switch(r){case "center":n.top="50%",n.left="50%",n.transform=`translate(calc(-50% + ${o[0]}px), calc(-50% + ${o[1]}px))`;break;case "top":n.top=`${o[1]}px`,n.left="50%",n.transform=`translateX(calc(-50% + ${o[0]}px))`;break;case "top-left":n.top=`${o[1]}px`,n.left=`${o[0]}px`;break;case "top-right":n.top=`${o[1]}px`,n.right=`${o[0]}px`;break;case "right":n.top="50%",n.right=`${o[0]}px`,n.transform=`translateY(calc(-50% + ${o[1]}px))`;break;case "bottom-right":n.bottom=`${o[1]}px`,n.right=`${o[0]}px`;break;case "bottom":n.bottom=`${o[1]}px`,n.left="50%",n.transform=`translateX(calc(-50% + ${o[0]}px))`;break;case "bottom-left":n.bottom=`${o[1]}px`,n.left=`${o[0]}px`;break;case "left":n.top="50%",n.left=`${o[0]}px`,n.transform=`translateY(calc(-50% + ${o[1]}px))`;break}}_resolveModalRoute(t){if(t.route)if(typeof t.route=="string"){let e=this.routes.match(t.route);return e?.[e.length-1]?.route||null}else return t.route;return null}_updateModalURL(t){}_restoreModalURL(){}};var Wt=class{};var Vr="routes.json",Ur=10,ot=class extends Error{constructor(t,e,r){super(r??`Negative when load ${e} : ${t}`),this.name="NegativeChildrenError",this.kind=t;}},zt=class{constructor(t){this.root=Tt();this._pendingCount=0;this._responseCache=new Map;this.router=t;}async load(){let t=this.router.options.routes||[],r=await(async o=>(typeof o=="function"?o=await o():typeof o=="string"&&(o=await fetch(this.router.language?.rewriteUrl(o,"routes")??o).then(n=>n.json())),Array.isArray(o)?o:[o]))(t);this.root=Tt(r),this._markPending(this.root,"/"),this._applyRouteOptions(this.root),this.router.emit("routes:loaded",void 0),this._expansion=this._expandAll();}hasPending(){return this._pendingCount>0}async whenExpanded(t){let e=this._expansion?.catch(()=>{});if(e){if(!t||t<=0){await e;return}await Promise.race([e,new Promise(r=>setTimeout(r,t))]);}}match(t){return Y(t,this.root)||null}_markPending(t,e){let r=t.path&&t.path!=="/"?M(e,t.path):e;typeof t.children=="string"||t.children===true?(t._childrenSource=t.children,t.children=[],t._childrenState="pending",this._pendingCount++):this._shouldAutoProbe(t)&&(t._childrenSource=true,t.children=[],t._childrenState="pending",t._autoProbe=true,this._pendingCount++),Array.isArray(t.children)&&t.children.forEach(o=>this._markPending(o,r));}_shouldAutoProbe(t){return !!this.router.options.autoDiscoverRoutes&&t.children===void 0&&!t.redirect}_collectPending(t,e,r=[]){let o=t.path&&t.path!=="/"?M(e,t.path):e;return t._childrenState==="pending"&&r.push({item:t,path:o}),Array.isArray(t.children)&&t.children.forEach(n=>this._collectPending(n,o,r)),r}async _expandAll(){let t=this.router.options.maxChildrenDepth??Ur,e=this._collectPending(this.root,"/"),r=0;for(;e.length>0&&r<t;){r++;let o=[];await Promise.all(e.map(async n=>{let i=await this._expandNode(n);o.push(...i);})),e=o;}if(e.length>0){let o=new Error(`[AutoSparkRouter] \u8FDC\u7A0B\u5B50\u8868\u5C55\u5F00\u8D85\u51FA\u6700\u5927\u6DF1\u5EA6 ${t}\uFF0C\u6B8B\u4F59 ${e.length} \u4E2A\u8282\u70B9\u5DF2\u964D\u7EA7`);e.forEach(n=>{this.router.logger.warn(o.message),this._degrade(n.item,o);});}this.router.emit("routes:expanded",void 0);}async _expandNode(t){let{item:e,path:r}=t,o=He(e._childrenSource,{path:r,name:e.name,meta:e.meta,routesFile:this.router.options.routesFile??Vr},this.router.options.base),n=this.router.language?.rewriteUrl(o,"routes")??o;try{let i=await this._fetchChildren(n,e),s=this._toRouteItems(i,n),u=Tt(s),l=Array.isArray(u.children)?u.children:[];l.forEach(p=>this._applyRouteOptions(p)),e.children=l,this._settle(e,"ok");let c=[];return l.forEach(p=>{this._markPending(p,r),this._collectPending(p,r,c);}),c}catch(i){return e._autoProbe&&i instanceof ot?(i.kind==="parse"&&this.router.logger.debug(`[AutoSparkRouter] \u81EA\u52A8\u63A2\u6D4B ${n} \u54CD\u5E94\u975E JSON\uFF08\u7591\u4F3C\u6258\u7BA1 fallback\uFF09\uFF0C\u89C6\u4E3A\u65E0\u5B50\u8DEF\u7531`),this._settle(e,"ok"),[]):(this._degrade(e,i instanceof Error?i:new Error(String(i)),n),[])}}_fetchChildren(t,e){let r=this._responseCache.get(t);if(r)return r;let o=e.timeout??this.router.options.routeOptions?.timeout??0,n=new AbortController,i=o>0?setTimeout(()=>n.abort(new Error(`Timeout when load ${t}`)),o):null,s=fetch(t,{signal:n.signal}).then(async u=>{if(!u.ok)throw u.status===404?new ot("not-found",t,`Fail when load ${t} : ${u.statusText}`):new Error(`Fail when load ${t} : ${u.statusText}`);try{return await u.json()}catch(l){throw l instanceof SyntaxError?new ot("parse",t):l}}).finally(()=>{i&&clearTimeout(i);});return e._autoProbe&&s.catch(u=>{u instanceof ot||this._responseCache.delete(t);}),this._responseCache.set(t,s),s}_toRouteItems(t,e){if(Array.isArray(t))return t;if(t&&typeof t=="object")return [t];throw new Error(`[AutoSparkRouter] \u8FDC\u7A0B\u5B50\u8868 ${e} \u8FD4\u56DE\u7684\u4E0D\u662F\u8DEF\u7531\u9879\u58F0\u660E`)}_settle(t,e){t._childrenState==="pending"&&this._pendingCount--,t._childrenState=e;}_degrade(t,e,r){t.children=[],this._settle(t,"error"),this.router.emit("routes:error",{url:r,path:t.path,error:e});}_applyRouteOptions(t){let e=["keepAlive","cache","timeout","preload"],r=o=>{if(o.name&&o.name.length>0&&(this.namedRouteItems||(this.namedRouteItems=new Map),this.namedRouteItems.set(o.name,new WeakRef(o))),this.router.options.routeOptions){let n=this.router.options.routeOptions;e.forEach(i=>{o[i]===void 0&&n[i]!==void 0&&(o[i]=n[i]);});}Array.isArray(o.children)&&o.children.forEach(r);};r(t);}forEach(t){function e(r,o){t(r,o),Array.isArray(r.children)&&r.children.forEach(n=>e(n,r));}e(this.root,null);}};var Kt=class extends gt{};function be(a){if(typeof a!="object"||a===null)return  false;var t=Object.getPrototypeOf(a);if(t===null)return  true;for(var e=t;Object.getPrototypeOf(e)!==null;)e=Object.getPrototypeOf(e);return t===e}var Jt=class{constructor(t,e,r){this.cache=new Map;this.router=t,this.loadType=e,this.options=Object.assign({timeout:0,cache:0,hash:"{url}",datatype:"json"},r),this._signalKey=`_get${e.charAt(0).toUpperCase()+e.slice(1)}`,this._optionsKey=`_${e}Options`,this._optionKey=e;}getSignal(t){return t.route[this._signalKey]}createSignal(t,e){let r=this.getSignal(t);r&&r.abort();let o=N();return t.route[this._signalKey]=o,o.meta.hash=this._getHash(t,e),o}_removeSignal(t){t.route&&delete t.route[this._signalKey];}getRouteOptions(t){return t.route[this._optionsKey]||(t.route[this._optionsKey]=this._mergeRouteOptions(t)),t.route[this._optionsKey]}isOptionsObject(t){return typeof t=="object"&&t!==null&&"from"in t}loadRoutes(t,e,r=0){return Promise.allSettled(t.map((o,n)=>{if(!(n<r&&this.loadStateOf(o)==="ok"))return this.loadRoute(o,e)}))}get loadStateKey(){return `_${this._optionKey}LoadState`}loadStateOf(t){if(t.route)return t.route[this.loadStateKey]}setLoadState(t,e){t.route&&(t.route[this.loadStateKey]=e);}resetLoadStates(t){for(let e of t)e.route&&delete e.route[this.loadStateKey];}_createErrorSignal(t,e,r){let o=this.createSignal(t,r);this.onLoadError(t,e,o,r);}_createSuccessSignal(t,e,r){let o=this.createSignal(t,r);this.onLoadSuccess(t,e,o,r);}async loadRoute(t,e){if(!t.route?.[this._optionKey])return;let r=this.getRouteOptions(t),o;try{if(this.hitCache(t,r))return;if(this.isValidData(r.from)&&!rt(r.from)&&!et(r.from)){this._createSuccessSignal(t,r.from,r);return}if(e?.aborted)return;o=this.createSignal(t,r);let n,i;if(rt(r.from))i=r.from,o.meta.url=i,n=this._loadFromRemote(i,o,t,r,e);else if(r.from===!0)if(i=this.getAutoUrl(t),i)o.meta.url=i,n=this._loadFromRemote(i,o,t,r,e);else {this._removeSignal(t);return}else et(r.from)&&(n=r.from(t));if(n==null){this._removeSignal(t);return}Promise.resolve(n).then(s=>this.onLoadSuccess(t,s,o,r)).catch(s=>this.onLoadError(t,s,o,r));}catch(n){n.name!=="AbortError"&&this._createErrorSignal(t,n,r);}}_isCacheExpired(t,e){if(!t)return  true;let r=e.cache||0;return r<=0?true:Date.now()-t.timestamp>r}hitCache(t,e){let r=this._getHash(t,e),o=this.cache.get(r);return (e.cache||0)>0&&o&&!this._isCacheExpired(o,e)?(this._createSuccessSignal(t,o.value,e),true):((e.cache||0)>0&&this.cache.has(r)&&this.cache.delete(r),false)}_getHash(t,e){if(e.hash)return $(e.hash,t);let r=$("{url}",t),o=this.router.language;return o?.enabled&&o.current?`${r}@${o.current}`:r}getAutoUrl(t){}isValidData(t){return  true}prepareFetchUrl(t,e){return t}_loadFromRemote(t,e,r,o,n){let i=this.prepareFetchUrl(t,r).params(J(r)),s=j(this.router.language?.rewriteUrl(i,this.loadType)??i,this.router.options.base),{timeout:u=0}=o,l=new AbortController,c=e.getAbortSignal(),p=null,f=()=>{p&&(clearTimeout(p),p=null),c&&c.removeEventListener("abort",b);},b=()=>{l.abort();};c&&c.addEventListener("abort",b),u>0&&(p=setTimeout(()=>{l.isTimeout=true,l.abort();},u));let h=[l.signal];c&&h.push(c),n&&h.push(n);let A=typeof AbortSignal.any=="function"?AbortSignal.any(h):h[0];try{return fetch(s,{signal:A}).then(async m=>{if(!m.ok)throw new H(`Fail when load ${s} : ${m.statusText}`,m.status);return await this.onResponse(m,r,{signal:A,hash:e.meta.hash,url:s})}).catch(m=>{throw m instanceof DOMException&&m.name==="AbortError"&&l.isTimeout?new xt:m}).finally(()=>{f();})}catch(m){return f(),Promise.reject(m)}}isCacheEnable(t){return (t.cache||0)>0}onLoadSuccess(t,e,r,o){try{if(this.isCacheEnable(o)){let n=this._getHash(t,o);this.cache.set(n,{value:e,timestamp:Date.now()});}e.error&&e.error instanceof Error?(this.setLoadState(t,"error"),r.reject(new H(e.error.message))):(this.setLoadState(t,"ok"),r.resolve(e));}catch(n){this.setLoadState(t,"error"),r.reject(n);}}onLoadError(t,e,r,o){if(e.name==="AbortError")r.resolve(void 0);else {this.setLoadState(t,"error"),r.meta.statusCode=e.status||500;let n=this._getHash(t,o);this.cache.delete(n),r.reject(e);}}_mergeRouteOptions(t){let e=t.route[this._optionKey]||{},r=be(e)&&"from"in e;return {...this.options,...r?e:{from:e}}}cleanup(){this.cache.clear();}};var Xt=class extends Jt{constructor(e){super(e,"view",Object.assign({},e.options.viewOptions));this.renderers=[];this.renderers=e.options.renderers||[],this.defaultRenderer=new G(e),this._rawRenderer=new ct(e);}async loadViews(e,r,o=0){return this.loadRoutes(e,r,o)}prepareFetchUrl(e,r){return je(e)}selectRenderer(e,r,o){if(lt(V(r)??""))return this._rawRenderer;let n=r.route?._viewOptions?.renderer;if(n)return n;for(let i of this.renderers)try{if(i&&i.test(e,r))return i}catch{}return this.defaultRenderer}async onResponse(e,r,o){let n=this.selectRenderer(e,r,o),i=[n];n instanceof G||i.push(this.defaultRenderer),i.includes(this._rawRenderer)||i.push(this._rawRenderer);let s=[];for(let c=0;c<i.length-1;c++)try{s.push(e.clone());}catch(p){this.router.logger.warn("{} -> \u54CD\u5E94\u4F53\u4E0D\u53EF\u514B\u9686\uFF0C\u6E32\u67D3\u964D\u7EA7\u94FE\u53EF\u80FD\u4E0D\u53EF\u7528: {}",r.id,p?.message??p);break}let u=e,l=new Error("\u89C6\u56FE\u6E32\u67D3\u5931\u8D25");for(let c=0;c<i.length;c++){let p=i[c];try{let f=await p.render(u,r,o);if(!f.error)return {value:f.value,meta:f.meta};l=f.error,this.router.logger.warn("{} -> \u6E32\u67D3\u5668 {} \u52A0\u5DE5\u5931\u8D25\uFF08{}\uFF09\uFF0C\u964D\u7EA7\u4E0B\u4E00\u6E32\u67D3\u5668",r.id,p.constructor.name,f.error.message);}catch(f){l=f instanceof Error?f:new Error(String(f)),this.router.logger.warn("{} -> \u6E32\u67D3\u5668 {} \u6267\u884C\u5F02\u5E38\uFF08{}\uFF09\uFF0C\u964D\u7EA7\u4E0B\u4E00\u6E32\u67D3\u5668",r.id,p.constructor.name,l.message);}u=s[c]??u;}return {error:l}}};var Yt="data-autospark-seo";function er(a){return typeof a=="boolean"?a:typeof a=="string"?a!=="false"&&a!=="0":!!a}function rr(a){let t={};if(Array.isArray(a))for(let e of a)e&&typeof e=="object"&&e.property&&(t[String(e.property)]=String(e.content??""));else if(a&&typeof a=="object")for(let e of Object.keys(a)){let r=a[e];r!=null&&(t[e.includes(":")?e:`og:${e}`]=String(r));}return t}function tr(a){if(!(a===null||a===""))try{return JSON.parse(a)}catch{return}}function Se(a,t){let e={...a};return t&&(t.title!==void 0&&(e.title=t.title),t.description!==void 0&&(e.description=t.description),t.canonical!==void 0&&(e.canonical=t.canonical),t.robots!==void 0&&(e.robots=t.robots),t.jsonLd!==void 0&&(e.jsonLd=t.jsonLd),t.seo!==void 0&&(e.seo=t.seo),t.og!==void 0&&(e.og={...a.og??{},...t.og})),e}function Fr(a){let t={};return typeof a.title=="string"&&a.title!==""&&(t.title=a.title),typeof a.description=="string"&&(t.description=a.description),typeof a.canonical=="string"&&(t.canonical=a.canonical),typeof a.robots=="string"&&(t.robots=a.robots),a.og!==void 0&&a.og!==null&&(t.og=rr(a.og)),a.jsonLd!==void 0&&a.jsonLd!==null&&(t.jsonLd=a.jsonLd),a.seo!==void 0&&a.seo!==null&&(t.seo=er(a.seo)),t}function qr(a){let t={};for(let e of a){let r=e.route;r&&(r.title&&(t.title=r.title),r.meta&&typeof r.meta=="object"&&(t=Se(t,Fr(r.meta))));}return t}function Br(a,t,e){let r=a;for(;r&&r!==e;){let o=r.getAttribute?.("data-view-hash");if(o!=null)return o===t;r=r.parentElement;}return  false}function Wr(a){let t={},e=a.getAttribute("title");e&&(t.title=e);let r=a.getAttribute("description");r!==null&&(t.description=r);let o=a.getAttribute("canonical");o!==null&&(t.canonical=o);let n=a.getAttribute("robots");n!==null&&(t.robots=n);let i=a.getAttribute("seo");i!==null&&(t.seo=er(i));let s=tr(a.getAttribute("og"));s!==void 0&&(t.og=rr(s));let u=tr(a.getAttribute("jsonld")??a.getAttribute("json-ld"));return u!==void 0&&(t.jsonLd=u),t}function zr(a,t){let e=a.host;if(!e||!e.querySelectorAll)return null;let r=e.querySelectorAll("autospark-view-meta");if(!r.length)return null;let o=false,n={};for(let i of t)if(i.hash)for(let s of Array.from(r))Br(s,i.hash,e)&&(o=true,n=Se(n,Wr(s)));return o?n:null}function Re(a,t,e,r){for(let o of Array.from(a.querySelectorAll(t)))if(o.getAttribute(e)===r)return o;return null}function Kr(a){for(let t of Array.from(a.querySelectorAll("link"))){let e=t.getAttribute("rel");if(e&&e.split(/\s+/).includes("canonical"))return t}return null}function Jr(a,t){return !t||/^[a-z][a-z0-9+.-]*:/i.test(a)||a.startsWith("//")?a:t.replace(/\/+$/,"")+(a.startsWith("/")?a:`/${a}`)}var Gt=class{_headEnabled(){return this.options.head!==false}_headConfig(){let t=this.options.head;return t===false||t===void 0?void 0:t}_headAttach(){this._headEnabled()&&(this._headSeedTitle=typeof document<"u"?document.title:"",this._headTags=[],this._headTitleApplied=false,this._headRouteErrorHook=t=>{this._headRenderError=t.error;},this.hooks.add("routeError",this._headRouteErrorHook),this.mode==="hash"&&!this._headHashWarned&&(this._headHashWarned=true,this.logger.warn("SEO head \u7BA1\u7406\u5728 hash \u6A21\u5F0F\u4E0B\u80FD\u529B\u53D7\u9650\uFF1A`#` \u540E\u7684\u5B50\u8DEF\u7531\u5BF9\u641C\u7D22\u5F15\u64CE\u4E0D\u53EF\u89C1\uFF08\u5F31 JS \u722C\u866B\u66F4\u662F\u5B8C\u5168\u770B\u4E0D\u5230\uFF09\u3002\u9700\u8981 SEO \u8BF7\u4F7F\u7528 history \u6A21\u5F0F\u3002")));}_headDetach(){this._headEnabled()&&(this._headViewTimer!==void 0&&(clearTimeout(this._headViewTimer),this._headViewTimer=void 0),this._headRouteErrorHook&&(this.hooks.remove("routeError",this._headRouteErrorHook),this._headRouteErrorHook=void 0),this._headClearTags(),this._headRestoreTitle(),this._headSeedTitle=void 0,this._headRouteDecl=void 0,this._headRenderError=void 0);}_headBeginNavigation(){this._headRenderError=void 0;}_headApplyRoutePhase(t){if(!this._headEnabled())return;let e=qr(t),r=t.some(n=>n.route===void 0),o=this._headRenderError!=null||t.some(n=>n.error!=null);(r||o)&&e.robots===void 0&&(e.robots="noindex, nofollow"),this._headRenderError=void 0,this._headRouteDecl=e,this._headWrite(e.seo===false?null:e);}_headScheduleViewPhase(t,e){this._headEnabled()&&(this._headViewTimer!==void 0&&clearTimeout(this._headViewTimer),this._headViewTimer=setTimeout(()=>{this._headViewTimer=void 0,this.currentNavVersion===e&&this._headApplyViewPhase(t);},0));}_headApplyViewPhase(t){if(!this._headEnabled())return;let e=this._headRouteDecl;if(!e||e.seo===false)return;let r=zr(this,t);if(!r)return;let o=Se(e,r);this._headWrite(o.seo===false?null:o);}_headRestoreTitle(){this._headTitleApplied&&this._headSeedTitle!==void 0&&(document.title=this._headSeedTitle),this._headTitleApplied=false;}_headClearTags(){let t=this._headTags??[];for(let e of t){if(e.created){e.el.parentNode?.removeChild(e.el);continue}let r=new Set;for(let o=0;o<e.el.attributes.length;o++)r.add(e.el.attributes[o].name);for(let o of r)e.original.some(([n])=>n===o)||e.el.removeAttribute(o);for(let[o,n]of e.original)n===null?e.el.removeAttribute(o):e.el.setAttribute(o,n);}this._headTags=[];}_headAdopt(t){let e=this._headTags??=[];if(e.some(o=>o.el===t))return;let r=[];for(let o=0;o<t.attributes.length;o++){let n=t.attributes[o];r.push([n.name,n.value]);}e.push({el:t,created:false,original:r});}_headCreate(t){let e=this._headTags??=[];e.some(r=>r.el===t)||e.push({el:t,created:true,original:[]});}_headSetMeta(t,e){let r=document.head;if(!r)return;let o=Re(r,"meta","name",t);o?this._headAdopt(o):(o=document.createElement("meta"),o.setAttribute("name",t),this._headCreate(o),r.appendChild(o)),o.setAttribute(Yt,""),o.setAttribute("content",e);}_headSetOg(t,e){let r=document.head;if(!r)return;let o=Re(r,"meta","property",t);o||(o=Re(r,"meta","name",t)),o?this._headAdopt(o):(o=document.createElement("meta"),o.setAttribute("property",t),this._headCreate(o),r.appendChild(o)),o.setAttribute(Yt,""),o.setAttribute("content",e),o.hasAttribute("property")||o.setAttribute("property",t);}_headSetCanonical(t){let e=document.head;if(!e)return;let r=Kr(e);r?this._headAdopt(r):(r=document.createElement("link"),r.setAttribute("rel","canonical"),this._headCreate(r),e.appendChild(r)),r.setAttribute(Yt,""),r.setAttribute("href",t);}_headSetJsonLd(t){let e=document.head;if(!e)return;let r=Array.isArray(t)?t:[t];for(let o of r){if(o==null)continue;let n;try{n=JSON.stringify(o);}catch{continue}if(typeof n!="string")continue;let i=document.createElement("script");i.setAttribute("type","application/ld+json"),i.setAttribute(Yt,""),i.textContent=n,this._headCreate(i),e.appendChild(i);}}_headFormatTitle(t){let e=this._headConfig()?.titleTemplate;return e?e.includes("%s")?e.replace("%s",t):`${t} - ${e}`:t}_headWrite(t){if(!(typeof document>"u")){if(this._headClearTags(),!t){this._headRestoreTitle();return}if(t.title?(document.title=this._headFormatTitle(t.title),this._headTitleApplied=true):this._headRestoreTitle(),t.description!==void 0&&this._headSetMeta("description",t.description),t.robots!==void 0&&this._headSetMeta("robots",t.robots),t.canonical!==void 0){let e=this._headConfig()?.siteUrl;this._headSetCanonical(Jr(t.canonical,e));}if(t.og)for(let e of Object.keys(t.og))this._headSetOg(e,t.og[e]);t.jsonLd!==void 0&&this._headSetJsonLd(t.jsonLd);}}};function K(a){return a.trim().toLowerCase().replace(/_/g,"-")}function Xr(a,t){let e=a.search(/[?#]/),r=e>=0?a.slice(0,e):a,o=e>=0?a.slice(e):"",n=r.lastIndexOf("/"),i=n>=0?r.slice(n+1):r;if(i==="")return a;let s=i.lastIndexOf("."),u=s>0?i.slice(0,s):i,l=s>0?i.slice(s):"";return `${r.slice(0,n+1)}${u}_${t}${l}${o}`}function Yr(){let a=globalThis.navigator;return a?Array.isArray(a.languages)&&a.languages.length>0?[...a.languages]:a.language?[a.language]:[]:[]}var Zt=class{constructor(t){this._internalWrite=false;this.router=t;}get enabled(){return (this.router.options.languages?.length??0)>0}get languages(){return this.router.options.languages??[]}get current(){return this._current}get isDefault(){return this._current!==void 0&&this._current===this.languages[0]?.code}languageItem(t){return this.languages.find(e=>e.code===t)}bootstrap(){if(!this.enabled)return;let t=this._readStateLanguage();this._current=this.resolve(t),this._writeStateLanguage(this._current),this.syncDocumentLang(),this._setupWatch();}resolve(t){let e=this.languages;if(e.length===0)return "";if(t&&t!=="auto"){let r=e.find(o=>K(o.code)===K(t));if(r)return r.code}for(let r of Yr()){let o=K(r);if(!o)continue;let n=e.find(u=>K(u.code)===o);if(n)return n.code;let i=o.split("-")[0],s=e.find(u=>K(u.code).split("-")[0]===i);if(s)return s.code}return e[0].code}rewriteUrl(t,e){if(!this.enabled||!this._current)return t;let r=this.router.options.getLanguageUrl;if(r){let o=this.languageItem(this._current);if(!o)return t;let n=r(o,t,e);return n??t}return e==="data"||this.isDefault?t:Xr(t,this._current)}syncDocumentLang(){if(!(!this.enabled||!this._current))try{document.documentElement.lang=this._current;}catch{}}_store(){let e=this.router.options.engine?.store;return e&&typeof e=="object"?e:void 0}_readStateLanguage(){let e=this._store()?.state?.$?.language;return typeof e=="string"?e:void 0}_writeStateLanguage(t){let e=this._store();if(e?.state)try{let r=e.state,o=r.$??={};this._internalWrite=!0;try{o.language=t,r.$=r.$;}finally{this._internalWrite=!1;}}catch{}}_setupWatch(){let t=this._store();if(!(!t?.state||typeof t.watch!="function"))try{this._watcher=t.watch("$.language",()=>this._onStateLanguage());}catch{}}_onStateLanguage(){if(this._internalWrite||!this.enabled)return;let t=this._readStateLanguage();if(t==null||t===this._current)return;if(t==="auto"){let r=this.resolve("auto");if(r===this._current){this._writeStateLanguage(r);return}this._applySwitch(r);return}let e=this.languages.find(r=>K(r.code)===K(t));if(!e){this.router.logger.warn("$.language \u8D4B\u503C {} \u4E0D\u5728\u8BED\u8A00\u6E05\u5355\u4E2D\uFF0C\u5DF2\u56DE\u9000\u4E3A {}",t,this._current),this._writeStateLanguage(this._current);return}this._applySwitch(e.code);}_applySwitch(t){let e=this._current;this._current=t,this._writeStateLanguage(t),this.syncDocumentLang(),this.router.logger.debug("\u8BED\u8A00\u5207\u6362: {} -> {}",e??"?",t),this.router._rerunForLanguageChange();}dispose(){try{this._watcher?.off();}catch{}this._watcher=void 0;}};function or(){let a=window.location.pathname;if(a.endsWith(".html")||a.endsWith(".htm")){let t=a.lastIndexOf("/");return t===0?"/":a.substring(0,t+1)}return a.endsWith("/")?a:a.length>0&&a!=="/"?a+"/":"/"}function ar(){if(typeof document>"u"||!document.querySelector("base"))return null;try{let a=new URL(document.baseURI).pathname;return !a||a==="/"?"/":a.endsWith("/")?a:a+"/"}catch{return null}}function nr(a){if(a.querySelector("[x-outlet], [x-component\\:autospark\\.outlet], [data-autospark-outlet]"))return;let t=document.createElement("div");t.setAttribute("x-outlet",""),a.appendChild(t);}function ir(a){let t=a.options.engine;if(!t)throw new Error("[AutoSparkRouter] \u7F3A\u5C11 options.engine\uFF08ADR-0011\uFF09\uFF1Arouter \u4EC5\u652F\u6301\u6CE8\u5165\u6A21\u5F0F\u3002\u8BF7\u7ECF options.engine \u6CE8\u5165 AutoSpark \u5B9E\u4F8B\uFF0C\u6216\u5728 engine \u6784\u9020 options \u4E2D\u58F0\u660E routes / autoDiscoverRoutes \u7531\u63D2\u4EF6\u81EA\u4E3E\u6302\u8F7D");return de(t),{engine:t}}function ft(a,t){if(!t)return a;if(!a)return "";let e=t.endsWith("/")?t.slice(0,-1):t,r=a.startsWith("/")?a:`/${a}`;if(r===e)return "/";if(r.startsWith(e+"/")){let o=r.slice(e.length);return o.startsWith("/")?o:`/${o}`}return r}var Qt=class extends Je(Ht,$t,Vt,Bt,Ut,Ft,Wt,Kt,Gt){constructor(e,r=[]){super();this._cleanups=[];this.isNavigating=false;this.attached=false;this.currentNavVersion=0;this.abortController=new AbortController;this._navAbortController=null;this._languageNavBypass=false;this._redirectDepth=0;this._lastViewSlot=null;this._lastMatched=null;this.modalContainer=null;this.modalState={stack:[],current:null};this.maxModals=10;if(this.host=typeof e=="string"?document.querySelector(e):e,!(this.host instanceof HTMLElement))throw new Error("[AutoSparkRouter] Host must be a valid HTMLElement");this.host.setAttribute("data-autospark-router",""),this.host.router=this,this.options=this._initOptions(r),this.language=new Zt(this),this.attach();}get navSignal(){return this._navAbortController?.signal||new AbortController().signal}get engine(){return this._engineBinding?.engine}get mode(){return this.options.mode}get base(){return this.options.base}get debug(){return this.options.debug}get logger(){return this._logger||(this.options.logger?this._logger=this.options.logger:this._logger=De(this.options)),this._logger}get location(){return this.history.location}get lastViewSlot(){return this._lastViewSlot}get lastMatched(){return this._lastMatched}get renderers(){return this.options.renderers}_initOptions(e=[]){return this.options=Object.assign({mode:"history",debug:false,home:"/",keeyAlive:true,data:{},errorPages:{},renderers:[],routeOptions:{},viewOptions:{},routesFile:"routes.json",maxChildrenDepth:10},e&&typeof e=="object"&&"routes"in e?e:{routes:e}),this.options.base===void 0&&(this.options.base=ar()??or()),this.options}_matchRoute(e,r,o){let n=this.routes.current,i=e+r,s=Y(i,this.routes.root,{});if(this.language.enabled&&this.language.current){let u=`@${this.language.current}`;for(let l of s)l.route&&(l.hash+=u);}return o&&s.forEach(u=>{u.state=o;}),{fromRoute:n,toRoute:s}}_hasRealMatch(e){return e.slice(1).some(r=>r.route!==void 0)}_syncRouteState(e){let r=this.engine;if(!r)return;let o=r.store;if(!o?.state)return;let n=o.state,i=n.$??={},s=this.history.location,u={};for(let p of e)Object.assign(u,p.params??{});let l={};for(let[p,f]of new URLSearchParams(s.search))l[p]=f;let c=ft(s.pathname,this.options.base);i.route={path:c,fullPath:c+s.search,params:u,query:l},n.$=n.$;}async _matchRouteAfterExpansion(e,r,o,n){let i=this._matchRoute(e,r,o);return this._hasRealMatch(i.toRoute)||!this.routes.hasPending()?i:(await this.routes.whenExpanded(n??this.options.routeOptions?.timeout),this._matchRoute(e,r,o))}async onRouteUpdate(e){this.isNavigating=true,this._headBeginNavigation(),this.emit("navigation:start",e);let r=e.location.pathname,o=e.location.search;this._lastViewSlot=null;let n=await this._matchRouteAfterExpansion(ft(r,this.options.base),o,e.location.state);this.emit("navigation:matched",n);let i=n.toRoute,s=i.length>0?i[i.length-1].url:"";if(this._currentNavUrl===s&&!this._languageNavBypass){this.logger.debug("\u5FFD\u7565\u91CD\u590D\u5BFC\u822A: {}",s),this.emit("navigation:cancel",e);return}this._currentNavUrl=s,++this.currentNavVersion;let u=this.currentNavVersion;this._navAbortController&&(this.logger.debug("\u4E2D\u6B62\u4E4B\u524D\u7684\u5BFC\u822A\u64CD\u4F5C"),this._navAbortController.abort()),this._navAbortController=new AbortController;let l=this._navAbortController.signal,c;try{if(l.aborted){this.logger.debug("\u5BFC\u822A\u5728\u8DEF\u7531\u5339\u914D\u540E\u88AB\u4E2D\u6B62");return}this.emit("navigation:matched",n),c=n.fromRoute,this.logger.debug("{} -> \u5BFC\u822A\u5230: {} {}, \u5339\u914D: {} ",()=>[i[0].id,r,o,i]);let p=await this.hooks.runBeforeRoute({from:c,to:i});if(l.aborted){this.logger.debug("\u5BFC\u822A\u5728\u5B88\u536B\u6267\u884C\u540E\u88AB\u4E2D\u6B62");return}if(typeof p=="string"){if(++this._redirectDepth>10){this._redirectDepth=0,this.logger.error("beforeRoute \u5B88\u536B\u6539\u9053\u8D85\u8FC7 10 \u6B21\uFF0C\u7591\u4F3C\u5FAA\u73AF\uFF0C\u5DF2\u53D6\u6D88\u5BFC\u822A"),this.emit("navigation:cancel",e);return}this.logger.debug("beforeRoute \u5B88\u536B\u8FD4\u56DE\u8DEF\u5F84\uFF0C\u6539\u9053: {}",p),this.replace(p);return}if(this._redirectDepth=0,!p){this.logger.debug("beforeEach \u5B88\u536B\u8FD4\u56DE false\uFF0C\u53D6\u6D88\u5BFC\u822A"),this.emit("navigation:cancel",e);return}let f=this._getCommonRouteIndex(c,i);this.dataLoader.loadDatas(i,l,f),this.viewLoader.loadViews(i,l,f),await this._renderRoutes(i,c,l),u===this.currentNavVersion&&!l.aborted&&(this._headApplyRoutePhase(i),this._headScheduleViewPhase(i,u),this._syncRouteState(i));}finally{u===this.currentNavVersion&&(this.isNavigating=false,this._currentNavUrl=void 0,this._navAbortController&&(this._navAbortController=null)),this.hooks.runAfterRoute({to:i}),this.routes.current=i,this.isNavigating=false,this.emit("navigation:end",e);}}_attachLinkDelegation(){let e=r=>this._handleDocumentLinkClick(r);return document.addEventListener("click",e),()=>document.removeEventListener("click",e)}_handleDocumentLinkClick(e){if(e.defaultPrevented)return;let r=this._findLinkFromEvent(e);if(r){r.handleClick(e);return}this._handlePlainAnchorClick(e);}_findLinkFromEvent(e){if(typeof e.composedPath=="function")for(let n of e.composedPath()){if(n instanceof F)return n;if(n===this.host||n===document)break}let o=e.target?.closest?.("auto-link");return o instanceof F?o:void 0}_findAnchorFromEvent(e){let r;if(typeof e.composedPath=="function")for(let o of e.composedPath()){if(o instanceof HTMLAnchorElement){r=o;break}if(o===this.host||o===document)break}if(!r){let n=e.target?.closest?.("a");n instanceof HTMLAnchorElement&&(r=n);}if(!(!r||!this.host.contains(r)))return r}_handlePlainAnchorClick(e){let r=this._findAnchorFromEvent(e);if(!r||r.closest("auto-link")||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;let o=r.getAttribute("target");if(o&&o!=="_self"||r.hasAttribute("download")||(r.getAttribute("rel")??"").split(/\s+/).includes("external"))return;let i=r.getAttribute("href");if(!i||i.startsWith("#"))return;if(te(i)){e.preventDefault();return}let s;try{s=new URL(i,window.location.href);}catch{return}s.protocol!=="http:"&&s.protocol!=="https:"||s.origin===window.location.origin&&(e.preventDefault(),this.push(ft(s.pathname,this.options.base)+s.search+s.hash));}async isStopNavigating(){if(this.isNavigating)return new Promise(e=>{let r=null,o=this.once("navigation:cancel",()=>{r?.(),e();});r=this.once("navigation:end",()=>{o(),e();});})}_ensureAttached(){if(!this.attached)throw new Error("[AutoSparkRouter] Cannot navigate: router is not attached to a host element. Call attach() first.")}handleGuardFailure(e){if(e.length>1){let r=e[e.length-2].route;this.replace(r.path);}else this.replace("/");}push(e,r){if(this._ensureAttached(),e.startsWith("!")){let o=e.slice(1);this.openModal({route:o});return}r!==void 0?this.history.push(e,r):this.history.push(e);}replace(e,r){this._ensureAttached(),r!==void 0?this.history.replace(e,r):this.history.replace(e);}home(){this._ensureAttached();let e=M(this.options.base||"",this.options.home||"/");this.replace(e);}back(){if(this._ensureAttached(),this.modalState.stack.length>0){this.closeTopModal();return}this.history.back();}forward(){this._ensureAttached(),this.history.forward();}go(e){this._ensureAttached(),this.history.go(e);}retry(){this._ensureAttached();let e=this.routes?.current;if(!e||e.length===0){this.logger.debug("retry: \u65E0\u5F53\u524D\u5339\u914D\u94FE\uFF0C\u5FFD\u7565");return}this._navAbortController&&(this.logger.debug("retry: \u4E2D\u6B62\u5728\u9014\u5BFC\u822A"),this._navAbortController.abort()),this._navAbortController=new AbortController;let r=this._navAbortController.signal;this.dataLoader.loadDatas(e,r,e.length),this.viewLoader.loadViews(e,r,e.length),this._renderRoutes(e,e,r);}_rerunForLanguageChange(){if(!this.attached)return;let e=this.routes?.current;e&&(this.dataLoader.resetLoadStates(e),this.viewLoader.resetLoadStates(e)),this._languageNavBypass=true;let r=this.onRouteUpdate({action:"REPLACE",location:this.history.location});Promise.resolve(r).catch(o=>this.logger.error("\u8BED\u8A00\u5207\u6362\u91CD\u5165\u5931\u8D25: {}",o)).finally(()=>{this._languageNavBypass=false;});}attach(){if(this.attached)throw new Error("Already attached to a host element");this.language.bootstrap(),this.history=this.mode==="hash"?At():Ee(),this.routes=new zt(this),this.hooks=new jt(this),this._headAttach(),this.routes.load().then(async()=>{this.viewLoader=new Xt(this),this.dataLoader=new Nt(this),this._cleanups.push(this.history.listen(this.onRouteUpdate.bind(this))),this._cleanups.push(this._attachLinkDelegation()),this._cleanups.push(()=>this.language.dispose()),this.attachContextProvider(),this._initModals(),this._engineBinding=ir(this),this._ensureDefaultOutlet(),this.attached=true,this.emit("routes:attached",void 0);let e=this.history.location.pathname,r=ft(e,this.options.base),o=e.endsWith(".html")||e.endsWith(".htm");if(r===""||r==="/")this.home();else {let n=await this._matchRouteAfterExpansion(r,this.history.location.search);this._hasRealMatch(n.toRoute)?this.replace(e):o?this.home():this.replace(e);}}).catch(e=>{this.logger.error("\u8DEF\u7531\u8868\u52A0\u8F7D\u5931\u8D25:{}",e);});}detach(){this.attached&&(this._headDetach(),this._cleanups.forEach(e=>e()),this._cleanups=[],this.viewLoader.cleanup(),this.dataLoader.cleanup(),this._engineBinding=void 0,this.abortController.abort(),this.removeContextProvider(),this.host instanceof HTMLElement&&(this.host.removeAttribute("data-autospark-router"),delete this.host.router),this.attached=false);}};function sr(a){let t=a.routes;if(t===false)return null;if(t==null)return a.autoDiscoverRoutes!==true?null:{routes:[{path:"/"}],autoDiscoverRoutes:true};if(!Array.isArray(t)&&typeof t=="object"&&"routes"in t){let{autoDiscoverRoutes:e,...r}=t;return r}return {routes:t}}function Gr(a,t){sr(a.options)!==null&&(nr(a.el),ut(a.el),Lt(pe,{id:ce}),t.components[z]==null&&(t.components[z]=Pt));}function Zr(a,t){let e=sr(a.options);e!==null&&new Qt(a.el,{...e,engine:a,languages:a.options.languages??e.languages});}function ur(){let a=r=>{r.precompile(Gr),r.ready(Zr);},t=globalThis.AutoSpark;if(typeof t?.precompile=="function"){a(t);return}(globalThis.__AUTOSPARK_PLUGINS__??=[]).push((r,o)=>a(o));}ur();
exports.AutoSparkImageViewRenderer=me;exports.AutoSparkJsonViewRenderer=fe;exports.AutoSparkLink=F;exports.AutoSparkRawViewRenderer=ct;exports.AutoSparkRouterElementBase=mt;exports.AutoSparkRouterViewRendererBase=P;exports.AutoSparkTemplateViewRenderer=G;exports.AutoSparkViewMeta=ee;exports.EventEmitter=gt;exports.IMAGE_EXTENSIONS=$e;exports.OUTLET_COMPONENT_ATTR=he;exports.OUTLET_COMPONENT_CODE=Pt;exports.OUTLET_COMPONENT_NAME=z;exports.X_OUTLET_ATTR=It;exports.compilePathPattern=kr;exports.createHashHistoryFromLib=Lo;exports.createLogger=De;exports.createRouteMatcher=fr;exports.findOutlet=at;exports.generateRouteHash=_o;exports.isDangerousProtocol=te;exports.isExternalLink=oe;exports.isInternalLink=_e;exports.joinPath=M;exports.matchRoute=Y;exports.normalizeHashPath=To;exports.normalizeRoutes=Tt;exports.params=q;exports.parsePathParams=Yo;exports.prefixBaseUrl=j;exports.registerOutletComponent=de;exports.resolveChildrenUrl=He;exports.transformXOutlet=ut;return exports;})({});//# sourceMappingURL=index.global.js.map
//# sourceMappingURL=index.global.js.map