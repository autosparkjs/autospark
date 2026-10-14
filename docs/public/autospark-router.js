var AutoSparkRouter=(function(exports){'use strict';var j=(o=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(o,{get:(e,t)=>(typeof require<"u"?require:e)[t]}):o)(function(o){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+o+'" is not supported')});function de(o,e,t){o.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:true,composed:true}));}var st=class o extends HTMLElement{constructor(){super(...arguments);this._contextRequested=false;this._contextCallback=t=>{this.router=t,this.onRouterReady();};}connectedCallback(){if(!this._contextRequested){let t=this._getRouterSync();t?(this.router=t,this.onRouterReady()):this.getRouter(),this._contextRequested=true;}}disconnectedCallback(){}onRouterReady(){}_getRouterSync(){let t=this,r=[];for(;t;){if(r.push(t instanceof HTMLElement?`${t.tagName.toLowerCase()}${t.id?"#"+t.id:""}${t.className?"."+t.className:""}`:t.tagName),t instanceof HTMLElement&&t.hasAttribute("data-autospark-router")||t instanceof o&&t.router)return t.router;t=t.parentElement;}}getRouter(t=this._contextCallback){if(this.router){t(this.router);return}de(this,"context-request",{context:"AutoSparkRouter",contextTarget:this,callback:r=>{this.router=r,t(r);}});}};function M(o,e){let t=o.replace(/\/+$/,""),r=e.replace(/^\/+/,"");return t?r?`${t}/${r}`:t||"/":`/${r}`}function rr(o){return o?o.startsWith("/")&&!o.includes("://"):false}function or(o){let e=o.trim().toLowerCase();return e.startsWith("javascript:")||e.startsWith("data:")}var lt=class extends st{constructor(){super(...arguments);this._to="";this._replace=false;this._target="";this._rel="";}get to(){return this._to}set to(t){let r=this._to;this._to=t,r!==t&&this._updateAttributes();}get replace(){return this._replace}set replace(t){this._replace;this._replace=t;}get target(){return this._target}set target(t){let r=this._target;this._target=t,r!==t&&this._updateAttributes();}get rel(){return this._rel}set rel(t){let r=this._rel;this._rel=t,r!==t&&this._updateAttributes();}_getComputedRel(){return this.rel?this.rel:this.target==="_blank"?"noopener noreferrer":""}connectedCallback(){super.connectedCallback(),this._render();}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("click",this._boundHandleClick);}attributeChangedCallback(t,r,a){let n=this._attributeToProperty(t);a!==null&&(this[n]=this._coerceAttributeValue(n,a));}_render(){this._updateAttributes(),this._boundHandleClick||(this._boundHandleClick=this.handleClick.bind(this)),this.addEventListener("click",this._boundHandleClick);}_updateAttributes(){this._to?this.setAttribute("href",this._to):this.removeAttribute("href"),this._target?this.setAttribute("target",this._target):this.removeAttribute("target");let t=this._getComputedRel();t?this.setAttribute("rel",t):this.removeAttribute("rel");}handleClick(t){let r=this.to;if(or(r)){t.preventDefault();return}rr(r)&&(this.getRouter(()=>{if(!this.router)return;let a=this.router.options.base||"",n=r;r.startsWith("/")?a!=="/"&&a!==""&&(r.startsWith(a)||(n=M(a,r))):n=M(a,r),this.replace?this.router.replace(n):this.router.push(n);}),t.preventDefault());}_attributeToProperty(t){return t}_coerceAttributeValue(t,r){return t==="replace"?r!==null&&r!=="false":r}};lt.observedAttributes=["to","replace","target","rel"];customElements.get("autospark-link")||customElements.define("autospark-link",lt);var he=new CSSStyleSheet;he.replaceSync(`
    :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 12px;
        font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell,
            "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
    }
    .spinner {
        width: 32px;
        height: 32px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .message {
        margin-top: 12px;
        color: #666;
        font-size: 14px;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
`);var me=he;var ut=class extends HTMLElement{constructor(){super(...arguments);this._message="Loading...";}get message(){return this._message}set message(t){let r=this._message;this._message=t||"Loading...",r!==this._message&&this._render();}connectedCallback(){this.shadowRoot||this.attachShadow({mode:"open"}),this.shadowRoot&&(this.shadowRoot.adoptedStyleSheets=[me]),this._render();}attributeChangedCallback(t,r,a){t==="message"&&a!==r&&(this.message=a||"Loading...");}_render(){if(!this.shadowRoot)return;this.shadowRoot.innerHTML="";let t=document.createElement("div");t.className="spinner";let r=document.createElement("div");r.className="message",r.textContent=this._message,this.shadowRoot.appendChild(t),this.shadowRoot.appendChild(r);}};ut.observedAttributes=["message"];customElements.get("autospark-loading")||customElements.define("autospark-loading",ut);function ge(o){let e=o.length,t=0,r="";for(;t<e;){let a=o[t];if(a==='"'){for(r+='"',t++;t<e&&o[t]!=='"';)o[t]==="\\"&&t+1<e&&(r+=o[t]),r+=o[t],t++;t<e&&(r+='"'),t++;continue}if(a==="'"){for(r+='"',t++;t<e&&o[t]!=="'";){if(o[t]==="\\"&&t+1<e){let n=o[t+1];n==="'"?r+="'":(r+=o[t],r+=n),t+=2;continue}o[t]==='"'?r+='\\"':r+=o[t],t++;}r+='"',t++;continue}if(ye(a)&&!(t>0&&nr(o[t-1]))){let n=t;for(;n<e&&ar(o[n]);)n++;let i=o.slice(t,n),s=n;for(;s<e&&fe(o[s]);)s++;if(s<e&&o[s]===":"){r+='"',r+=i,r+='"',t=n;continue}i==="true"||i==="false"||i==="null"?r+=i:r+='"'+i+'"',t=n;continue}if(a===","){let n=t+1;for(;n<e&&fe(o[n]);)n++;if(n<e&&(o[n]==="}"||o[n]==="]")){t++;continue}r+=a,t++;continue}r+=a,t++;}return r}function fe(o){return o===" "||o==="	"||o===`
`||o==="\r"}function ye(o){return o>="a"&&o<="z"||o>="A"&&o<="Z"||o==="_"||o==="$"}function ar(o){return ye(o)||o>="0"&&o<="9"||o==="-"}function nr(o){return o>="0"&&o<="9"||o==="."||o==="-"||o==="+"}var ke=new CSSStyleSheet;ke.replaceSync(`
    :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        padding: 24px;
        font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell,
            "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
        box-sizing: border-box;
    }

    :host([inline]) {
        width: auto;
        height: auto;
        min-width: 200px;
    }

    .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        max-width: 400px;
    }

    .icon {
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
    }

    .icon svg {
        width: 32px;
        height: 32px;
    }

    .icon.info {
        color: #ffffff;
        background-color: #3b82f6;
    }

    .icon.warn {
        color: #ffffff;
        background-color: #f59e0b;
    }

    .icon.error {
        color: #ffffff;
        background-color: #ef4444;
    }

    .icon.success {
        color: #ffffff;
        background-color: #22c55e;
    }

    .message {
        font-size: 20px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 8px;
        word-break: break-word;
    }

    .description {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 24px;
        line-height: 1.5;
        word-break: break-word;
    }

    .actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
    }

    .action-button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: #ffffff;
        color: #374151;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        box-sizing: border-box;
    }

    .action-button:hover {
        background: #f9fafb;
        border-color: #9ca3af;
    }

    .action-button:active {
        background: #f3f4f6;
        transform: translateY(1px);
    }

    .action-button.primary {
        background: #3b82f6;
        color: #ffffff;
        border-color: #3b82f6;
    }

    .action-button.primary:hover {
        background: #2563eb;
        border-color: #2563eb;
    }

    .action-button svg {
        width: 16px;
        height: 16px;
    }
`);var be=ke;var ve=o=>JSON.parse(ge(o)),Xt={info:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',warn:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',error:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',success:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>'},Jt={close:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',retry:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>',back:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>'},ct=class extends HTMLElement{constructor(){super(...arguments);this._closeable=false;this._retryable=false;this._backable=false;this._inline=false;}get message(){return this._message}set message(t){this._message=t,this._render();}get description(){return this._description}set description(t){this._description=t,this._render();}get icon(){return this._icon}set icon(t){this._icon=t,this._render();}get type(){return this._type}set type(t){this._type=t,this._render();}get actions(){return this._actions}set actions(t){this._actions=t,this._render();}get closeable(){return this._closeable}set closeable(t){this._closeable=t,this._render();}get retryable(){return this._retryable}set retryable(t){this._retryable=t,this._render();}get backable(){return this._backable}set backable(t){this._backable=t,this._render();}get inline(){return this._inline}set inline(t){this._inline=t,this._render();}connectedCallback(){this.attachShadow({mode:"open"}),this.shadowRoot&&(this.shadowRoot.adoptedStyleSheets=[be]),this._render();}attributeChangedCallback(t,r,a){if(r!==a)switch(t){case "message":this.message=a||void 0;break;case "description":this.description=a||void 0;break;case "icon":this.icon=a||void 0;break;case "type":this.type=a;break;case "actions":this.actions=a||void 0;break;case "closeable":this.closeable=a!==null;break;case "retryable":this.retryable=a!==null;break;case "backable":this.backable=a!==null;break;case "inline":this.inline=a!==null;break}}get _parsedActions(){if(!this._actions)return [];let t;if(typeof this._actions=="string")try{t=ve(this._actions);}catch{return console.warn("[autospark-feedback] Failed to parse actions:",this._actions),[]}else t=this._actions;return t.map(r=>{if(r.icon&&typeof r.icon=="string")try{let a=ve(r.icon);return {...r,icon:a}}catch{return r}return r})}get _allActions(){let t=[...this._parsedActions];return this._backable&&t.unshift({name:"back",title:"\u8FD4\u56DE",icon:Jt.back}),this._retryable&&t.unshift({name:"retry",title:"\u91CD\u8BD5",icon:Jt.retry,primary:true}),this._closeable&&t.push({name:"close",title:"\u5173\u95ED",icon:Jt.close}),t}_renderIcon(){let t=document.createElement("div");if(this._icon){if(t.className="icon",this._icon.trim().startsWith("<svg"))return t.innerHTML=this._icon,t;let r=document.createElement("img");return r.className="icon",r.src=this._icon,r.alt="",r}return this._type&&Xt[this._type]?(t.className=`icon ${this._type}`,t.innerHTML=Xt[this._type],t):(t.className="icon error",t.innerHTML=Xt.error,t)}_handleAction(t,r){r.preventDefault(),r.stopPropagation();let a=new CustomEvent("autospark:action",{detail:t,bubbles:true,composed:true});this.dispatchEvent(a);}_renderActionButton(t){let r=document.createElement("button");if(r.className="action-button",t.primary&&r.classList.add("primary"),r.title=t.tips||t.title||t.name,t.icon){let n=document.createElement("span");n.className="action-icon",n.innerHTML=t.icon,r.appendChild(n);}let a=document.createTextNode(t.title||t.name);return r.appendChild(a),r.addEventListener("click",n=>this._handleAction(t,n)),r}_render(){if(!this.shadowRoot)return;let t=document.createElement("div");t.className="container";let r=this._renderIcon();if(r&&t.appendChild(r),this._message){let n=document.createElement("div");n.className="message",n.textContent=this._message,t.appendChild(n);}if(this._description){let n=document.createElement("div");n.className="description",n.textContent=this._description,t.appendChild(n);}let a=this._allActions;if(a.length>0){let n=document.createElement("div");n.className="actions",a.forEach(i=>{n.appendChild(this._renderActionButton(i));}),t.appendChild(n);}this.shadowRoot.innerHTML="",this.shadowRoot.appendChild(t);}};ct.observedAttributes=["message","description","icon","type","actions","closeable","retryable","backable","inline"];customElements.get("autospark-feedback")||customElements.define("autospark-feedback",ct);var Yt=class extends HTMLElement{constructor(){super(),this.style.display="none";}get(e){return this.getAttribute(e)}set(e,t){t===null?this.removeAttribute(e):this.setAttribute(e,t);}getAll(){let e={};for(let t of this.attributes)e[t.name]=t.value;return e}has(e){return this.hasAttribute(e)}getJSON(e,t){let r=this.get(e);if(!r)return t;try{return JSON.parse(r)}catch{return t}}getBoolean(e){let t=this.get(e);return t==="true"||t===""}getArray(e,t=","){let r=this.get(e);return r?r.split(t).map(a=>a.trim()).filter(Boolean):[]}toString(){let e=this.getAll();return JSON.stringify(e,null,2)}};customElements.get("autospark-view-meta")||customElements.define("autospark-view-meta",Yt);function $(o,...e){let t=o.valueOf(),r={},a=[...e];try{if(a.length===0)return t;if(a.length===1){let n=a[0];if(n==null)return t;Array.isArray(n)?a=n:typeof n=="object"&&(r=n,a=[]);}return t=t.replace(/\{\s*([a-zA-Z\d]*)\s*\}/g,(n,i)=>{let s;return i&&r.hasOwnProperty(i)?s=r[i]:!i&&a.length>0&&(s=a.shift()),s==null?"":(typeof s=="function"&&(s=s()),String(s))}),t}catch{return t}}String.prototype.params=function(){return $(this,...arguments)};function Re(o){return {all:o=o||new Map,on:function(e,t){var r=o.get(e);r?r.push(t):o.set(e,[t]);},off:function(e,t){var r=o.get(e);r&&(t?r.splice(r.indexOf(t)>>>0,1):o.set(e,[]));},emit:function(e,t){var r=o.get(e);r&&r.slice().map(function(a){a(t);}),(r=o.get("*"))&&r.slice().map(function(a){a(e,t);});}}}var pt=class{constructor(){this._initEmitter();}_initEmitter(){this._emitter=Re();}on(e,t){this._emitter.on(e,t);let r=this._retainEvents?.get(e);return r!==void 0&&t(r),()=>this.off(e,t)}once(e,t){let a=(()=>{let n=true,i=s=>{n&&(n=false,t(s),this._emitter.off(e,i));};return i})();return this._emitter.on(e,a),()=>this._emitter.off(e,a)}off(e,t){t?this._emitter.off(e,t):this._emitter.all.clear();}onAny(e){return this._emitter.on("*",e),()=>this._emitter.off("*",e)}emit(e,t,r){r&&(this._retainEvents||(this._retainEvents=new Map),this._retainEvents.set(e,t)),this._emitter.emit(e,t);}};function ir(o,e){let t=o.parentElement;for(;t;){if(t===e)return  false;if(t instanceof HTMLElement&&t.hasAttribute("data-autospark-outlet"))return  true;t=t.parentElement;}return  false}function Z(o){if(!o)return [];let e=[],t=[o];for(;t.length>0;){let r=t.shift();for(let a of Array.from(r.children))ir(a,o)||(a instanceof HTMLElement&&a.hasAttribute("data-autospark-outlet")?e.push(a):a instanceof HTMLElement&&t.push(a));}return e}function dt(o,e=12){let t=3735928559,r=1103547991;for(let s=0;s<o.length;s++){let l=o.charCodeAt(s);t=Math.imul(t^l,2246822507),t=t<<13|t>>>19,r=Math.imul(r^l,3266489909),r=r<<7|r>>>25;}let a="",n=(t^r)>>>0,i=n%26+10;for(a+=i.toString(36);a.length<e;)n=Math.imul(n,2654435769),n=n<<5|n>>>27,a+=(n>>>0).toString(36);return a.substring(0,e)}function ko(o,e){let t=(o||"{path}").replace(/\s+/g,""),r=dt($(t,e));return isNaN(parseInt(r.substring(0,1)))?r:"h"+r}function F(){return F=Object.assign?Object.assign.bind():function(o){for(var e=1;e<arguments.length;e++){var t=arguments[e];for(var r in t)({}).hasOwnProperty.call(t,r)&&(o[r]=t[r]);}return o},F.apply(null,arguments)}var L;(function(o){o.Pop="POP",o.Push="PUSH",o.Replace="REPLACE";})(L||(L={}));var ft=process.env.NODE_ENV!=="production"?function(o){return Object.freeze(o)}:function(o){return o};function ht(o,e){if(!o){typeof console<"u"&&console.warn(e);try{throw new Error(e)}catch{}}}var gt="beforeunload",sr="hashchange",Se="popstate";function xe(o){o===void 0&&(o={});var e=o,t=e.window,r=t===void 0?document.defaultView:t,a=r.history;function n(){var m=r.location,p=m.pathname,b=m.search,A=m.hash,f=a.state||{};return [f.idx,ft({pathname:p,search:b,hash:A,state:f.usr||null,key:f.key||"default"})]}var i=null;function s(){if(i)v.call(i),i=null;else {var m=L.Pop,p=n(),b=p[0],A=p[1];if(v.length)if(b!=null){var f=c-b;f&&(i={action:m,location:A,retry:function(){x(f*-1);}},x(f));}else process.env.NODE_ENV!=="production"&&ht(false,"You are trying to block a POP navigation to a location that was not created by the history library. The block will fail silently in production, but in general you should do all navigation with the history library (instead of using window.history.pushState directly) to avoid this situation.");else S(m);}}r.addEventListener(Se,s);var l=L.Pop,u=n(),c=u[0],d=u[1],y=kt(),v=kt();c==null&&(c=0,a.replaceState(F({},a.state,{idx:c}),""));function h(m){return typeof m=="string"?m:mt(m)}function R(m,p){return p===void 0&&(p=null),ft(F({pathname:d.pathname,hash:"",search:""},typeof m=="string"?Gt(m):m,{state:p,key:we()}))}function k(m,p){return [{usr:m.state,key:m.key,idx:p},h(m)]}function g(m,p,b){return !v.length||(v.call({action:m,location:p,retry:b}),false)}function S(m){l=m;var p=n();c=p[0],d=p[1],y.call({action:l,location:d});}function E(m,p){var b=L.Push,A=R(m,p);function f(){E(m,p);}if(g(b,A,f)){var T=k(A,c+1),C=T[0],P=T[1];try{a.pushState(C,"",P);}catch{r.location.assign(P);}S(b);}}function w(m,p){var b=L.Replace,A=R(m,p);function f(){w(m,p);}if(g(b,A,f)){var T=k(A,c),C=T[0],P=T[1];a.replaceState(C,"",P),S(b);}}function x(m){a.go(m);}var _={get action(){return l},get location(){return d},createHref:h,push:E,replace:w,go:x,back:function(){x(-1);},forward:function(){x(1);},listen:function(p){return y.push(p)},block:function(p){var b=v.push(p);return v.length===1&&r.addEventListener(gt,yt),function(){b(),v.length||r.removeEventListener(gt,yt);}}};return _}function bt(o){o===void 0&&(o={});var e=o,t=e.window,r=t===void 0?document.defaultView:t,a=r.history;function n(){var p=Gt(r.location.hash.substr(1)),b=p.pathname,A=b===void 0?"/":b,f=p.search,T=f===void 0?"":f,C=p.hash,P=C===void 0?"":C,H=a.state||{};return [H.idx,ft({pathname:A,search:T,hash:P,state:H.usr||null,key:H.key||"default"})]}var i=null;function s(){if(i)v.call(i),i=null;else {var p=L.Pop,b=n(),A=b[0],f=b[1];if(v.length)if(A!=null){var T=c-A;T&&(i={action:p,location:f,retry:function(){_(T*-1);}},_(T));}else process.env.NODE_ENV!=="production"&&ht(false,"You are trying to block a POP navigation to a location that was not created by the history library. The block will fail silently in production, but in general you should do all navigation with the history library (instead of using window.history.pushState directly) to avoid this situation.");else E(p);}}r.addEventListener(Se,s),r.addEventListener(sr,function(){var p=n(),b=p[1];mt(b)!==mt(d)&&s();});var l=L.Pop,u=n(),c=u[0],d=u[1],y=kt(),v=kt();c==null&&(c=0,a.replaceState(F({},a.state,{idx:c}),""));function h(){var p=document.querySelector("base"),b="";if(p&&p.getAttribute("href")){var A=r.location.href,f=A.indexOf("#");b=f===-1?A:A.slice(0,f);}return b}function R(p){return h()+"#"+(typeof p=="string"?p:mt(p))}function k(p,b){return b===void 0&&(b=null),ft(F({pathname:d.pathname,hash:"",search:""},typeof p=="string"?Gt(p):p,{state:b,key:we()}))}function g(p,b){return [{usr:p.state,key:p.key,idx:b},R(p)]}function S(p,b,A){return !v.length||(v.call({action:p,location:b,retry:A}),false)}function E(p){l=p;var b=n();c=b[0],d=b[1],y.call({action:l,location:d});}function w(p,b){var A=L.Push,f=k(p,b);function T(){w(p,b);}if(process.env.NODE_ENV!=="production"&&ht(f.pathname.charAt(0)==="/","Relative pathnames are not supported in hash history.push("+JSON.stringify(p)+")"),S(A,f,T)){var C=g(f,c+1),P=C[0],H=C[1];try{a.pushState(P,"",H);}catch{r.location.assign(H);}E(A);}}function x(p,b){var A=L.Replace,f=k(p,b);function T(){x(p,b);}if(process.env.NODE_ENV!=="production"&&ht(f.pathname.charAt(0)==="/","Relative pathnames are not supported in hash history.replace("+JSON.stringify(p)+")"),S(A,f,T)){var C=g(f,c),P=C[0],H=C[1];a.replaceState(P,"",H),E(A);}}function _(p){a.go(p);}var m={get action(){return l},get location(){return d},createHref:R,push:w,replace:x,go:_,back:function(){_(-1);},forward:function(){_(1);},listen:function(b){return y.push(b)},block:function(b){var A=v.push(b);return v.length===1&&r.addEventListener(gt,yt),function(){A(),v.length||r.removeEventListener(gt,yt);}}};return m}function yt(o){o.preventDefault(),o.returnValue="";}function kt(){var o=[];return {get length(){return o.length},push:function(t){return o.push(t),function(){o=o.filter(function(r){return r!==t});}},call:function(t){o.forEach(function(r){return r&&r(t)});}}}function we(){return Math.random().toString(36).substr(2,8)}function mt(o){var e=o.pathname,t=e===void 0?"/":e,r=o.search,a=r===void 0?"":r,n=o.hash,i=n===void 0?"":n;return a&&a!=="?"&&(t+=a.charAt(0)==="?"?a:"?"+a),i&&i!=="#"&&(t+=i.charAt(0)==="#"?i:"#"+i),t}function Gt(o){var e={};if(o){var t=o.indexOf("#");t>=0&&(e.hash=o.substr(t),o=o.substr(0,t));var r=o.indexOf("?");r>=0&&(e.search=o.substr(r),o=o.substr(0,r)),o&&(e.pathname=o);}return e}function wo(o){let e=o.replace(/^#\/?/,"");return e.startsWith("/")||(e="/"+e),e=e.replace(/\/+/g,"/"),e.length>1&&(e=e.replace(/\/+$/,"")),e}function Ao(){return bt()}function Zt(o){if(!o||!o.trim())return  false;if(o.startsWith("//")){let{hostname:e}=window.location,t=document.createElement("a");return t.href=o,t.hostname!==e}if(/^[a-z][a-z0-9+.-]*:/i.test(o)){let e=document.createElement("a");return e.href=o,e.protocol!=="http:"&&e.protocol!=="https:"?true:e.hostname!==window.location.hostname||e.port!==window.location.port}return  false}function Ae(o){if(!o)return {};let e=new URLSearchParams(o.startsWith("?")?o.slice(1):o),t={};return e.forEach((r,a)=>{t[a]=r;}),t}function q(o){return {name:o.route.name,path:o.path,curPath:o.path,url:o.url,timestamp:Date.now(),query:new URLSearchParams(o.query).toString(),...o.route.meta,...o.params,...o.state}}function D(o,e){let t=q(e),r=dt($(o,t));return isNaN(parseInt(r.substring(0,1)))?r:"h"+r}function Q(o){let e=o?.route?.hash||"{url}";return D(e,o)}var U=class extends Error{constructor(t,r,a){super(t);this.status=0;this.status=r||0,this.route=a;}},tt=class extends Error{constructor(e,t){super(e),this.route=t;}},et=class extends Error{constructor(t,r="_self"){super(`External redirect: ${t}`);this.target="_self";this.name="AutoSparkExternalRouteError";this.url=t,this.target=r;}},V=class extends tt{constructor(e,t){super(`Redirect target not found: ${e}`,t),this.name="AutoSparkNotFoundRouteError",this.target=e;}},vt=class extends tt{constructor(e){let t=e.redirectFrom?.map(r=>r.url).join(" -> ");super(`Maximum redirect limit exceeded:${t} -> ...`,e);}},Rt=class extends tt{constructor(e){let t=e.redirectFrom?.map(r=>r.url).join(" -> ");super(`Redirect loop detected: ${t} -> ${t}`,e);}},I=class extends U{},St=class extends U{};var lr=0;function wt(o){return o==="/"||o===""?"/":o.replace(/\/+$/,"")}function te(o){let e=o;return e.startsWith("/")||(e="/"+e),e=e.replace(/\/+$/,""),e===""&&(e="/"),e.toLowerCase()}function Qt(o,e){if(o.startsWith("/"))return o;let t=e.path.split("/").filter(Boolean).slice(0,-1).join("/"),r=t?t.split("/"):[];if(o.startsWith("./")){let a=o.slice(2);return "/"+[...r,a].join("/")}if(o.startsWith("../")){let a=o,n=[...r];for(;a.startsWith("../");)a=a.slice(3),n.length>0&&n.pop();return a&&n.push(a),"/"+n.join("/")}return M(t||"/",o)}function ee(o,e,t){if(typeof o=="function"){let r=o(t);return r===null?null:ee(r,e,t)}if(typeof o=="string")return Zt(o)?{target:o,mode:"replace",isExternal:true}:{target:Qt(o,t),mode:"replace"};if("path"in o){let r=o;return Zt(r.path)?{target:r.path,mode:r.mode||"replace",windowTarget:r.target,isExternal:true}:{target:Qt(r.path,t),mode:r.mode||"replace",windowTarget:r.target}}if("name"in o){let r=o,n=e?.get(r.name)?.deref();if(!n)return {target:`name:${r.name}`,mode:r.mode||"replace",windowTarget:r.target,notFound:true};let i=n.path;if(r.params)for(let[s,l]of Object.entries(r.params))i=i.replace(`:${s}`,l).replace(`<${s}>`,l);if(r.query){let s=new URLSearchParams(r.query).toString();s&&(i+=`?${s}`);}return {target:Qt(i,t),mode:r.mode||"replace",windowTarget:r.target}}return null}function ur(o){return o.replace(/[.+^${}()|[\]\\]/g,"\\$&")}function Me(o){let e=o.indexOf("#");return e>=0?o.slice(0,e):o}function re(o){let e=Me(o),[t,r=""]=e.split("?",2),a=r?Ae("?"+r):{};return {pathname:t,query:a}}function _e(o,e){let t=[],r=o.split("/").filter(Boolean),a=[];for(let l=0;l<r.length;l++){let u=r[l];if(u==="**"){if(l!==r.length-1)throw new Error("Multi-wildcard '**' can only appear at the end of a pattern");a.push(".+");continue}if(u==="*"){a.push("[^/]+");continue}let c=u.match(/^:(\w+)(?:\((.+)\))?$/);if(c){let y=c[1],v=c[2];t.push(y),a.push(`(${v||"[^/]+"})`);continue}let d=u.match(/^<(\w+)(?:\((.+)\))?>$/);if(d){let y=d[1],v=d[2];t.push(y),a.push(`(${v||"[^/]+"})`);continue}a.push(ur(u.toLowerCase()));}let n;a.length>0&&a[a.length-1]===".*"?n=a.slice(0,-1).map(u=>"/"+u).join("")+"(?:/.*)?":n=a.map(l=>"/"+l).join("");let s;return e?s=`^${n}/?$`:s=`^${n}(?:/(.*))?$`,{regex:new RegExp(s),paramNames:t}}function cr(o,e){let r=o.split("/").filter(Boolean).map(a=>{let n=a.match(/^:(\w+)(?:\(.+\))?$/);if(n){let s=n[1];return e[s]??a}let i=a.match(/^<(\w+)(?:\(.+\))?>$/);if(i){let s=i[1];return e[s]??a}return a});return r.length>0?"/"+r.join("/"):"/"}function ae(o,e,t,r){for(let a of o)if(a.default===true){let n=M(e.path,a.path),i={...e.params,...a.params},s={...a.query,...t},l=cr(n,i),u=wt(l),c={route:a,params:i,query:s,state:{},path:n,url:u,hash:"",id:r};if(c.hash=Q(c),Array.isArray(a.children)&&a.children.length>0){let d=ae(a.children,c,t,r);if(d&&d.length>0)return [c,...d]}return [c]}return null}function xt(o,e,t,r){let a=e?.path||"",n=e?.url||"",i=e?.params||{},s=M(a,o),l=wt(M(n,o));return {route:void 0,params:i,query:t,state:{},path:s,url:l,hash:`unmatched-${s.replace(/\//g,"-")}`,id:r}}function pr(o,e=false){let t=o.path;if(t==="*"){let{regex:s,paramNames:l}=_e("/*",false);return u=>{let d=te(re(u).pathname).match(s);if(d){let y={};l.forEach((R,k)=>{y[R]=d[k+1]||"";});let v="",h=l.length+1;return v=d[h]||"",{matched:true,params:y,remainingPath:v}}return {matched:false,params:{},remainingPath:u}}}let r=t==="/"?"/":t.replace(/^\/+/,""),a=r.startsWith("/")?r:"/"+r,{regex:n,paramNames:i}=_e(a,!e);return s=>{let u=te(re(s).pathname).match(n);if(u){let c={};i.forEach((y,v)=>{c[y]=u[v+1]||"";});let d="";if(e){let y=i.length+1;d=u[y]||"";}return {matched:true,params:c,remainingPath:d}}return {matched:false,params:{},remainingPath:s}}}function Ee(o,e,t,r,a){let n=t?.path||"",i=t?.params||{},s=t?.url||"",l=!Array.isArray(o.children)||o.children.length===0,c=pr(o,true)(e);if(!c.matched||(o.path===""||o.path==="/")&&t&&c.remainingPath)return null;let d=wt(e.slice(0,e.length-(c.remainingPath?.length||0))),y=wt(M(s,d)),v=M(n,o.path),h=Object.assign({},o.params,i,c.params),R=o.query||{},k={route:o,params:h,query:R,state:{},path:v,url:y,hash:"",id:a};if(k.hash=Q(k),!c.remainingPath){if(Array.isArray(o.children)&&o.children.length>0){let g=ae(o.children,k,r,a);if(g&&g.length>0)return [k,...g];let S=oe("/",o.children,k,r,a);return S.length>0?[k,...S]:[k]}return k.query={...R,...r},[k]}if(Array.isArray(o.children)&&o.children.length>0){let g="/"+c.remainingPath,S=oe(g,o.children,k,r,a);if(S.length>0)return [k,...S];if(o.path==="*"||o.path.endsWith("/*")){let w=xt(c.remainingPath,k,r,a);return [k,w]}let E=xt(c.remainingPath,k,r,a);return [k,E]}if(!l&&c.remainingPath)return null;if(c.remainingPath&&o.path==="*"){if(!t||t.path==="/")return null;let g=xt(c.remainingPath,k,r,a);return [k,g]}return [k]}function oe(o,e,t,r={},a){for(let n of e){if(n.path==="*"||n.path.includes("*"))continue;let i=Ee(n,o,t,r,a);if(i)return i}for(let n of e){if(!n.path.includes("*"))continue;let i=Ee(n,o,t,r,a);if(i)return i}return t===null?o==="/"||o===""?[]:[xt(o,null,r,a)]:[]}function B(o,e,t){let{pathname:r,query:a}=re(o),n=te(r),i=Me(o),s=i.includes("?")?i.slice(i.indexOf("?")+1):"",l=t?._redirectChain||[],u=t?.maxRedirect??10,c=t?.namedRoutes,d=++lr,y={id:d,route:e,params:{},query:a,url:"/",path:"/",hash:""};y.hash=Q(y);let v=Array.isArray(e.children)?e.children:[],h=oe(n,v,null,a,d);if(h.some(g=>g.route!==void 0))h=[y,...h];else if(n==="/"||n===""){let g=ae(v,y,a,d);g&&g.length>0?h=[y,...g]:h=[y];}else if(h.length>0)h=[y,...h];else return [];s&&h.forEach(g=>{g.url.includes("?")||(g.url=`${g.url}?${s}`,g.route&&(g.hash=Q(g)));});let k=h[h.length-1];if(u<0){let g=h[h.length-1];return [...h.slice(0,-1),{...g,route:void 0,error:new vt(g),redirectFrom:l.length>0?[...l]:void 0}]}if(l.some(g=>g.url===n)){let g=h[h.length-1];return [...h.slice(0,-1),{...g,route:void 0,error:new Rt(g),redirectFrom:l.length>0?[...l]:void 0}]}if(k?.route?.redirect){let g=ee(k.route.redirect,c,k);if(g===null)return h.map(f=>({...f,redirectFrom:void 0}));let{target:S,mode:E,windowTarget:w,notFound:x,isExternal:_}=g;if(x){let f=h[h.length-1];return [...h.slice(0,-1),{...f,target:w,error:new V(S,f),redirectFrom:l.length>0?[...l]:void 0}]}if(_){let f=h[h.length-1];return [...h.slice(0,-1),{...f,target:w||"_blank",error:new et(S,w||"_blank"),redirectFrom:l.length>0?[...l]:void 0}]}let m=[...l,{url:n,mode:E}],p=B(S,e,{...t,_redirectChain:m,maxRedirect:u-1});if(p.some(f=>f.error!==void 0))return p;if(!(p.length>1&&p.slice(1).some(f=>f.route!==void 0))){let f=h[h.length-1];return [...h.slice(0,-1),{...f,target:w,error:new V(S,f),redirectFrom:l.length>0?[...l]:void 0}]}return p.map(f=>({...f,target:w}))}if(t?.redirect&&!k?.route?.redirect&&l.length===0){let g=ee(t.redirect,c,k);if(g){let{target:S,mode:E,windowTarget:w,notFound:x,isExternal:_}=g;if(x){let f=h[h.length-1];return [...h.slice(0,-1),{...f,target:w,error:new V(S,f),redirectFrom:l.length>0?[...l]:void 0}]}if(_){let f=h[h.length-1];return [...h.slice(0,-1),{...f,target:w||"_blank",error:new et(S,w||"_blank"),redirectFrom:l.length>0?[...l]:void 0}]}let m=[...l,{url:n,mode:E}],p=B(S,e,{...t,_redirectChain:m,maxRedirect:u-1});if(p.some(f=>f.error!==void 0))return p;if(!(p.length>1&&p.slice(1).some(f=>f.route!==void 0))){let f=h[h.length-1];return [...h.slice(0,-1),{...f,target:w,error:new V(S,f),redirectFrom:l.length>0?[...l]:void 0}]}return p.map(f=>({...f,target:w}))}}return h.map(g=>({...g,redirectFrom:l.length>0?[...l]:void 0}))}function dr(o){let e=o.trim();if(e==="/"||e===""||e==="./")return ["/"];let t=e.replace(/^\/+|\/+$/g,"");return t?t.split("/").filter(Boolean):["/"]}function Te(o){let e=o.path.trim();return e===""||e==="/"||e==="./"}function hr(o,e){let t=!o.children.has(e);return t&&o.children.set(e,{route:{path:e},children:new Map}),{node:o.children.get(e),isNew:t}}function mr(o){return o.default===true}function Oe(o){let e=[];for(let[,t]of o.children){let{children:r,...a}=t.route,n={...a};t.children.size>0?n.children=Oe(t):r!==void 0&&!Array.isArray(r)&&(n.children=r),e.push(n);}return e}function At(o,e){let t=dr(e.path);if(t.length===1&&t[0]==="/"&&!mr(e)){if(Array.isArray(e.children))for(let i of e.children)At(o,i);return}let a=t[t.length-1]==="**",n=o;for(let i=0;i<t.length;i++){let s=t[i],l=i===t.length-1,{node:u}=hr(n,s);if(n=u,l){let c=a?{...e,path:s,children:void 0}:{...e,path:s};if(n.route=c,Array.isArray(e.children)&&!a)for(let d of e.children)At(n,d);}}}function _t(o){let e=o?Array.isArray(o)?o:[o]:[];if(e.length===0)return {path:"/"};let t=e.find(Te),r=e.filter(s=>!Te(s)),a={route:{},children:new Map};if(t&&Array.isArray(t.children))for(let s of t.children)At(a,s);for(let s of r)At(a,s);let n={path:"/"};if(t){let{path:s,children:l,...u}=t;Object.assign(n,u);}let i=Oe(a);return i.length>0?n.children=i:t&&!Array.isArray(t.children)&&t.children!==void 0&&(n.children=t.children),n}function fr(o){let e=[],t=o.split("/").filter(Boolean),r=[];for(let n of t){if(n==="*"){r.push(".*");continue}let i=n.match(/^:(\w+)(?:\((.+)\))?$/);if(i){e.push(i[1]),r.push(`(${i[2]||"[^/]+"})`);continue}let s=n.match(/^<(\w+)(?:\((.+)\))?>$/);if(s){e.push(s[1]),r.push(`(${s[2]||"[^/]+"})`);continue}r.push(n.toLowerCase().replace(/[.+^${}()|[\]\\]/g,"\\$&"));}let a=r.map(n=>"/"+n).join("");return {regex:new RegExp(`^${a}/?$`,"i"),paramNames:e}}function Bo(o,e){let{regex:t,paramNames:r}=fr(o),n=(e.replace(/\/+$/,"")||"/").match(t);if(!n)return {};let i={};return r.forEach((s,l)=>{let u=n[l+1];u!==void 0&&(i[s]=u);}),i}function z(o,e){if(o.includes("://")||o.startsWith("//"))return o;let t=e||"";return !t||t==="/"?o:o.startsWith("/")?o.startsWith(t)?o:M(t,o):M(t,o)}function gr(o){return o.includes("://")||o.startsWith("//")}function yr(o,e){return e.split(".").reduce((t,r)=>t?.[r],o)}function kr(o,e){let t=o.replace(/\{\s*meta\.([\w.]+)\s*\}/g,(r,a)=>{let n=yr(e.meta,a);return n==null?"":String(n)});return $(t,{path:e.path,name:e.name??"",timestamp:Date.now()})}function Ce(o,e,t){let r=o===true?e.routesFile||"routes.json":o,a=kr(r,e),n=gr(a)||a.startsWith("/")?a:M(e.path,a);return z(n,t)}var Ne=(o,e,t=[])=>{let r=Object.getOwnPropertyDescriptors(e);for(let a of t)delete r[a];Object.defineProperties(o,r);},W=(o,e=[o])=>{let t=Object.getPrototypeOf(o);return t===null?e:W(t,[...e,t])},br=(...o)=>{if(o.length===0)return;let e,t=o.map(r=>W(r));for(;t.every(r=>r.length>0);){let r=t.map(n=>n.pop()),a=r[0];if(r.every(n=>n===a))e=a;else break}return e},Pe=(o,e,t=[])=>{var r;let a=(r=br(...o))!==null&&r!==void 0?r:Object.prototype,n=Object.create(a),i=W(a);for(let s of o){let l=W(s);for(let u=l.length-1;u>=0;u--){let c=l[u];i.indexOf(c)===-1&&(Ne(n,c,["constructor",...t]),i.push(c));}}return n.constructor=e,n},ne=o=>o.filter((e,t)=>o.indexOf(e)==t),je=new WeakMap,Rr=o=>je.get(o),Sr=(o,e)=>je.set(o,e);var Le=(o,e)=>{var t,r;let a=ne([...Object.getOwnPropertyNames(o),...Object.getOwnPropertyNames(e)]),n={};for(let i of a)n[i]=ne([...(t=o?.[i])!==null&&t!==void 0?t:[],...(r=e?.[i])!==null&&r!==void 0?r:[]]);return n},Ie=(o,e)=>{var t,r,a,n;return {property:Le((t=o?.property)!==null&&t!==void 0?t:{},(r=e?.property)!==null&&r!==void 0?r:{}),method:Le((a=o?.method)!==null&&a!==void 0?a:{},(n=e?.method)!==null&&n!==void 0?n:{})}},$e=(o,e)=>{var t,r,a,n,i,s;return {class:ne([...(t=o?.class)!==null&&t!==void 0?t:[],...(r=e?.class)!==null&&r!==void 0?r:[]]),static:Ie((a=o?.static)!==null&&a!==void 0?a:{},(n=e?.static)!==null&&n!==void 0?n:{}),instance:Ie((i=o?.instance)!==null&&i!==void 0?i:{},(s=e?.instance)!==null&&s!==void 0?s:{})}},ie=new Map,xr=(...o)=>{var e;let t=new Set,r=new Set([...o]);for(;r.size>0;)for(let a of r){let n=W(a.prototype).map(u=>u.constructor),i=(e=Rr(a))!==null&&e!==void 0?e:[],l=[...n,...i].filter(u=>!t.has(u));for(let u of l)r.add(u);t.add(a),r.delete(a);}return [...t]},wr=(...o)=>{let e=xr(...o).map(t=>ie.get(t)).filter(t=>!!t);return e.length==0?{}:e.length==1?e[0]:e.reduce((t,r)=>$e(t,r))};function Fe(...o){var e,t,r;let a=o.map(l=>l.prototype);function i(...l){for(let u of o)Ne(this,new u(...l));}i.prototype=Pe(a,i),Object.setPrototypeOf(i,Pe(o,null,["prototype"]));let s=i;{let l=wr(...o);for(let u of (e=l?.class)!==null&&e!==void 0?e:[]){let c=u(s);c&&(s=c);}He((t=l?.static)!==null&&t!==void 0?t:{},s),He((r=l?.instance)!==null&&r!==void 0?r:{},s.prototype);}return Sr(s,o),s}var He=(o,e)=>{let t=o.property,r=o.method;if(t)for(let a in t)for(let n of t[a])n(e,a);if(r)for(let a in r)for(let n of r[a])n(e,a,Object.getOwnPropertyDescriptor(e,a));};var Mt=class{attachContextProvider(){this._onContextRequest=this.onContextRequest.bind(this),this.host.addEventListener("context-request",this._onContextRequest);}removeContextProvider(){this._onContextRequest&&this.host.removeEventListener("context-request",this._onContextRequest);}onContextRequest(e){let t=e.detail;t.context==="AutoSparkRouter"&&(e.stopPropagation(),t.callback(this));}};var X=class extends Error{constructor(){super(...arguments),this.name="AbortError";}},se=class extends Error{constructor(){super(...arguments),this.name="TimeoutError";}},Er=0;function N(o){let{autoReset:e=false,abortAt:t="all",until:r,abortSignal:a}=o||{},n=false,i=false,s=true,l=false,u,c,d=0,y,v=++Er,h=null,R=null,k,g,S=0,E={},w=function(){clearTimeout(d),h&&t==="all"&&h.abort(),n=false,i=false,s=true,l=false,g=void 0,k=void 0,S=0,h=null,y=new Promise((_,m)=>{u=_,c=m;});};w();async function x(_){let{timeout:m=0,returns:p,abortSignal:b}=_||{};if(b&&!b.aborted&&b.addEventListener("abort",()=>x.abort(),{once:true}),typeof r=="function"&&r())return n=true,k;if(n||i)if(e)w();else {if(i)throw g;return k}return m>0&&(d=setTimeout(()=>{if(!(l||!s||n||i)){l=true,s=false,p instanceof Error?(i=true,n=false):(n=true,i=false);try{S=Date.now(),p instanceof Error?(g=p,c(p)):(k=p,u(k));}catch{}finally{l=false;}}},m)),y}return x.id=v,x.resolve=_=>{if(clearTimeout(d),!(typeof r=="function"&&!r())&&!(l||!s||n||i)){l=true,s=false,n=true,i=false;try{h&&(t==="all"||t==="resolve")&&h.abort(),k=_,g=void 0,S=Date.now(),u(_);}catch{}finally{l=false;}}},x.reject=_=>{if(clearTimeout(d),!(l||!s||n||i)){l=true,s=false,n=false,i=true;try{let m=typeof _=="string"?new Error(_):_ instanceof Error?_:new Error;g=m,S=Date.now(),h&&(t==="all"||t==="reject")&&h.abort(),y?.catch(()=>{}),c(m);}catch{}finally{l=false;}}},x.destroy=()=>{try{clearTimeout(d),R&&a&&(a.removeEventListener("abort",R),R=null),s&&(setTimeout(()=>{try{c(new X);}catch{}}),h&&h.abort()),n=!1,i=!1,s=!1,l=!1,y=null,h=null,k=void 0,g=void 0,S=0;}catch{}},x.reset=w,x.isFulfilled=()=>n,x.isRejected=()=>i,x.isPending=()=>s,Object.defineProperty(x,"result",{get:()=>k,enumerable:true,configurable:true}),Object.defineProperty(x,"error",{get:()=>g,enumerable:true,configurable:true}),Object.defineProperty(x,"timestamp",{get:()=>S,enumerable:true,configurable:true}),Object.defineProperty(x,"meta",{get:()=>E,enumerable:true,configurable:true}),x.abort=()=>{h&&h.abort(),x.reject(new X);},a&&!a.aborted&&(R=()=>{x.abort(),R&&a&&(a.removeEventListener("abort",R),R=null);},a.addEventListener("abort",R)),x.getAbortSignal=()=>(h===null&&(h=new AbortController),h?.signal),x}N.resolve=o=>{let e=N();return e.resolve(o),e};N.reject=o=>{let e=N();return e().catch(()=>{}),e.reject(o),e};var K;function Tt(){K||(K=new Map);}var le={get:o=>(Tt(),K.get(o)),set:(o,e)=>{Tt(),K.set(o,e);},delete:o=>{Tt(),K.delete(o);},clear:()=>{Tt(),K.clear();}};function Ve(o){let e=o.trim(),t=e.indexOf("?");t!==-1&&(e=e.substring(0,t));let r=e.indexOf("#");r!==-1&&(e=e.substring(0,r));let a=e;if(a.endsWith("/"))a=a+"data.json";else {let n=a.lastIndexOf("/"),i=a.lastIndexOf(".");i!==-1&&i>n?a=a.substring(0,i)+".json":a=a+".json";}return a}function ot(o){if(!o||typeof o!="object")return  false;let e=Object.getPrototypeOf(o);return e===null||e===Object.prototype||Object.getPrototypeOf(e)===null?Object.prototype.toString.call(o)==="[object Object]":false}function at(o){return o&&typeof o=="function"}(o=>typeof j<"u"?j:typeof Proxy<"u"?new Proxy(o,{get:(e,t)=>(typeof j<"u"?j:e)[t]}):o)(function(o){if(typeof j<"u")return j.apply(this,arguments);throw Error('Dynamic require of "'+o+'" is not supported')});var Mr=/<[^>]+>/;function J(o){if(typeof o!="string"||o.trim()==="")return  false;let e=o.trim();return !(e.includes(`
`)||Mr.test(e))}function qe(o,e){let t=e;for(let r=0;r<o.length;r++)t^=o.charCodeAt(r),t=Math.imul(t,16777619),t|=0;return t}function Tr(o){let e=o.toString(),t=qe(e,2166136261),r=qe(e,2216829733),a=(t>>>0).toString(16).padStart(8,"0"),n=(r>>>0).toString(16).padStart(8,"0");return a+n}function Or(o){return o.map(e=>Tr(e)).join("|")}function Ue(...o){if(o.length!==0){if(o.length===1)return o[0];for(let e of o)if(e.aborted)return e;return typeof AbortSignal.any=="function"?AbortSignal.any(o):Cr(o)}}function Cr(o){let e=new AbortController,t=()=>{e.abort();for(let r of o)r.removeEventListener("abort",t);};for(let r of o)r.addEventListener("abort",t);return e.signal}function nt(o,...e){if(!o)return;let t=Array.isArray(o)?o:[o];for(let r of t)if(typeof r=="function")try{let a=r(...e);a&&typeof a=="object"&&typeof a.then=="function"&&a.catch(()=>{});}catch{}}var Be=class O{constructor(e,t){this.loader=e,this.loading=false,this.id=0,this._retryTimerId=0,this._loadToken=0,this._strategy="fallback",this._presetSettled=false;var r;if(this.options=Object.assign({autostart:true,cache:0,retry:0,retryDelay:0,storage:le,multiplex:"off",meta:{}},t),this._loaders.length===0)throw new Error("AsyncLoader requires at least one loader");let a=this._loaders.length>1;if(this.options.multiLoaderStrategy==="combine"&&a){if(typeof this.options.onResults!="function")throw new Error('multiLoaderStrategy="combine" requires onResults');this._strategy="combine";}else this._strategy="fallback";let n=(r=this.options.multiplex)!=null?r:"off";if((n!=="off"||this.options.cache>0)&&!this.options.hash&&(this.options.hash=Or(this._loaders)),n!=="off"){O.loaderCache!=null||(O.loaderCache=new Map);let i=O._getLoader(this.options.hash);if(i)return i.loading&&this.options.multiplex==="restart"&&(i.clear(),i.abort(),i.load()),i;O.loaderCache.set(this.options.hash,new WeakRef(this));}this.id=++O.seq,this.signal=N(),this.options.autostart&&this.load();}static _getLoader(e){let t=O.loaderCache;if(!t)return;let r=t.get(e);if(!r)return;let a=r.deref();return a||t.delete(e),a}static clearLoaderCache(){var e;(e=O.loaderCache)==null||e.clear();}static resolve(e){let t=new O(()=>e,{autostart:false});return t._presetSettled=true,t.signal.resolve(e),t}static reject(e){let t=new O(()=>{throw e},{autostart:false});return t._presetSettled=true,t.signal.reject(e),t}get _loaders(){return Array.isArray(this.loader)?this.loader:[this.loader]}get storage(){return this.options.storage}get hash(){return this.options.hash}get meta(){return this.options.meta}get error(){return this.signal.error}get result(){return this.signal.result}load(){var e;if(this.loading)return;(this.signal.isFulfilled()||this.signal.isRejected())&&this.signal.reset();let t=this._getCacheItem();if(t){this.signal.resolve(t.value),this._removeFromLoaderCache();return}let r=[this.signal.getAbortSignal()];this.options.abortSignal&&r.push(this.options.abortSignal);let a=Ue(...r);((e=this.options.multiplex)!=null?e:"off")!=="off"&&this.options.hash&&(O.loaderCache!=null||(O.loaderCache=new Map),O.loaderCache.set(this.options.hash,new WeakRef(this))),nt(this.options.onPending),this.loading=true,this._loadToken++,this._executeLoad(a,0);}_executeLoad(e,t){let r=this._loadToken,a=0,n=null;this.options.timeout&&this.options.timeout>0&&(n=new AbortController,a=setTimeout(()=>n.abort(),this.options.timeout));let i=[e];n&&i.push(n.signal);let s={abortSignal:Ue(...i),meta:this.meta},l;try{l=this._composedLoader(s);}catch(u){l=Promise.reject(u);}Promise.resolve(l).then(u=>{a&&clearTimeout(a),r===this._loadToken&&(this._setCacheItem(u),this.loading=false,this.signal.resolve(u),this._removeFromLoaderCache(),nt(this.options.onFulfilled,u));}).catch(u=>{var c,d;if(a&&clearTimeout(a),r!==this._loadToken)return;let y=(c=this.options.retry)!=null?c:0;if(t<y&&!e.aborted)this._retryTimerId=setTimeout(()=>{this._retryTimerId=0,this._executeLoad(e,t+1);},(d=this.options.retryDelay)!=null?d:0);else {let v=n!=null&&n.signal.aborted?new se:u;if(this.loading=false,!e.aborted&&this.options.defaultValue!==void 0)this.signal.resolve(this.options.defaultValue),this._removeFromLoaderCache(),nt(this.options.onFulfilled,this.options.defaultValue);else {let h=e.aborted;this.signal.reject(v),this._removeFromLoaderCache(),h||nt(this.options.onRejected,v);}}});}_composedLoader(e){let t=this._loaders;return this._strategy==="combine"&&t.length>1?this._composeCombine(e):t.length===1?t[0](e):this._composeFallback(e)}_composeFallback(e){return new Promise((t,r)=>{let a=this._loaders,n=e.abortSignal,i=0,s,l=()=>{if(n.aborted){r(new X);return}if(i>=a.length){r(s??new Error("all loaders failed"));return}let u=a[i++],c;try{c=u(e);}catch(d){c=Promise.reject(d);}Promise.resolve(c).then(d=>t(d),d=>{s=d instanceof Error?d:new Error(String(d)),l();});};l();})}_composeCombine(e){let t=this._loaders.map(r=>{try{return Promise.resolve(r(e))}catch(a){return Promise.reject(a)}});return Promise.allSettled(t).then(r=>{if(e.abortSignal.aborted)throw new X;let a=r.map(n=>n.status==="fulfilled"?n.value:n.reason instanceof Error?n.reason:new Error(String(n.reason)));return this.options.onResults(a,this.options.defaultValue)})}_removeFromLoaderCache(){var e;let t=O.loaderCache;this.options.hash&&((e=t?.get(this.options.hash))==null?void 0:e.deref())===this&&t.delete(this.options.hash);}_useCache(){return this.options.cache>0&&this.options.hash}_setCacheItem(e){this._useCache()&&this.storage.set(this.options.hash,{value:e,timestamp:Date.now()});}_getCacheItem(){if(!this._useCache())return;let e=this.storage.get(this.options.hash);if(e){if(Date.now()-e.timestamp>this.options.cache){this.storage.delete(this.options.hash);return}return e}}get(e){let t=this._useCache()&&!this._getCacheItem();return !this._presetSettled&&!this.loading&&(!this.signal.isFulfilled()||t)&&this.load(),this.signal(e)}invalidate(){this._presetSettled=false,this.clear(),!this.loading&&(this.signal.isFulfilled()||this.signal.isRejected())&&this.signal.reset();}refresh(e){return this._presetSettled=false,this.loading&&this.abort(),this.clear(),this.load(),this.signal(e)}abort(){let e=this.loading;this.signal.abort(),this.loading=false,this._removeFromLoaderCache(),this._retryTimerId&&(clearTimeout(this._retryTimerId),this._retryTimerId=0),e&&nt(this.options.onRejected,this.signal.error);}clear(){this._useCache()&&this.options.hash&&this.storage.delete(this.options.hash);}clearAll(){this.storage.clear();}isPending(){return this.loading}isFulfilled(){return this.signal.isFulfilled()}isRejected(){return this.signal.isRejected()}};Be.seq=0;var ze=Be;var Ot=class{constructor(e){this.cache=new Map;this.router=e,this.options=Object.assign({timeout:0,cache:0,hash:"{path}"},e.options.dataOptions||{});}getLoader(e){return e.route._getData}getSignal(e){return this.getLoader(e)?.signal}_createLoader(e,t,r){let a=this._createLoaderFn(e,t),n=new ze(a,{hash:e.hash,meta:{hash:e.hash},cache:t.cache,timeout:t.timeout,retry:t.retry,retryDelay:t.retryDelay,multiplex:t.multiplex,defaultValue:t.default,abortSignal:r,storage:this.cache});return e.route._getData=n,n}_createLoaderFn(e,t){return async({abortSignal:r,meta:a})=>{let n=t.from;if(ot(n)&&!J(n))return this._validateData(n);if(J(n)||n===true){let i=n===true?this._getAutoUrl(e):n;if(!i)throw new I("No valid URL found");let s=z(i.params(q(e)),this.router.options.base);a.url=s;let l=await fetch(s,{signal:r});if(!l.ok)throw a.statusCode=l.status,new I(`Failed to load ${s} : ${l.statusText}`,l.status);return this._validateData(await l.json())}if(at(n))return this._validateData(await n(e));throw new I("Invalid data source")}}_getRouteOptions(e){return e.route._dataOptions||(e.route._dataOptions=this._mergeRouteOptions(e)),e.route._dataOptions}_mergeRouteOptions(e){let t=e.route.data||{},r=ot(t)&&"from"in t;return {...this.options,...r?t:{from:t}}}loadStateOf(e){if(e.route)return e.route._dataLoadState}setLoadState(e,t){e.route&&(e.route._dataLoadState=t);}loadRoutes(e,t,r=0){return Promise.allSettled(e.map((a,n)=>{if(!(n<r&&this.loadStateOf(a)==="ok"))return this._loadRoute(a,t)}))}async _loadRoute(e,t){if(!e.route?.data)return;let r=this._getRouteOptions(e);try{await this._createLoader(e,r,t).get(),this.setLoadState(e,"ok");}catch(a){a.name!=="AbortError"&&(this.setLoadState(e,"error"),this.router.logger.error(`DataLoader: Failed to load data for route ${e.path}`,()=>[a]));}}_getHash(e,t){return t.hash?D(t.hash,e):D("{path}",e)}_isValidData(e){return ot(e)}_validateData(e){if(!this._isValidData(e))throw new I("Invalid data format: expected plain object");return e}_getAutoUrl(e){if(e.route){let t=e.route.view,r=typeof t=="function"?t(e):t;if(typeof r=="string")return Ve(r)}}async loadDatas(e,t,r=0){return this.loadRoutes(e,t,r)}invalidateRoute(e){this.getLoader(e)?.invalidate();}async refreshRoute(e){let t=this.getLoader(e);if(!t)throw new Error("No loader found for this route");return await t.refresh()}abortRoute(e){this.getLoader(e)?.abort();}isLoading(e){return this.getLoader(e)?.loading||false}cleanup(){this.cache.clear();}};var Ct=class{constructor(e){this.router=e,this.hooks={beforeRoute:[],afterRoute:[],beforeRender:[],afterRender:[],routeError:[]},this.options=Object.assign({timeout:3e3},e.options.hookOptions),this._addGlobalHooks();}_addGlobalHooks(){let e=["beforeRoute","afterRoute","beforeRender","afterRender"];for(let t of e){let r=this.router.options[t];r&&(Array.isArray(r)?this.hooks[t].push(...r):typeof r=="function"&&this.hooks[t].push(r));}}add(e,t){this.hooks[e].push(t);}remove(e,t){let r=this.hooks[e].indexOf(t);r>-1&&this.hooks[e].splice(r,1);}clear(e){e?this.hooks[e]=[]:Object.keys(this.hooks).forEach(t=>{this.hooks[t]=[];});}async runBeforeRoute(e){return this._runHooks("beforeRoute",e)}async runAfterRoute(e){return this._runHooks("afterRoute",e,{mode:"parallel"})}async runBeforeRender(e){return this._runHooks("beforeRender",e)}async runAfterRender(e){return this._runHooks("afterRender",e,{mode:"parallel"})}async runRouteError(e){return this._runHooks("routeError",e,{mode:"parallel"})}async _runHooks(e,t,r){let{mode:a,ignoreErrors:n}=Object.assign({mode:"serial",ignoreErrors:true},r),{to:i}=t,s=[...this.hooks[e],...i.flatMap(l=>l.route?.[e]||[])];if(a==="serial")for(let l of s)try{let u=await this._runHook.apply(this.router,[l,t]);if(u===!1)return !1;if(typeof u=="string")return u}catch(u){if(n)continue;throw this.router.logger.error(`Error executing hook: ${u.message}`),u}else return await Promise.allSettled(s.map(l=>this._runHook.apply(this.router,[l,t])));return  true}_runHook(e,t){return new Promise((r,a)=>{let n=this.options.timeout>0?setTimeout(()=>{a(new Error(`Hook timeout after ${this.options.timeout}ms`));},this.options.timeout):0;Promise.resolve(e.apply(this.router,[t])).then(i=>{clearTimeout(n),r(i);}).catch(i=>{clearTimeout(n),a(i);});})}};var Pt=class{};var Lt=class{};var It=class{};var Pr=new Set(["STYLE","SCRIPT","TITLE","TEXTAREA"]),Nt=class Nt{async _loadSignal(e){if(!e)return;let t=typeof e=="function"?e:e.signal,r={};try{let a=await t();r.value=a&&typeof a=="object"&&"value"in a?a.value:a,r.hash=t.meta.hash;}catch(a){r.error=new U(a.message,a.status||500);}return r}async _loadView(e){let t=e.route;return await this._loadSignal(t._getView)}async _loadData(e){let t=e.route;return await this._loadSignal(t._getData)}_routeReject(e,t,r,a,n,i){if(this.hooks.runRouteError({error:e,to:i}),!t||!r)return;let s=this._getErrorPage(e,i),l={...a,html:s.outerHTML,ready:true};n?this._mountView(t,r,l):this._mountEphemeral(t,l);}_getCommonRouteIndex(e,t){let r=0;if(e&&e.length>0)for(let a=0;a<Math.min(e.length,t.length)&&e[a].url===t[a].url;a++)r=a+1;return this.logger.debug("{} -> \u516C\u5171\u8DEF\u7531\u5C42\u6570: {}",t[0].id,r),r}_injectRouteData(e,t,r){if(!t||typeof t!="object")return e;let a={...t,$params:r.params||{},$query:r.query||{},$state:r.state||{}},i=`<script type="autospark/data">${JSON.stringify(a).replace(/</g,"\\u003c")}</script>`,s=document.createElement("template");s.innerHTML=e;let l=false;for(let u of Array.from(s.content.children))Pr.has(u.tagName)||(u.insertAdjacentHTML("beforeend",i),l=true);return l?s.innerHTML:(this.logger.debug("{} -> \u89C6\u56FE\u65E0\u53EF\u6CE8\u5165\u5143\u7D20\u6839\uFF0C\u8DEF\u7531\u6570\u636E\u672A\u6CE8\u5165",r.id),e)}_getOutletComponent(e){let t=this.engine?.getComponent(e);return t||(this.logger.error("{} -> outlet \u5BBF\u4E3B\u672A\u5173\u8054\u7EC4\u4EF6\u5B9E\u4F8B\uFF0C\u65E0\u6CD5\u6E32\u67D3\u89C6\u56FE",e.tagName),null)}_getRootOutlet(){return Z(this.host)[0]??null}_resolveKeepAlive(e,t){return t?.data.mode==="tabs"?true:typeof e.keepAlive=="boolean"?e.keepAlive:t?.data.keepAlive===true}_outletData(e,t){this.engine?.data(e,t);}_mountView(e,t,r){let a=t.data.views,n=a.find(s=>s.hash===r.hash);if(n&&n.ready){this._outletData(e,{active:r.hash});return}let i=n?a.map(s=>s.hash===r.hash?{...s,html:r.html||"",ready:!!r.ready}:s):[...a,{hash:r.hash,url:r.url,title:r.title,html:r.html||"",ready:!!r.ready}];this._outletData(e,{views:i,active:r.hash});}_mountEphemeral(e,t){this._outletData(e,{ephemeral:{hash:t.hash,html:t.html||"",ready:!!t.ready},active:t.hash});}_findNestedOutlet(e,t){let r=e.querySelector(`[data-view-hash="${t}"]`);return r instanceof HTMLElement?Z(r)[0]??null:null}async _awaitNestedOutlet(e,t,r){for(let a=0;a<=Nt.NESTED_OUTLET_MICROTASK_RETRIES;a++){if(e.aborted)return null;let n=this._findNestedOutlet(t,r);if(n)return n;await Promise.resolve();}return null}_isOutletActive(e,t){return this.engine?.getComponent(e)?.data.active===t}_closestOutlet(e,t){let r=e.parentElement;for(;r&&r!==t;){if(r instanceof HTMLElement&&r.hasAttribute("data-autospark-outlet"))return r;r=r.parentElement;}return null}async _renderRoutes(e,t,r){let a,n=null;try{let i=this._getRootOutlet();if(!i){this.logger.error("\u5BBF\u4E3B\u5185\u672A\u627E\u5230 autospark.outlet \u51FA\u53E3\uFF0C\u8DF3\u8FC7\u6E32\u67D3\uFF08\u6CE8\u5165\u6A21\u5F0F\u987B\u5728\u6A21\u677F\u4E2D\u58F0\u660E\u51FA\u53E3\u5143\u7D20\uFF09"),this.emit("render:after",{route:e,error:a,slot:null});return}this.emit("render:before",{route:e});let s=this._getCommonRouteIndex(t,e),l="",u=i,c=!1;for(let d=0;d<e.length;d++){if(r.aborted)return;let y=e[d],v=y.route;if(v){if(d===0)u=i;else if(c){let E=await this._awaitNestedOutlet(r,u,l);if(r.aborted)return;E?u=E:this.logger.warn("{} -> \u5C42 {} \u672A\u627E\u5230\u5D4C\u5957\u51FA\u53E3\uFF0C\u56DE\u9000\u6CBF\u7528\u4E0A\u4E00\u5C42\u51FA\u53E3\uFF08\u8DEF\u5F84\u94FE {}\uFF09",e[0].id,d,e.map(w=>w.route?.path??"?").join(" > "));}let h=y.hash;l=h;let R=!!y.route?.view;if(c=R,d<s&&(!R||this._isOutletActive(u,h)))continue;let k=R?this._getOutletComponent(u):null,g=this._resolveKeepAlive(v,k),S={hash:h,url:y.url,title:v.title||h};R&&(this._lastViewSlot=u,n=u);try{if(r.aborted){this.logger.debug("\u6570\u636E\u52A0\u8F7D\u524D\u88AB\u4E2D\u6B62");return}let E=await this._loadData(y);if(r.aborted){this.logger.debug("\u89C6\u56FE\u52A0\u8F7D\u524D\u88AB\u4E2D\u6B62");return}let w=await this._loadView(y),x=k?.data.views.find(m=>m.hash===h&&m.ready)??null,_=!!(g&&x);if(!_&&k&&w){let m={...S,html:"",ready:!1};g?this._mountView(u,k,m):this._mountEphemeral(u,m);}if(k&&this._outletData(u,{active:h}),w)if(w.error){this._routeReject(w.error,u,k,S,g,e);break}else {if(await this._runBeforeRender(t||[],e,u,E?.value),k)if(_)this._outletData(u,{active:h});else {let m=this._injectRouteData(w.value,E?.value,y),p={...S,html:m,ready:!0};g?this._mountView(u,k,p):this._mountEphemeral(u,p);}this._runAfterRender(t||[],e,u);}}catch(E){this.logger.error("\u89C6\u56FE\u6216\u6570\u636E\u52A0\u8F7D\u5931\u8D25",E),k&&this._routeReject(E,u,k,S,g,e);break}}}if(t&&t.length>e.length&&!r.aborted){let d=u;for(let y=e.length;y<t.length&&!r.aborted;y++){let v=t[y];if(!v.route?.view)break;let h=d.querySelector(`[data-view-hash="${v.hash}"]`);if(!(h instanceof HTMLElement))break;let R=this._closestOutlet(h,d);if(!R)break;this._outletData(R,{active:""}),d=R;}}}catch(i){this.logger.error(`\u6E32\u67D3\u5931\u8D25: ${i.message}`,i),a=i;}finally{this.emit("render:after",{route:e,error:a,slot:n});}}async _runBeforeRender(e,t,r,a){try{await this.hooks.runBeforeRender({from:e,to:t,view:r,data:a});}catch(n){this.logger.error("\u6E32\u67D3\u6D41\u7A0B: beforeRender \u94A9\u5B50\u6267\u884C\u5931\u8D25",n);}}_runAfterRender(e,t,r){this.hooks.runAfterRender({from:e,to:t,el:r}).catch(a=>{this.logger.error("\u6E32\u67D3\u6D41\u7A0B: afterRender \u94A9\u5B50\u6267\u884C\u5931\u8D25",a);});}_getErrorPage(e,t){let r=String(e.status||500),a=this.options.errorPages,n=a[r]||a["*"];try{return typeof n=="function"?n(e,t):n}catch(i){this.logger.error("\u9519\u8BEF\u5904\u7406\u5668\u6267\u884C\u5931\u8D25",i);let s=a["*"];return typeof s=="function"?s(i,t):s}}_findOutlet(e){return Z(e)[0]||null}_ensureDefaultOutlet(){Z(this.host).length>0||this.logger.warn("\u5BBF\u4E3B\u5185\u672A\u627E\u5230 autospark.outlet \u51FA\u53E3\uFF1A\u6CE8\u5165 engine \u6A21\u5F0F\u4E0B\u8BF7\u5728\u6A21\u677F\u4E2D\u58F0\u660E <div x-component:autospark.outlet>\uFF08x-outlet \u7B80\u5199\u4EC5\u5BF9\u81EA\u5EFA\u6A21\u5F0F\u4E0E\u8FDC\u7A0B\u6A21\u677F\u751F\u6548\uFF09");}};Nt.NESTED_OUTLET_MICROTASK_RETRIES=20;var Ht=Nt;var Dt=class{async openModal(e){let t=this.modalState,r=this.maxModals,a=this._resolveModalRoute(e);if(!a)throw new Error("Invalid modal route");let n=this._getModalConfig(a);if(!n)throw new Error("Route is not configured as modal");if(t.stack.length>=r){console.warn("Maximum modal stack depth reached");return}let i=await this._createModalElement(a),s;n.backdrop!==false&&(s=this._createBackdrop(n));let l={route:a,element:i,backdrop:s,timestamp:Date.now()};t.stack.push(l),t.current=l,await this._renderModal(l),this.emit("modal/open",{route:a,stackItem:l}),n.autoClose&&n.autoClose>0&&setTimeout(()=>{t.current===l&&this._closeTopModal();},n.autoClose),this._updateModalURL(a);}async closeModal(e){let t=this.modalState;if(e){let r;if(typeof e=="string"?r=this.routes.match(e)?.route||null:r=e,!r)return;let a=t.stack.findIndex(n=>n.route===r);if(a!==-1)for(;t.stack.length>a;)await this._closeTopModal();}else await this._closeTopModal();}async closeAllModals(){for(;this.modalState.stack.length>0;)await this._closeTopModal();}get hasOpenModals(){return this.modalState.stack.length>0}get modalCount(){return this.modalState.stack.length}get currentModal(){return this.modalState.current}_initModals(){this._createModalContainer(),this._setupModalEventListeners(),this._injectModalStyles();}injectModalStyles(){if(document.querySelector("#autospark-modal-styles"))return;let e=document.createElement("style");e.id="autospark-modal-styles",e.textContent=`
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
        `,document.head.appendChild(e);}_createModalContainer(){let e=this.host.querySelector(".autospark-modals");return e||(e=document.createElement("div"),e.className="autospark-modals",this.host.appendChild(e)),this.modalContainer=e,e}_setupModalEventListeners(){document.addEventListener("keydown",e=>{let t=this.modalState;e.key==="Escape"&&t.current&&this._getModalConfig(t.current.route)?.closeOnEsc!==false&&this._closeTopModal();});}_getModalConfig(e){return typeof e.modal=="boolean"?e.modal?{}:null:e.modal||null}_injectModalStyles(){if(document.querySelector("#autospark-modal-styles"))return;let e=document.createElement("style");e.id="autospark-modal-styles",e.textContent=`
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
        `,document.head.appendChild(e);}_closeTopModal(){let e=this.modalState;if(e.stack.length===0)return Promise.resolve();let t=e.stack.pop();return t?(t.element.classList.add("closing"),t.backdrop&&t.backdrop.classList.add("closing"),new Promise(r=>{setTimeout(()=>{t.element.remove(),t.backdrop?.remove(),e.current=e.stack[e.stack.length-1]||null,this.emit("modal/close",{route:t.route,stackItem:t}),this._restoreModalURL(),r();},200);})):Promise.resolve()}_createModalElement(e){let t=document.createElement("div");if(t.className="autospark-modal-content",e.view){if(typeof e.view=="string")return this.viewLoader.loadView(e.view,e.remoteOptions).then(async a=>(a.success&&a.content&&await this.renderToOutlet(a,t,{mode:"replace"}),t));{let r=e.view;if(r.tagName==="TEMPLATE"){let n=r.content.cloneNode(true);t.appendChild(n);}else t.appendChild(r);}}return Promise.resolve(t)}createModalContainer(){let e=this.host.querySelector(".autospark-modals");return e||(e=document.createElement("div"),e.className="autospark-modals",this.host.appendChild(e)),this.modalContainer=e,e}setupModalEventListeners(){document.addEventListener("keydown",e=>{e.key==="Escape"&&this.modalState.current&&this.getModalConfig(this.modalState.current.route)?.closeOnEsc!==false&&this.closeTopModal();});}getModalConfig(e){return typeof e.modal=="boolean"?e.modal?{}:null:e.modal||null}async closeTopModal(){if(this.modalState.stack.length===0)return;let e=this.modalState.stack.pop();e&&(e.element.remove(),e.backdrop?.remove(),this.modalState.current=this.modalState.stack[this.modalState.stack.length-1]||null,this.emit("modal-close",{route:e.route,stackItem:e}),this._restoreModalURL());}_createBackdrop(e){if(e.backdrop===false)return;let t=document.createElement("div");return t.className="autospark-modal-backdrop",e.closeOnBackdropClick!==false&&t.addEventListener("click",()=>{this._closeTopModal();}),t}_renderModal(e){let t=this.modalContainer,r=this._getModalConfig(e.route);return e.backdrop&&t.appendChild(e.backdrop),this._applyModalStyles(e.element,r),t.appendChild(e.element),Promise.resolve()}_applyModalStyles(e,t){if(!t)return;let r=t.type||"dialog",a=t.position||"center",n=t.offset||[0,0];e.classList.add(`autospark-modal-${r}`),e.classList.add(`autospark-modal-${a}`),this._applyPositionStyles(e,r,a,n);}_applyPositionStyles(e,t,r,a){let n=e.style;if(n.position="fixed",n.zIndex="10000",t==="dialog"?(n.maxWidth="600px",n.maxHeight="80vh",n.overflow="auto"):t==="drawer"&&(r==="left"||r==="right"?(n.width="300px",n.maxHeight="100vh",n.overflow="auto"):(n.maxHeight="100vh",n.overflow="auto")),t!=="drawer")switch(r){case "center":n.top="50%",n.left="50%",n.transform=`translate(calc(-50% + ${a[0]}px), calc(-50% + ${a[1]}px))`;break;case "top":n.top=`${a[1]}px`,n.left="50%",n.transform=`translateX(calc(-50% + ${a[0]}px))`;break;case "top-left":n.top=`${a[1]}px`,n.left=`${a[0]}px`;break;case "top-right":n.top=`${a[1]}px`,n.right=`${a[0]}px`;break;case "right":n.top="50%",n.right=`${a[0]}px`,n.transform=`translateY(calc(-50% + ${a[1]}px))`;break;case "bottom-right":n.bottom=`${a[1]}px`,n.right=`${a[0]}px`;break;case "bottom":n.bottom=`${a[1]}px`,n.left="50%",n.transform=`translateX(calc(-50% + ${a[0]}px))`;break;case "bottom-left":n.bottom=`${a[1]}px`,n.left=`${a[0]}px`;break;case "left":n.top="50%",n.left=`${a[0]}px`,n.transform=`translateY(calc(-50% + ${a[1]}px))`;break}}_resolveModalRoute(e){return e.route?typeof e.route=="string"?this.routes.match(e.route)?.route||null:e.route:null}_updateModalURL(e){}_restoreModalURL(){}};var jt=class{};var Lr="routes.json",Ir=10,$t=class{constructor(e){this.root=_t();this._pendingCount=0;this._responseCache=new Map;this.router=e;}async load(){let e=this.router.options.routes||[],r=await(async a=>(typeof a=="function"?a=await a():typeof a=="string"&&(a=await fetch(a).then(n=>n.json())),Array.isArray(a)?a:[a]))(e);this.root=_t(r),this._markPending(this.root,"/"),this._applyRouteOptions(this.root),this.router.emit("routes:loaded",void 0),this._expansion=this._expandAll();}hasPending(){return this._pendingCount>0}async whenExpanded(e){let t=this._expansion?.catch(()=>{});if(t){if(!e||e<=0){await t;return}await Promise.race([t,new Promise(r=>setTimeout(r,e))]);}}match(e){return B(e,this.root)||null}_markPending(e,t){let r=e.path&&e.path!=="/"?M(t,e.path):t;(typeof e.children=="string"||e.children===true)&&(e._childrenSource=e.children,e.children=[],e._childrenState="pending",this._pendingCount++),Array.isArray(e.children)&&e.children.forEach(a=>this._markPending(a,r));}_collectPending(e,t,r=[]){let a=e.path&&e.path!=="/"?M(t,e.path):t;return e._childrenState==="pending"&&r.push({item:e,path:a}),Array.isArray(e.children)&&e.children.forEach(n=>this._collectPending(n,a,r)),r}async _expandAll(){let e=this.router.options.maxChildrenDepth??Ir,t=this._collectPending(this.root,"/"),r=0;for(;t.length>0&&r<e;){r++;let a=[];await Promise.all(t.map(async n=>{let i=await this._expandNode(n);a.push(...i);})),t=a;}if(t.length>0){let a=new Error(`[AutoSparkRouter] \u8FDC\u7A0B\u5B50\u8868\u5C55\u5F00\u8D85\u51FA\u6700\u5927\u6DF1\u5EA6 ${e}\uFF0C\u6B8B\u4F59 ${t.length} \u4E2A\u8282\u70B9\u5DF2\u964D\u7EA7`);t.forEach(n=>{this.router.logger.warn(a.message),this._degrade(n.item,a);});}this.router.emit("routes:expanded",void 0);}async _expandNode(e){let{item:t,path:r}=e,a=Ce(t._childrenSource,{path:r,name:t.name,meta:t.meta,routesFile:this.router.options.routesFile??Lr},this.router.options.base);try{let n=await this._fetchChildren(a,t),i=this._toRouteItems(n,a),s=_t(i),l=Array.isArray(s.children)?s.children:[];l.forEach(c=>this._applyRouteOptions(c)),t.children=l,this._settle(t,"ok");let u=[];return l.forEach(c=>{this._markPending(c,r),this._collectPending(c,r,u);}),u}catch(n){return this._degrade(t,n instanceof Error?n:new Error(String(n)),a),[]}}_fetchChildren(e,t){let r=this._responseCache.get(e);if(r)return r;let a=t.timeout??this.router.options.routeOptions?.timeout??0,n=new AbortController,i=a>0?setTimeout(()=>n.abort(new Error(`Timeout when load ${e}`)),a):null,s=fetch(e,{signal:n.signal}).then(async l=>{if(!l.ok)throw new Error(`Fail when load ${e} : ${l.statusText}`);return await l.json()}).finally(()=>{i&&clearTimeout(i);});return this._responseCache.set(e,s),s}_toRouteItems(e,t){if(Array.isArray(e))return e;if(e&&typeof e=="object")return [e];throw new Error(`[AutoSparkRouter] \u8FDC\u7A0B\u5B50\u8868 ${t} \u8FD4\u56DE\u7684\u4E0D\u662F\u8DEF\u7531\u9879\u58F0\u660E`)}_settle(e,t){e._childrenState==="pending"&&this._pendingCount--,e._childrenState=t;}_degrade(e,t,r){e.children=[],this._settle(e,"error"),this.router.emit("routes:error",{url:r,path:e.path,error:t});}_applyRouteOptions(e){let t=["keepAlive","cache","timeout","preload"],r=a=>{if(a.name&&a.name.length>0&&(this.namedRouteItems||(this.namedRouteItems=new Map),this.namedRouteItems.set(a.name,new WeakRef(a))),this.router.options.routeOptions){let n=this.router.options.routeOptions;t.forEach(i=>{a[i]===void 0&&n[i]!==void 0&&(a[i]=n[i]);});}Array.isArray(a.children)&&a.children.forEach(r);};r(e);}forEach(e){function t(r,a){e(r,a),Array.isArray(r.children)&&r.children.forEach(n=>t(n,r));}t(this.root,null);}};var Ft=class extends pt{};function ue(o){if(typeof o!="object"||o===null)return  false;var e=Object.getPrototypeOf(o);if(e===null)return  true;for(var t=e;Object.getPrototypeOf(t)!==null;)t=Object.getPrototypeOf(t);return e===t}var Vt=class{constructor(e,t,r){this.cache=new Map;this.router=e,this.loadType=t,this.options=Object.assign({timeout:0,cache:0,hash:"{url}",datatype:"json"},r),this._signalKey=`_get${t.charAt(0).toUpperCase()+t.slice(1)}`,this._optionsKey=`_${t}Options`,this._optionKey=t;}getSignal(e){return e.route[this._signalKey]}createSignal(e,t){let r=this.getSignal(e);r&&r.abort();let a=N();return e.route[this._signalKey]=a,a.meta.hash=this._getHash(e,t),a}_removeSignal(e){e.route&&delete e.route[this._signalKey];}getRouteOptions(e){return e.route[this._optionsKey]||(e.route[this._optionsKey]=this._mergeRouteOptions(e)),e.route[this._optionsKey]}isOptionsObject(e){return typeof e=="object"&&e!==null&&"from"in e}loadRoutes(e,t,r=0){return Promise.allSettled(e.map((a,n)=>{if(!(n<r&&this.loadStateOf(a)==="ok"))return this.loadRoute(a,t)}))}get loadStateKey(){return `_${this._optionKey}LoadState`}loadStateOf(e){if(e.route)return e.route[this.loadStateKey]}setLoadState(e,t){e.route&&(e.route[this.loadStateKey]=t);}_createErrorSignal(e,t,r){let a=this.createSignal(e,r);this.onLoadError(e,t,a,r);}_createSuccessSignal(e,t,r){let a=this.createSignal(e,r);this.onLoadSuccess(e,t,a,r);}async loadRoute(e,t){if(!e.route?.[this._optionKey])return;let r=this.getRouteOptions(e),a;try{if(this.hitCache(e,r))return;if(this.isValidData(r.from)&&!J(r.from)){this._createSuccessSignal(e,r.from,r);return}if(t?.aborted)return;a=this.createSignal(e,r);let n,i;if(J(r.from))i=r.from,a.meta.url=i,n=this._loadFromRemote(i,a,e,r,t);else if(r.from===!0)if(i=this.getAutoUrl(e),i)a.meta.url=i,n=this._loadFromRemote(i,a,e,r,t);else {this._removeSignal(e);return}else at(r.from)&&(n=r.from(e));if(n==null){this._removeSignal(e);return}Promise.resolve(n).then(s=>this.onLoadSuccess(e,s,a,r)).catch(s=>this.onLoadError(e,s,a,r));}catch(n){n.name!=="AbortError"&&this._createErrorSignal(e,n,r);}}_isCacheExpired(e,t){if(!e)return  true;let r=t.cache||0;return r<=0?true:Date.now()-e.timestamp>r}hitCache(e,t){let r=this._getHash(e,t),a=this.cache.get(r);return (t.cache||0)>0&&a&&!this._isCacheExpired(a,t)?(this._createSuccessSignal(e,a.value,t),true):((t.cache||0)>0&&this.cache.has(r)&&this.cache.delete(r),false)}_getHash(e,t){return t.hash?D(t.hash,e):D("{url}",e)}getAutoUrl(e){}isValidData(e){return  true}_loadFromRemote(e,t,r,a,n){let i=z(e.params(q(r)),this.router.options.base),{timeout:s=0}=a,l=new AbortController,u=t.getAbortSignal(),c=null,d=()=>{c&&(clearTimeout(c),c=null),u&&u.removeEventListener("abort",y);},y=()=>{l.abort();};u&&u.addEventListener("abort",y),s>0&&(c=setTimeout(()=>{l.isTimeout=true,l.abort();},s));let v=[l.signal];u&&v.push(u),n&&v.push(n);let h=typeof AbortSignal.any=="function"?AbortSignal.any(v):v[0];try{return fetch(i,{signal:h}).then(async R=>{if(!R.ok)throw new I(`Fail when load ${i} : ${R.statusText}`,R.status);return await this.onResponse(R,r,{signal:h,hash:t.meta.hash})}).catch(R=>{throw R instanceof DOMException&&R.name==="AbortError"&&l.isTimeout?new St:R}).finally(()=>{d();})}catch(R){return d(),Promise.reject(R)}}isCacheEnable(e){return (e.cache||0)>0}onLoadSuccess(e,t,r,a){try{if(this.isCacheEnable(a)){let n=this._getHash(e,a);this.cache.set(n,{value:t,timestamp:Date.now()});}t.error&&t.error instanceof Error?(this.setLoadState(e,"error"),r.reject(new I(t.error.message))):(this.setLoadState(e,"ok"),r.resolve(t));}catch(n){this.setLoadState(e,"error"),r.reject(n);}}onLoadError(e,t,r,a){if(t.name==="AbortError")r.resolve(void 0);else {this.setLoadState(e,"error"),r.meta.statusCode=t.status||500;let n=this._getHash(e,a);this.cache.delete(n),r.reject(t);}}_mergeRouteOptions(e){let t=e.route[this._optionKey]||{},r=ue(t)&&"from"in t;return {...this.options,...r?t:{from:t}}}cleanup(){this.cache.clear();}};var qt=class{constructor(e){this.router=e;}test(e,t){return  true}render(e,t,r){return Promise.resolve({value:"",hash:r.hash})}};var Ut="x-outlet",ce="x-component:autospark.outlet";function it(o){o.querySelectorAll(`[${Ut}]`).forEach(t=>{let r=t.getAttribute(Ut);t.removeAttribute(Ut),t.hasAttribute(ce)||t.setAttribute(ce,r??"");});}var Y=class extends qt{test(e,t){return  true}async render(e,t,r){let a=await e.text(),{selector:n}=r,i={value:a.trim()};try{let s=new DOMParser().parseFromString(a,"text/html");if(it(s),i.value=s.body.innerHTML.trim(),typeof n=="string"&&n.length>0)try{let l=s.querySelector(n.params({...t.params,...t.query,...t.state}));l&&(i.value=l.innerHTML);}catch(l){this.router.logger.warn(`Invalid selector: ${n}, ${l.message}`);}}catch(s){this.router.logger.error(`\u89C6\u56FE\u5185\u5BB9\u63D0\u53D6\u5931\u8D25: ${s.message}`);}return i}};var Bt=class extends Vt{constructor(t){super(t,"view",Object.assign({},t.options.viewOptions));this.renderers=[];this._initRenderers(),this.renderers=t.options.renderers,this.defaultRenderer=this.renderers.find(r=>r instanceof Y);}_initRenderers(){this.router.renderers.findIndex(r=>r&&r instanceof Y)===-1&&this.router.renderers.push(new Y(this.router));}async loadViews(t,r,a=0){return this.loadRoutes(t,r,a)}selectRenderer(t,r){try{for(let a of this.router.renderers)if(a.test(t,r))return a;return this.defaultRenderer}catch{return this.defaultRenderer}}async onResponse(t,r,a){let i=await(r.route?._viewOptions?.renderer||this.selectRenderer(t,r)).render(t,r,a);return i.error?{error:i.error}:{value:i.value}}};function We(){let o=window.location.pathname;if(o.endsWith(".html")||o.endsWith(".htm")){let e=o.lastIndexOf("/");return e===0?"/":o.substring(0,e+1)}return o.endsWith("/")?o:o.length>0&&o!=="/"?o+"/":"/"}function Ke(){if(typeof document>"u"||!document.querySelector("base"))return null;try{let o=new URL(document.baseURI).pathname;return !o||o==="/"?"/":o.endsWith("/")?o:o+"/"}catch{return null}}function Xe(o=10){let e=Math.random().toString(36).substring(2,o+2);return /^\d/.test(e)?e:"s"+e.substring(1)}function Je(o,e){if(typeof document>"u")return;let{id:t,mode:r="default",location:a="head"}=e||{},n=t||Xe(),i=document.querySelector(`#${n}`);return !i||i.tagName!=="STYLE"?(i=document.createElement("style"),i.id=n,i.textContent=o,(a==="head"?document.head:a==="body"?document.body:a instanceof HTMLElement?a:document.head).appendChild(i),i):(r==="replace"?i.textContent=o:r==="append"&&(i.textContent+=o),i)}var G="autospark.outlet",Hr="autospark-outlet-styles",Nr=`.autospark-outlet-tabs{display:flex;flex-wrap:wrap;align-items:flex-end;gap:var(--autospark-outlet-tab-gap,2px);padding:var(--autospark-outlet-tabs-padding,0 8px);border-bottom:1px solid var(--autospark-outlet-tab-border-color,#e5e6eb);background:var(--autospark-outlet-tabs-bg,transparent)}
.autospark-outlet-tab{display:inline-flex;align-items:center;gap:6px;padding:var(--autospark-outlet-tab-padding,6px 12px);font-size:var(--autospark-outlet-tab-font-size,13px);line-height:1.4;color:var(--autospark-outlet-tab-color,#4e5969);background:var(--autospark-outlet-tab-bg,transparent);border:1px solid transparent;border-bottom:none;border-radius:var(--autospark-outlet-tab-radius,6px 6px 0 0);cursor:pointer;user-select:none;position:relative;top:1px}
.autospark-outlet-tab:hover{color:var(--autospark-outlet-tab-hover-color,#1d2129);background:var(--autospark-outlet-tab-hover-bg,rgba(0,0,0,.04))}
.autospark-outlet-tab.is-active{color:var(--autospark-outlet-tab-active-color,#165dff);background:var(--autospark-outlet-tab-active-bg,#fff);border-color:var(--autospark-outlet-tab-border-color,#e5e6eb)}
.autospark-outlet-tab-close{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;font-size:12px;line-height:1;color:var(--autospark-outlet-tab-close-color,#86909c);cursor:pointer}
.autospark-outlet-tab-close:hover{color:var(--autospark-outlet-tab-close-hover-color,#1d2129);background:var(--autospark-outlet-tab-close-hover-bg,rgba(0,0,0,.08))}`,zt=`<div x-define="${G}" class="autospark-outlet" data-autospark-outlet :data-mode="mode">
    <script setup>
    {
        data: function () {
            return {
                views: [],
                ephemeral: { hash: "", html: "", ready: false },
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
            <autospark-loading x-show="!view.ready"></autospark-loading>
            <div class="autospark-outlet-view-content" x-html.compile="view.html"></div>
        </div>
    </div>
    <div class="autospark-outlet-ephemeral" x-show="ephemeral.hash !== '' && active === ephemeral.hash" :data-view-hash="ephemeral.hash">
        <autospark-loading x-show="!ephemeral.ready"></autospark-loading>
        <div class="autospark-outlet-view-content" x-html.compile="ephemeral.html"></div>
    </div>
</div>`;function Wt(o){Je(Nr,{id:Hr}),!o.getComponentDeclaration(G)&&o.registerComponent(zt,{name:G});}function Dr(o){if(o.querySelector("[x-outlet], [x-component\\:autospark\\.outlet], [data-autospark-outlet]"))return;let e=document.createElement("div");e.setAttribute("x-outlet",""),o.appendChild(e);}function Ye(o){let e=o.options.engine;if(e)return Wt(e),{engine:e,owned:false};let r=globalThis.AutoSparkSpaces?.AutoSpark;if(typeof r!="function")throw new Error("[AutoSparkRouter] \u672A\u627E\u5230 window.AutoSparkSpaces.AutoSpark\uFF1A\u8BF7\u5148\u52A0\u8F7D AutoSpark.js \u518D\u52A0\u8F7D @autospark/router\uFF0C\u6216\u7ECF options.engine \u6CE8\u5165\u5B9E\u4F8B");Dr(o.host),it(o.host);let a=new r(o.host,o.options.data??{},{components:{[G]:zt}});return Wt(a),{engine:a,owned:true}}function jr(o){let e=[],t=0,r=/\{\}/g,a;for(;(a=r.exec(o))!==null;)a.index>t&&e.push(o.slice(t,a.index)),e.push({placeholder:true}),t=a.index+a[0].length;return t<o.length&&e.push(o.slice(t)),e}function Ge(o){function e(t,r){return (a,...n)=>{if(!o.debug&&["debug","info"].includes(t))return;if(a instanceof Error){r(`[${t.toUpperCase()}] ${a.message}`,...n);return}let i=[];for(let c of n)if(typeof c=="function"){let d=c();Array.isArray(d)?i.push(...d):i.push(d);}else i.push(c);let s=jr(a),l=[`[${t.toUpperCase()}]`],u=0;for(let c of s)if(typeof c=="object"&&c.placeholder){if(u<i.length){let d=i[u++];if(d==null||d==="")continue;l.push(d);}}else c&&l.push(c);for(;u<i.length;)l.push(i[u++]);r(...l);}}return {debug:e("debug",console.debug),info:e("info",console.info),warn:e("warn",console.warn),error:e("error",console.error)}}function pe(o,e){if(!e)return o;if(!o)return "";let t=e.endsWith("/")?e.slice(0,-1):e,r=o.startsWith("/")?o:`/${o}`;if(r===t)return "/";if(r.startsWith(t+"/")){let a=r.slice(t.length);return a.startsWith("/")?a:`/${a}`}return r}var Ze=(o,e)=>{let t=document.createElement("autospark-feedback");return t.type="error",t.message="404",t.description="\u9875\u9762\u672A\u627E\u5230\uFF0C\u8BF7\u68C0\u67E5 URL \u662F\u5426\u6B63\u786E",t.backable=true,t};var Qe=(o,e)=>{let t=document.createElement("autospark-feedback");return t.type="error",t.message="500",t.description=o?.message||"\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF",t.retryable=true,t.backable=true,t};var tr=(o,e)=>{let t=o?.status||o?.statusCode||500,r=o?.message||"\u672A\u77E5\u9519\u8BEF",a=document.createElement("autospark-feedback");return a.type="error",a.message=String(t),a.description=r,a.retryable=true,a.backable=true,a};var er={404:Ze,500:Qe,"*":tr};var Kt=class extends Fe(Mt,Pt,Lt,Dt,It,Ht,jt,Ft){constructor(t,r=[]){super();this._cleanups=[];this.isNavigating=false;this.attached=false;this.currentNavVersion=0;this.abortController=new AbortController;this._navAbortController=null;this._lastViewSlot=null;this._lastMatched=null;this.modalContainer=null;this.modalState={stack:[],current:null};this.maxModals=10;if(this.host=typeof t=="string"?document.querySelector(t):t,!(this.host instanceof HTMLElement))throw new Error("[AutoSparkRouter] Host must be a valid HTMLElement");this.host.setAttribute("data-autospark-router",""),this.host.router=this,this.options=this._initOptions(r),this.attach();}get navSignal(){return this._navAbortController?.signal||new AbortController().signal}get engine(){return this._engineBinding?.engine}get mode(){return this.options.mode}get base(){return this.options.base}get debug(){return this.options.debug}get logger(){return this._logger||(this.options.logger?this._logger=this.options.logger:this._logger=Ge(this.options)),this._logger}get location(){return this.history.location}get lastViewSlot(){return this._lastViewSlot}get lastMatched(){return this._lastMatched}get renderers(){return this.options.renderers}_initOptions(t=[]){return this.options=Object.assign({mode:"history",debug:false,home:"/",keeyAlive:true,data:{},errorPages:{},renderers:[],routeOptions:{},viewOptions:{},routesFile:"routes.json",maxChildrenDepth:10},t&&typeof t=="object"&&"routes"in t?t:{routes:t}),this.options.base===void 0&&(this.options.base=Ke()??We()),this.options.errorPages={...er,...this.options.errorPages},this.options}_matchRoute(t,r,a){let n=this.routes.current,i=t+r,s=B(i,this.routes.root,{});return a&&s.forEach(l=>{l.state=a;}),{fromRoute:n,toRoute:s}}_hasRealMatch(t){return t.slice(1).some(r=>r.route!==void 0)}async _matchRouteAfterExpansion(t,r,a,n){let i=this._matchRoute(t,r,a);return this._hasRealMatch(i.toRoute)||!this.routes.hasPending()?i:(await this.routes.whenExpanded(n??this.options.routeOptions?.timeout),this._matchRoute(t,r,a))}async onRouteUpdate(t){this.isNavigating=true,this.emit("navigation:start",t);let r=t.location.pathname,a=t.location.search;this._lastViewSlot=null;let n=await this._matchRouteAfterExpansion(pe(r,this.options.base),a,t.location.state);this.emit("navigation:matched",n);let i=n.toRoute,s=i.length>0?i[i.length-1].url:"";if(this._currentNavUrl===s){this.logger.debug("\u5FFD\u7565\u91CD\u590D\u5BFC\u822A: {}",s),this.emit("navigation:cancel",t);return}this._currentNavUrl=s,++this.currentNavVersion;let l=this.currentNavVersion;this._navAbortController&&(this.logger.debug("\u4E2D\u6B62\u4E4B\u524D\u7684\u5BFC\u822A\u64CD\u4F5C"),this._navAbortController.abort()),this._navAbortController=new AbortController;let u=this._navAbortController.signal,c;try{if(u.aborted){this.logger.debug("\u5BFC\u822A\u5728\u8DEF\u7531\u5339\u914D\u540E\u88AB\u4E2D\u6B62");return}this.emit("navigation:matched",n),c=n.fromRoute,this.logger.debug("{} -> \u5BFC\u822A\u5230: {} {}, \u5339\u914D: {} ",()=>[i[0].id,r,a,i]);let d=await this.hooks.runBeforeRoute({from:c,to:i});if(u.aborted){this.logger.debug("\u5BFC\u822A\u5728\u5B88\u536B\u6267\u884C\u540E\u88AB\u4E2D\u6B62");return}if(!d){this.logger.debug("beforeEach \u5B88\u536B\u8FD4\u56DE false\uFF0C\u53D6\u6D88\u5BFC\u822A"),this.emit("navigation:cancel",t);return}let y=this._getCommonRouteIndex(c,i);this.dataLoader.loadDatas(i,u,y),this.viewLoader.loadViews(i,u,y),await this._renderRoutes(i,c,u);}finally{l===this.currentNavVersion&&(this.isNavigating=false,this._currentNavUrl=void 0,this._navAbortController&&(this._navAbortController=null)),this.hooks.runAfterRoute({to:i}),this.routes.current=i,this.isNavigating=false,this.emit("navigation:end",t);}}async isStopNavigating(){if(this.isNavigating)return new Promise(t=>{let r=null,a=this.once("navigation:cancel",()=>{r?.(),t();});r=this.once("navigation:end",()=>{a(),t();});})}_ensureAttached(){if(!this.attached)throw new Error("[AutoSparkRouter] Cannot navigate: router is not attached to a host element. Call attach() first.")}handleGuardFailure(t){if(t.length>1){let r=t[t.length-2].route;this.replace(r.path);}else this.replace("/");}push(t,r){if(this._ensureAttached(),this._pendingNavigationType="push",t.startsWith("!")){let a=t.slice(1);this.openModal({route:a});return}r!==void 0?this.history.push(t,r):this.history.push(t);}replace(t,r){this._ensureAttached(),this._pendingNavigationType="replace",r!==void 0?this.history.replace(t,r):this.history.replace(t);}home(){this._ensureAttached();let t=M(this.options.base||"",this.options.home||"/");this.replace(t);}back(){if(this._ensureAttached(),this._pendingNavigationType="pop",this.modalState.stack.length>0){this.closeTopModal();return}this.history.back();}forward(){this._ensureAttached(),this._pendingNavigationType="pop",this.history.forward();}go(t){this._ensureAttached(),this._pendingNavigationType="pop",this.history.go(t);}attach(){if(this.attached)throw new Error("Already attached to a host element");this.history=this.mode==="hash"?bt():xe(),this.routes=new $t(this),this.hooks=new Ct(this),this.routes.load().then(async()=>{this.viewLoader=new Bt(this),this.dataLoader=new Ot(this),this._cleanups.push(this.history.listen(this.onRouteUpdate.bind(this))),this.attachContextProvider(),this._engineBinding=Ye(this),this._ensureDefaultOutlet(),this.attached=true,this.emit("routes:attached",void 0);let t=this.history.location.pathname,r=pe(t,this.options.base),a=t.endsWith(".html")||t.endsWith(".htm");if(r===""||r==="/")this.home();else {let n=await this._matchRouteAfterExpansion(r,this.history.location.search);this._hasRealMatch(n.toRoute)?this.replace(t):a?this.home():this.replace(t);}}).catch(t=>{this.logger.error("\u8DEF\u7531\u8868\u52A0\u8F7D\u5931\u8D25:{}",t);});}detach(){this.attached&&(this._cleanups.forEach(t=>t()),this._cleanups=[],this.viewLoader.cleanup(),this.dataLoader.cleanup(),this._engineBinding?.owned&&this._engineBinding.engine.destroy(),this._engineBinding=void 0,this.abortController.abort(),this.removeContextProvider(),this.host instanceof HTMLElement&&(this.host.removeAttribute("data-autospark-router"),delete this.host.router),this.attached=false);}};function ki(o,e){return new Kt(o,e)}exports.AutoSparkFeedback=ct;exports.AutoSparkLink=lt;exports.AutoSparkLoading=ut;exports.AutoSparkRouter=Kt;exports.AutoSparkRouterElementBase=st;exports.AutoSparkViewMeta=Yt;exports.EventEmitter=pt;exports.OUTLET_COMPONENT_ATTR=ce;exports.OUTLET_COMPONENT_CODE=zt;exports.OUTLET_COMPONENT_NAME=G;exports.X_OUTLET_ATTR=Ut;exports.compilePathPattern=fr;exports.createHashHistoryFromLib=Ao;exports.createLogger=Ge;exports.createRouteMatcher=pr;exports.createRouter=ki;exports.findOutlet=Z;exports.generateRouteHash=ko;exports.isDangerousProtocol=or;exports.isExternalLink=Zt;exports.isInternalLink=rr;exports.joinPath=M;exports.matchRoute=B;exports.normalizeHashPath=wo;exports.normalizeRoutes=_t;exports.params=$;exports.parsePathParams=Bo;exports.prefixBaseUrl=z;exports.registerOutletComponent=Wt;exports.resolveChildrenUrl=Ce;exports.transformXOutlet=it;return exports;})({});//# sourceMappingURL=index.global.js.map
//# sourceMappingURL=index.global.js.map