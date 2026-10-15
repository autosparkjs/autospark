var AutoSparkRouter=(function(exports){'use strict';var F=(o=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(o,{get:(e,t)=>(typeof require<"u"?require:e)[t]}):o)(function(o){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+o+'" is not supported')});function Se(o,e,t){o.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:true,composed:true}));}var pt=class o extends HTMLElement{constructor(){super(...arguments);this._contextRequested=false;this._contextCallback=t=>{this.router=t,this.onRouterReady();};}connectedCallback(){if(!this._contextRequested){let t=this._getRouterSync();t?(this.router=t,this.onRouterReady()):this.getRouter(),this._contextRequested=true;}}disconnectedCallback(){}onRouterReady(){}_getRouterSync(){let t=this,r=[];for(;t;){if(r.push(t instanceof HTMLElement?`${t.tagName.toLowerCase()}${t.id?"#"+t.id:""}${t.className?"."+t.className:""}`:t.tagName),t instanceof HTMLElement&&t.hasAttribute("data-autospark-router")||t instanceof o&&t.router)return t.router;t=t.parentElement;}}getRouter(t=this._contextCallback){if(this.router){t(this.router);return}Se(this,"context-request",{context:"AutoSparkRouter",contextTarget:this,callback:r=>{this.router=r,t(r);}});}};function M(o,e){let t=o.replace(/\/+$/,""),r=e.replace(/^\/+/,"");return t?r?`${t}/${r}`:t||"/":`/${r}`}function j(o,e){if(o.includes("://")||o.startsWith("//"))return o;let t=e||"";return !t||t==="/"?o:o.startsWith("/")?o.startsWith(t)?o:M(t,o):M(t,o)}function Ae(o){return o?o.startsWith("/")&&!o.includes("://"):false}function te(o){let e=o.trim().toLowerCase();return e.startsWith("javascript:")||e.startsWith("data:")}var U=class extends pt{constructor(){super(...arguments);this._to="";this._replace=false;this._target="";this._rel="";this._anchor=null;}get to(){return this._to}set to(t){let r=this._to;this._to=t,r!==t&&this._updateAnchor();}get href(){return this._to}set href(t){this.to=t;}get replace(){return this._replace}set replace(t){this._replace=t;}get target(){return this._target}set target(t){let r=this._target;this._target=t,r!==t&&this._updateAnchor();}get rel(){return this._rel}set rel(t){let r=this._rel;this._rel=t,r!==t&&this._updateAnchor();}connectedCallback(){super.connectedCallback(),this._render();}attributeChangedCallback(t,r,a){if(t==="href"){a!==null&&(this.to=a);return}let n=this._attributeToProperty(t);a!==null&&(this[n]=this._coerceAttributeValue(n,a));}_render(){if(!this._anchor){for(this._anchor=document.createElement("a");this.firstChild;)this._anchor.appendChild(this.firstChild);this.appendChild(this._anchor);}this._updateAnchor();}_updateAnchor(){if(!this._anchor)return;let t=this._anchor,r=this._resolveHref(this._to);r?t.setAttribute("href",r):t.removeAttribute("href"),this._target?t.setAttribute("target",this._target):t.removeAttribute("target");let a=this._getComputedRel();a?t.setAttribute("rel",a):t.removeAttribute("rel");}_resolveHref(t){return t?Ae(t)?j(t,this.router?.options?.base):t:""}_getComputedRel(){return this.rel?this.rel:this.target==="_blank"?"noopener noreferrer":""}handleClick(t){if(t.metaKey||t.ctrlKey||t.shiftKey||t.altKey||t.button===1)return;let r=this.to;if(te(r)){t.preventDefault();return}Ae(r)&&(this.getRouter(()=>{this.router&&(this.replace?this.router.replace(r):this.router.push(r));}),t.preventDefault());}_attributeToProperty(t){return t}_coerceAttributeValue(t,r){return t==="replace"?r!==null&&r!=="false":r}};U.observedAttributes=["to","replace","target","rel","href"];customElements.get("auto-link")||customElements.define("auto-link",U);var we=new CSSStyleSheet;we.replaceSync(`
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
`);var _e=we;var ht=class extends HTMLElement{constructor(){super(...arguments);this._message="Loading...";}get message(){return this._message}set message(t){let r=this._message;this._message=t||"Loading...",r!==this._message&&this._render();}connectedCallback(){this.shadowRoot||this.attachShadow({mode:"open"}),this.shadowRoot&&(this.shadowRoot.adoptedStyleSheets=[_e]),this._render();}attributeChangedCallback(t,r,a){t==="message"&&a!==r&&(this.message=a||"Loading...");}_render(){if(!this.shadowRoot)return;this.shadowRoot.innerHTML="";let t=document.createElement("div");t.className="spinner";let r=document.createElement("div");r.className="message",r.textContent=this._message,this.shadowRoot.appendChild(t),this.shadowRoot.appendChild(r);}};ht.observedAttributes=["message"];customElements.get("autospark-loading")||customElements.define("autospark-loading",ht);function Ee(o){let e=o.length,t=0,r="";for(;t<e;){let a=o[t];if(a==='"'){for(r+='"',t++;t<e&&o[t]!=='"';)o[t]==="\\"&&t+1<e&&(r+=o[t]),r+=o[t],t++;t<e&&(r+='"'),t++;continue}if(a==="'"){for(r+='"',t++;t<e&&o[t]!=="'";){if(o[t]==="\\"&&t+1<e){let n=o[t+1];n==="'"?r+="'":(r+=o[t],r+=n),t+=2;continue}o[t]==='"'?r+='\\"':r+=o[t],t++;}r+='"',t++;continue}if(Me(a)&&!(t>0&&br(o[t-1]))){let n=t;for(;n<e&&kr(o[n]);)n++;let i=o.slice(t,n),s=n;for(;s<e&&xe(o[s]);)s++;if(s<e&&o[s]===":"){r+='"',r+=i,r+='"',t=n;continue}i==="true"||i==="false"||i==="null"?r+=i:r+='"'+i+'"',t=n;continue}if(a===","){let n=t+1;for(;n<e&&xe(o[n]);)n++;if(n<e&&(o[n]==="}"||o[n]==="]")){t++;continue}r+=a,t++;continue}r+=a,t++;}return r}function xe(o){return o===" "||o==="	"||o===`
`||o==="\r"}function Me(o){return o>="a"&&o<="z"||o>="A"&&o<="Z"||o==="_"||o==="$"}function kr(o){return Me(o)||o>="0"&&o<="9"||o==="-"}function br(o){return o>="0"&&o<="9"||o==="."||o==="-"||o==="+"}var Te=new CSSStyleSheet;Te.replaceSync(`
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
`);var Oe=Te;var Ce=o=>JSON.parse(Ee(o)),ee={info:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',warn:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',error:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',success:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>'},re={close:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',retry:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>',back:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>'},ft=class extends HTMLElement{constructor(){super(...arguments);this._closeable=false;this._retryable=false;this._backable=false;this._inline=false;}get message(){return this._message}set message(t){this._message=t,this._render();}get description(){return this._description}set description(t){this._description=t,this._render();}get icon(){return this._icon}set icon(t){this._icon=t,this._render();}get type(){return this._type}set type(t){this._type=t,this._render();}get actions(){return this._actions}set actions(t){this._actions=t,this._render();}get closeable(){return this._closeable}set closeable(t){this._closeable=t,this._render();}get retryable(){return this._retryable}set retryable(t){this._retryable=t,this._render();}get backable(){return this._backable}set backable(t){this._backable=t,this._render();}get inline(){return this._inline}set inline(t){this._inline=t,this._render();}connectedCallback(){this.attachShadow({mode:"open"}),this.shadowRoot&&(this.shadowRoot.adoptedStyleSheets=[Oe]),this._render();}attributeChangedCallback(t,r,a){if(r!==a)switch(t){case "message":this.message=a||void 0;break;case "description":this.description=a||void 0;break;case "icon":this.icon=a||void 0;break;case "type":this.type=a;break;case "actions":this.actions=a||void 0;break;case "closeable":this.closeable=a!==null;break;case "retryable":this.retryable=a!==null;break;case "backable":this.backable=a!==null;break;case "inline":this.inline=a!==null;break}}get _parsedActions(){if(!this._actions)return [];let t;if(typeof this._actions=="string")try{t=Ce(this._actions);}catch{return console.warn("[autospark-feedback] Failed to parse actions:",this._actions),[]}else t=this._actions;return t.map(r=>{if(r.icon&&typeof r.icon=="string")try{let a=Ce(r.icon);return {...r,icon:a}}catch{return r}return r})}get _allActions(){let t=[...this._parsedActions];return this._backable&&t.unshift({name:"back",title:"\u8FD4\u56DE",icon:re.back}),this._retryable&&t.unshift({name:"retry",title:"\u91CD\u8BD5",icon:re.retry,primary:true}),this._closeable&&t.push({name:"close",title:"\u5173\u95ED",icon:re.close}),t}_renderIcon(){let t=document.createElement("div");if(this._icon){if(t.className="icon",this._icon.trim().startsWith("<svg"))return t.innerHTML=this._icon,t;let r=document.createElement("img");return r.className="icon",r.src=this._icon,r.alt="",r}return this._type&&ee[this._type]?(t.className=`icon ${this._type}`,t.innerHTML=ee[this._type],t):(t.className="icon error",t.innerHTML=ee.error,t)}_handleAction(t,r){r.preventDefault(),r.stopPropagation();let a=new CustomEvent("autospark:action",{detail:t,bubbles:true,composed:true});this.dispatchEvent(a);}_renderActionButton(t){let r=document.createElement("button");if(r.className="action-button",t.primary&&r.classList.add("primary"),r.title=t.tips||t.title||t.name,t.icon){let n=document.createElement("span");n.className="action-icon",n.innerHTML=t.icon,r.appendChild(n);}let a=document.createTextNode(t.title||t.name);return r.appendChild(a),r.addEventListener("click",n=>this._handleAction(t,n)),r}_render(){if(!this.shadowRoot)return;let t=document.createElement("div");t.className="container";let r=this._renderIcon();if(r&&t.appendChild(r),this._message){let n=document.createElement("div");n.className="message",n.textContent=this._message,t.appendChild(n);}if(this._description){let n=document.createElement("div");n.className="description",n.textContent=this._description,t.appendChild(n);}let a=this._allActions;if(a.length>0){let n=document.createElement("div");n.className="actions",a.forEach(i=>{n.appendChild(this._renderActionButton(i));}),t.appendChild(n);}this.shadowRoot.innerHTML="",this.shadowRoot.appendChild(t);}};ft.observedAttributes=["message","description","icon","type","actions","closeable","retryable","backable","inline"];customElements.get("autospark-feedback")||customElements.define("autospark-feedback",ft);var oe=class extends HTMLElement{constructor(){super(),this.style.display="none";}get(e){return this.getAttribute(e)}set(e,t){t===null?this.removeAttribute(e):this.setAttribute(e,t);}getAll(){let e={};for(let t of this.attributes)e[t.name]=t.value;return e}has(e){return this.hasAttribute(e)}getJSON(e,t){let r=this.get(e);if(!r)return t;try{return JSON.parse(r)}catch{return t}}getBoolean(e){let t=this.get(e);return t==="true"||t===""}getArray(e,t=","){let r=this.get(e);return r?r.split(t).map(a=>a.trim()).filter(Boolean):[]}toString(){let e=this.getAll();return JSON.stringify(e,null,2)}};customElements.get("autospark-view-meta")||customElements.define("autospark-view-meta",oe);function q(o,...e){let t=o.valueOf(),r={},a=[...e];try{if(a.length===0)return t;if(a.length===1){let n=a[0];if(n==null)return t;Array.isArray(n)?a=n:typeof n=="object"&&(r=n,a=[]);}return t=t.replace(/\{\s*([a-zA-Z\d]*)\s*\}/g,(n,i)=>{let s;return i&&r.hasOwnProperty(i)?s=r[i]:!i&&a.length>0&&(s=a.shift()),s==null?"":(typeof s=="function"&&(s=s()),String(s))}),t}catch{return t}}String.prototype.params=function(){return q(this,...arguments)};function Pe(o){return {all:o=o||new Map,on:function(e,t){var r=o.get(e);r?r.push(t):o.set(e,[t]);},off:function(e,t){var r=o.get(e);r&&(t?r.splice(r.indexOf(t)>>>0,1):o.set(e,[]));},emit:function(e,t){var r=o.get(e);r&&r.slice().map(function(a){a(t);}),(r=o.get("*"))&&r.slice().map(function(a){a(e,t);});}}}var mt=class{constructor(){this._initEmitter();}_initEmitter(){this._emitter=Pe();}on(e,t){this._emitter.on(e,t);let r=this._retainEvents?.get(e);return r!==void 0&&t(r),()=>this.off(e,t)}once(e,t){let a=(()=>{let n=true,i=s=>{n&&(n=false,t(s),this._emitter.off(e,i));};return i})();return this._emitter.on(e,a),()=>this._emitter.off(e,a)}off(e,t){t?this._emitter.off(e,t):this._emitter.all.clear();}onAny(e){return this._emitter.on("*",e),()=>this._emitter.off("*",e)}emit(e,t,r){r&&(this._retainEvents||(this._retainEvents=new Map),this._retainEvents.set(e,t)),this._emitter.emit(e,t);}};function vr(o,e){let t=o.parentElement;for(;t;){if(t===e)return  false;if(t instanceof HTMLElement&&t.hasAttribute("data-autospark-outlet"))return  true;t=t.parentElement;}return  false}function et(o){if(!o)return [];let e=[],t=[o];for(;t.length>0;){let r=t.shift();for(let a of Array.from(r.children))vr(a,o)||(a instanceof HTMLElement&&a.hasAttribute("data-autospark-outlet")?e.push(a):a instanceof HTMLElement&&t.push(a));}return e}function gt(o,e=12){let t=3735928559,r=1103547991;for(let s=0;s<o.length;s++){let l=o.charCodeAt(s);t=Math.imul(t^l,2246822507),t=t<<13|t>>>19,r=Math.imul(r^l,3266489909),r=r<<7|r>>>25;}let a="",n=(t^r)>>>0,i=n%26+10;for(a+=i.toString(36);a.length<e;)n=Math.imul(n,2654435769),n=n<<5|n>>>27,a+=(n>>>0).toString(36);return a.substring(0,e)}function Uo(o,e){let t=(o||"{path}").replace(/\s+/g,""),r=gt(q(t,e));return isNaN(parseInt(r.substring(0,1)))?r:"h"+r}function B(){return B=Object.assign?Object.assign.bind():function(o){for(var e=1;e<arguments.length;e++){var t=arguments[e];for(var r in t)({}).hasOwnProperty.call(t,r)&&(o[r]=t[r]);}return o},B.apply(null,arguments)}var I;(function(o){o.Pop="POP",o.Push="PUSH",o.Replace="REPLACE";})(I||(I={}));var bt=process.env.NODE_ENV!=="production"?function(o){return Object.freeze(o)}:function(o){return o};function yt(o,e){if(!o){typeof console<"u"&&console.warn(e);try{throw new Error(e)}catch{}}}var vt="beforeunload",Rr="hashchange",Le="popstate";function Ie(o){o===void 0&&(o={});var e=o,t=e.window,r=t===void 0?document.defaultView:t,a=r.history;function n(){var m=r.location,p=m.pathname,k=m.search,_=m.hash,g=a.state||{};return [g.idx,bt({pathname:p,search:k,hash:_,state:g.usr||null,key:g.key||"default"})]}var i=null;function s(){if(i)v.call(i),i=null;else {var m=I.Pop,p=n(),k=p[0],_=p[1];if(v.length)if(k!=null){var g=c-k;g&&(i={action:m,location:_,retry:function(){w(g*-1);}},w(g));}else process.env.NODE_ENV!=="production"&&yt(false,"You are trying to block a POP navigation to a location that was not created by the history library. The block will fail silently in production, but in general you should do all navigation with the history library (instead of using window.history.pushState directly) to avoid this situation.");else S(m);}}r.addEventListener(Le,s);var l=I.Pop,u=n(),c=u[0],d=u[1],f=St(),v=St();c==null&&(c=0,a.replaceState(B({},a.state,{idx:c}),""));function h(m){return typeof m=="string"?m:kt(m)}function R(m,p){return p===void 0&&(p=null),bt(B({pathname:d.pathname,hash:"",search:""},typeof m=="string"?ae(m):m,{state:p,key:He()}))}function b(m,p){return [{usr:m.state,key:m.key,idx:p},h(m)]}function y(m,p,k){return !v.length||(v.call({action:m,location:p,retry:k}),false)}function S(m){l=m;var p=n();c=p[0],d=p[1],f.call({action:l,location:d});}function E(m,p){var k=I.Push,_=R(m,p);function g(){E(m,p);}if(y(k,_,g)){var T=b(_,c+1),C=T[0],L=T[1];try{a.pushState(C,"",L);}catch{r.location.assign(L);}S(k);}}function A(m,p){var k=I.Replace,_=R(m,p);function g(){A(m,p);}if(y(k,_,g)){var T=b(_,c),C=T[0],L=T[1];a.replaceState(C,"",L),S(k);}}function w(m){a.go(m);}var x={get action(){return l},get location(){return d},createHref:h,push:E,replace:A,go:w,back:function(){w(-1);},forward:function(){w(1);},listen:function(p){return f.push(p)},block:function(p){var k=v.push(p);return v.length===1&&r.addEventListener(vt,Rt),function(){k(),v.length||r.removeEventListener(vt,Rt);}}};return x}function At(o){o===void 0&&(o={});var e=o,t=e.window,r=t===void 0?document.defaultView:t,a=r.history;function n(){var p=ae(r.location.hash.substr(1)),k=p.pathname,_=k===void 0?"/":k,g=p.search,T=g===void 0?"":g,C=p.hash,L=C===void 0?"":C,N=a.state||{};return [N.idx,bt({pathname:_,search:T,hash:L,state:N.usr||null,key:N.key||"default"})]}var i=null;function s(){if(i)v.call(i),i=null;else {var p=I.Pop,k=n(),_=k[0],g=k[1];if(v.length)if(_!=null){var T=c-_;T&&(i={action:p,location:g,retry:function(){x(T*-1);}},x(T));}else process.env.NODE_ENV!=="production"&&yt(false,"You are trying to block a POP navigation to a location that was not created by the history library. The block will fail silently in production, but in general you should do all navigation with the history library (instead of using window.history.pushState directly) to avoid this situation.");else E(p);}}r.addEventListener(Le,s),r.addEventListener(Rr,function(){var p=n(),k=p[1];kt(k)!==kt(d)&&s();});var l=I.Pop,u=n(),c=u[0],d=u[1],f=St(),v=St();c==null&&(c=0,a.replaceState(B({},a.state,{idx:c}),""));function h(){var p=document.querySelector("base"),k="";if(p&&p.getAttribute("href")){var _=r.location.href,g=_.indexOf("#");k=g===-1?_:_.slice(0,g);}return k}function R(p){return h()+"#"+(typeof p=="string"?p:kt(p))}function b(p,k){return k===void 0&&(k=null),bt(B({pathname:d.pathname,hash:"",search:""},typeof p=="string"?ae(p):p,{state:k,key:He()}))}function y(p,k){return [{usr:p.state,key:p.key,idx:k},R(p)]}function S(p,k,_){return !v.length||(v.call({action:p,location:k,retry:_}),false)}function E(p){l=p;var k=n();c=k[0],d=k[1],f.call({action:l,location:d});}function A(p,k){var _=I.Push,g=b(p,k);function T(){A(p,k);}if(process.env.NODE_ENV!=="production"&&yt(g.pathname.charAt(0)==="/","Relative pathnames are not supported in hash history.push("+JSON.stringify(p)+")"),S(_,g,T)){var C=y(g,c+1),L=C[0],N=C[1];try{a.pushState(L,"",N);}catch{r.location.assign(N);}E(_);}}function w(p,k){var _=I.Replace,g=b(p,k);function T(){w(p,k);}if(process.env.NODE_ENV!=="production"&&yt(g.pathname.charAt(0)==="/","Relative pathnames are not supported in hash history.replace("+JSON.stringify(p)+")"),S(_,g,T)){var C=y(g,c),L=C[0],N=C[1];a.replaceState(L,"",N),E(_);}}function x(p){a.go(p);}var m={get action(){return l},get location(){return d},createHref:R,push:A,replace:w,go:x,back:function(){x(-1);},forward:function(){x(1);},listen:function(k){return f.push(k)},block:function(k){var _=v.push(k);return v.length===1&&r.addEventListener(vt,Rt),function(){_(),v.length||r.removeEventListener(vt,Rt);}}};return m}function Rt(o){o.preventDefault(),o.returnValue="";}function St(){var o=[];return {get length(){return o.length},push:function(t){return o.push(t),function(){o=o.filter(function(r){return r!==t});}},call:function(t){o.forEach(function(r){return r&&r(t)});}}}function He(){return Math.random().toString(36).substr(2,8)}function kt(o){var e=o.pathname,t=e===void 0?"/":e,r=o.search,a=r===void 0?"":r,n=o.hash,i=n===void 0?"":n;return a&&a!=="?"&&(t+=a.charAt(0)==="?"?a:"?"+a),i&&i!=="#"&&(t+=i.charAt(0)==="#"?i:"#"+i),t}function ae(o){var e={};if(o){var t=o.indexOf("#");t>=0&&(e.hash=o.substr(t),o=o.substr(0,t));var r=o.indexOf("?");r>=0&&(e.search=o.substr(r),o=o.substr(0,r)),o&&(e.pathname=o);}return e}function Jo(o){let e=o.replace(/^#\/?/,"");return e.startsWith("/")||(e="/"+e),e=e.replace(/\/+/g,"/"),e.length>1&&(e=e.replace(/\/+$/,"")),e}function Xo(){return At()}function ne(o){if(!o||!o.trim())return  false;if(o.startsWith("//")){let{hostname:e}=window.location,t=document.createElement("a");return t.href=o,t.hostname!==e}if(/^[a-z][a-z0-9+.-]*:/i.test(o)){let e=document.createElement("a");return e.href=o,e.protocol!=="http:"&&e.protocol!=="https:"?true:e.hostname!==window.location.hostname||e.port!==window.location.port}return  false}function Ne(o){if(!o)return {};let e=new URLSearchParams(o.startsWith("?")?o.slice(1):o),t={};return e.forEach((r,a)=>{t[a]=r;}),t}function z(o){return {name:o.route.name,path:o.path,curPath:o.path,url:o.url,timestamp:Date.now(),query:new URLSearchParams(o.query).toString(),...o.route.meta,...o.params,...o.state}}function V(o,e){let t=z(e),r=gt(q(o,t));return isNaN(parseInt(r.substring(0,1)))?r:"h"+r}function rt(o){let e=o?.route?.hash||"{url}";return V(e,o)}var K=class extends Error{constructor(t,r,a){super(t);this.status=0;this.status=r||0,this.route=a;}},ot=class extends Error{constructor(e,t){super(e),this.route=t;}},at=class extends Error{constructor(t,r="_self"){super(`External redirect: ${t}`);this.target="_self";this.name="AutoSparkExternalRouteError";this.url=t,this.target=r;}},W=class extends ot{constructor(e,t){super(`Redirect target not found: ${e}`,t),this.name="AutoSparkNotFoundRouteError",this.target=e;}},wt=class extends ot{constructor(e){let t=e.redirectFrom?.map(r=>r.url).join(" -> ");super(`Maximum redirect limit exceeded:${t} -> ...`,e);}},_t=class extends ot{constructor(e){let t=e.redirectFrom?.map(r=>r.url).join(" -> ");super(`Redirect loop detected: ${t} -> ${t}`,e);}},H=class extends K{},xt=class extends K{};var Sr=0;function Mt(o){return o==="/"||o===""?"/":o.replace(/\/+$/,"")}function se(o){let e=o;return e.startsWith("/")||(e="/"+e),e=e.replace(/\/+$/,""),e===""&&(e="/"),e.toLowerCase()}function ie(o,e){if(o.startsWith("/"))return o;let t=e.path.split("/").filter(Boolean).slice(0,-1).join("/"),r=t?t.split("/"):[];if(o.startsWith("./")){let a=o.slice(2);return "/"+[...r,a].join("/")}if(o.startsWith("../")){let a=o,n=[...r];for(;a.startsWith("../");)a=a.slice(3),n.length>0&&n.pop();return a&&n.push(a),"/"+n.join("/")}return M(t||"/",o)}function le(o,e,t){if(typeof o=="function"){let r=o(t);return r===null?null:le(r,e,t)}if(typeof o=="string")return ne(o)?{target:o,mode:"replace",isExternal:true}:{target:ie(o,t),mode:"replace"};if("path"in o){let r=o;return ne(r.path)?{target:r.path,mode:r.mode||"replace",windowTarget:r.target,isExternal:true}:{target:ie(r.path,t),mode:r.mode||"replace",windowTarget:r.target}}if("name"in o){let r=o,n=e?.get(r.name)?.deref();if(!n)return {target:`name:${r.name}`,mode:r.mode||"replace",windowTarget:r.target,notFound:true};let i=n.path;if(r.params)for(let[s,l]of Object.entries(r.params))i=i.replace(`:${s}`,l).replace(`<${s}>`,l);if(r.query){let s=new URLSearchParams(r.query).toString();s&&(i+=`?${s}`);}return {target:ie(i,t),mode:r.mode||"replace",windowTarget:r.target}}return null}function Ar(o){return o.replace(/[.+^${}()|[\]\\]/g,"\\$&")}function Ve(o){let e=o.indexOf("#");return e>=0?o.slice(0,e):o}function ue(o){let e=Ve(o),[t,r=""]=e.split("?",2),a=r?Ne("?"+r):{};return {pathname:t,query:a}}function De(o,e){let t=[],r=o.split("/").filter(Boolean),a=[];for(let l=0;l<r.length;l++){let u=r[l];if(u==="**"){if(l!==r.length-1)throw new Error("Multi-wildcard '**' can only appear at the end of a pattern");a.push(".+");continue}if(u==="*"){a.push("[^/]+");continue}let c=u.match(/^:(\w+)(?:\((.+)\))?$/);if(c){let f=c[1],v=c[2];t.push(f),a.push(`(${v||"[^/]+"})`);continue}let d=u.match(/^<(\w+)(?:\((.+)\))?>$/);if(d){let f=d[1],v=d[2];t.push(f),a.push(`(${v||"[^/]+"})`);continue}a.push(Ar(u.toLowerCase()));}let n;a.length>0&&a[a.length-1]===".*"?n=a.slice(0,-1).map(u=>"/"+u).join("")+"(?:/.*)?":n=a.map(l=>"/"+l).join("");let s;return e?s=`^${n}/?$`:s=`^${n}(?:/(.*))?$`,{regex:new RegExp(s),paramNames:t}}function wr(o,e){let r=o.split("/").filter(Boolean).map(a=>{let n=a.match(/^:(\w+)(?:\(.+\))?$/);if(n){let s=n[1];return e[s]??a}let i=a.match(/^<(\w+)(?:\(.+\))?>$/);if(i){let s=i[1];return e[s]??a}return a});return r.length>0?"/"+r.join("/"):"/"}function de(o,e,t,r){for(let a of o)if(a.default===true){let n=M(e.path,a.path),i={...e.params,...a.params},s={...a.query,...t},l=wr(n,i),u=Mt(l),c={route:a,params:i,query:s,state:{},path:n,url:u,hash:"",id:r};if(c.hash=rt(c),Array.isArray(a.children)&&a.children.length>0){let d=de(a.children,c,t,r);if(d&&d.length>0)return [c,...d]}return [c]}return null}function Et(o,e,t,r){let a=e?.path||"",n=e?.url||"",i=e?.params||{},s=M(a,o),l=Mt(M(n,o));return {route:void 0,params:i,query:t,state:{},path:s,url:l,hash:`unmatched-${s.replace(/\//g,"-")}`,id:r}}function _r(o,e=false){let t=o.path;if(t==="*"){let{regex:s,paramNames:l}=De("/*",false);return u=>{let d=se(ue(u).pathname).match(s);if(d){let f={};l.forEach((R,b)=>{f[R]=d[b+1]||"";});let v="",h=l.length+1;return v=d[h]||"",{matched:true,params:f,remainingPath:v}}return {matched:false,params:{},remainingPath:u}}}let r=t==="/"?"/":t.replace(/^\/+/,""),a=r.startsWith("/")?r:"/"+r,{regex:n,paramNames:i}=De(a,!e);return s=>{let u=se(ue(s).pathname).match(n);if(u){let c={};i.forEach((f,v)=>{c[f]=u[v+1]||"";});let d="";if(e){let f=i.length+1;d=u[f]||"";}return {matched:true,params:c,remainingPath:d}}return {matched:false,params:{},remainingPath:s}}}function je(o,e,t,r,a){let n=t?.path||"",i=t?.params||{},s=t?.url||"",l=!Array.isArray(o.children)||o.children.length===0,c=_r(o,true)(e);if(!c.matched||(o.path===""||o.path==="/")&&t&&c.remainingPath)return null;let d=Mt(e.slice(0,e.length-(c.remainingPath?.length||0))),f=Mt(M(s,d)),v=M(n,o.path),h=Object.assign({},o.params,i,c.params),R=o.query||{},b={route:o,params:h,query:R,state:{},path:v,url:f,hash:"",id:a};if(b.hash=rt(b),!c.remainingPath){if(Array.isArray(o.children)&&o.children.length>0){let y=de(o.children,b,r,a);if(y&&y.length>0)return [b,...y];let S=ce("/",o.children,b,r,a);return S.length>0?[b,...S]:[b]}return b.query={...R,...r},[b]}if(Array.isArray(o.children)&&o.children.length>0){let y="/"+c.remainingPath,S=ce(y,o.children,b,r,a);if(S.length>0)return [b,...S];if(o.path==="*"||o.path.endsWith("/*")){let A=Et(c.remainingPath,b,r,a);return [b,A]}let E=Et(c.remainingPath,b,r,a);return [b,E]}if(!l&&c.remainingPath)return null;if(c.remainingPath&&o.path==="*"){if(!t||t.path==="/")return null;let y=Et(c.remainingPath,b,r,a);return [b,y]}return [b]}function ce(o,e,t,r={},a){for(let n of e){if(n.path==="*"||n.path.includes("*"))continue;let i=je(n,o,t,r,a);if(i)return i}for(let n of e){if(!n.path.includes("*"))continue;let i=je(n,o,t,r,a);if(i)return i}return t===null?o==="/"||o===""?[]:[Et(o,null,r,a)]:[]}function J(o,e,t){let{pathname:r,query:a}=ue(o),n=se(r),i=Ve(o),s=i.includes("?")?i.slice(i.indexOf("?")+1):"",l=t?._redirectChain||[],u=t?.maxRedirect??10,c=t?.namedRoutes,d=++Sr,f={id:d,route:e,params:{},query:a,url:"/",path:"/",hash:""};f.hash=rt(f);let v=Array.isArray(e.children)?e.children:[],h=ce(n,v,null,a,d);if(h.some(y=>y.route!==void 0))h=[f,...h];else if(n==="/"||n===""){let y=de(v,f,a,d);y&&y.length>0?h=[f,...y]:h=[f];}else if(h.length>0)h=[f,...h];else return [];s&&h.forEach(y=>{y.url.includes("?")||(y.url=`${y.url}?${s}`,y.route&&(y.hash=rt(y)));});let b=h[h.length-1];if(u<0){let y=h[h.length-1];return [...h.slice(0,-1),{...y,route:void 0,error:new wt(y),redirectFrom:l.length>0?[...l]:void 0}]}if(l.some(y=>y.url===n)){let y=h[h.length-1];return [...h.slice(0,-1),{...y,route:void 0,error:new _t(y),redirectFrom:l.length>0?[...l]:void 0}]}if(b?.route?.redirect){let y=le(b.route.redirect,c,b);if(y===null)return h.map(g=>({...g,redirectFrom:void 0}));let{target:S,mode:E,windowTarget:A,notFound:w,isExternal:x}=y;if(w){let g=h[h.length-1];return [...h.slice(0,-1),{...g,target:A,error:new W(S,g),redirectFrom:l.length>0?[...l]:void 0}]}if(x){let g=h[h.length-1];return [...h.slice(0,-1),{...g,target:A||"_blank",error:new at(S,A||"_blank"),redirectFrom:l.length>0?[...l]:void 0}]}let m=[...l,{url:n,mode:E}],p=J(S,e,{...t,_redirectChain:m,maxRedirect:u-1});if(p.some(g=>g.error!==void 0))return p;if(!(p.length>1&&p.slice(1).some(g=>g.route!==void 0))){let g=h[h.length-1];return [...h.slice(0,-1),{...g,target:A,error:new W(S,g),redirectFrom:l.length>0?[...l]:void 0}]}return p.map(g=>({...g,target:A}))}if(t?.redirect&&!b?.route?.redirect&&l.length===0){let y=le(t.redirect,c,b);if(y){let{target:S,mode:E,windowTarget:A,notFound:w,isExternal:x}=y;if(w){let g=h[h.length-1];return [...h.slice(0,-1),{...g,target:A,error:new W(S,g),redirectFrom:l.length>0?[...l]:void 0}]}if(x){let g=h[h.length-1];return [...h.slice(0,-1),{...g,target:A||"_blank",error:new at(S,A||"_blank"),redirectFrom:l.length>0?[...l]:void 0}]}let m=[...l,{url:n,mode:E}],p=J(S,e,{...t,_redirectChain:m,maxRedirect:u-1});if(p.some(g=>g.error!==void 0))return p;if(!(p.length>1&&p.slice(1).some(g=>g.route!==void 0))){let g=h[h.length-1];return [...h.slice(0,-1),{...g,target:A,error:new W(S,g),redirectFrom:l.length>0?[...l]:void 0}]}return p.map(g=>({...g,target:A}))}}return h.map(y=>({...y,redirectFrom:l.length>0?[...l]:void 0}))}function xr(o){let e=o.trim();if(e==="/"||e===""||e==="./")return ["/"];let t=e.replace(/^\/+|\/+$/g,"");return t?t.split("/").filter(Boolean):["/"]}function $e(o){let e=o.path.trim();return e===""||e==="/"||e==="./"}function Er(o,e){let t=!o.children.has(e);return t&&o.children.set(e,{route:{path:e},children:new Map}),{node:o.children.get(e),isNew:t}}function Mr(o){return o.default===true}function Fe(o){let e=[];for(let[,t]of o.children){let{children:r,...a}=t.route,n={...a};t.children.size>0?n.children=Fe(t):r!==void 0&&!Array.isArray(r)&&(n.children=r),e.push(n);}return e}function Tt(o,e){let t=xr(e.path);if(t.length===1&&t[0]==="/"&&!Mr(e)){if(Array.isArray(e.children))for(let i of e.children)Tt(o,i);return}let a=t[t.length-1]==="**",n=o;for(let i=0;i<t.length;i++){let s=t[i],l=i===t.length-1,{node:u}=Er(n,s);if(n=u,l){let c=a?{...e,path:s,children:void 0}:{...e,path:s};if(n.route=c,Array.isArray(e.children)&&!a)for(let d of e.children)Tt(n,d);}}}function Ot(o){let e=o?Array.isArray(o)?o:[o]:[];if(e.length===0)return {path:"/"};let t=e.find($e),r=e.filter(s=>!$e(s)),a={route:{},children:new Map};if(t&&Array.isArray(t.children))for(let s of t.children)Tt(a,s);for(let s of r)Tt(a,s);let n={path:"/"};if(t){let{path:s,children:l,...u}=t;Object.assign(n,u);}let i=Fe(a);return i.length>0?n.children=i:t&&!Array.isArray(t.children)&&t.children!==void 0&&(n.children=t.children),n}function Tr(o){let e=[],t=o.split("/").filter(Boolean),r=[];for(let n of t){if(n==="*"){r.push(".*");continue}let i=n.match(/^:(\w+)(?:\((.+)\))?$/);if(i){e.push(i[1]),r.push(`(${i[2]||"[^/]+"})`);continue}let s=n.match(/^<(\w+)(?:\((.+)\))?>$/);if(s){e.push(s[1]),r.push(`(${s[2]||"[^/]+"})`);continue}r.push(n.toLowerCase().replace(/[.+^${}()|[\]\\]/g,"\\$&"));}let a=r.map(n=>"/"+n).join("");return {regex:new RegExp(`^${a}/?$`,"i"),paramNames:e}}function fa(o,e){let{regex:t,paramNames:r}=Tr(o),n=(e.replace(/\/+$/,"")||"/").match(t);if(!n)return {};let i={};return r.forEach((s,l)=>{let u=n[l+1];u!==void 0&&(i[s]=u);}),i}function Or(o){return o.includes("://")||o.startsWith("//")}function Cr(o,e){return e.split(".").reduce((t,r)=>t?.[r],o)}function Pr(o,e){let t=o.replace(/\{\s*meta\.([\w.]+)\s*\}/g,(r,a)=>{let n=Cr(e.meta,a);return n==null?"":String(n)});return q(t,{path:e.path,name:e.name??"",timestamp:Date.now()})}function Ue(o,e,t){let r=o===true?e.routesFile||"routes.json":o,a=Pr(r,e),n=Or(a)||a.startsWith("/")?a:M(e.path,a);return j(n,t)}var Ke=(o,e,t=[])=>{let r=Object.getOwnPropertyDescriptors(e);for(let a of t)delete r[a];Object.defineProperties(o,r);},X=(o,e=[o])=>{let t=Object.getPrototypeOf(o);return t===null?e:X(t,[...e,t])},Lr=(...o)=>{if(o.length===0)return;let e,t=o.map(r=>X(r));for(;t.every(r=>r.length>0);){let r=t.map(n=>n.pop()),a=r[0];if(r.every(n=>n===a))e=a;else break}return e},qe=(o,e,t=[])=>{var r;let a=(r=Lr(...o))!==null&&r!==void 0?r:Object.prototype,n=Object.create(a),i=X(a);for(let s of o){let l=X(s);for(let u=l.length-1;u>=0;u--){let c=l[u];i.indexOf(c)===-1&&(Ke(n,c,["constructor",...t]),i.push(c));}}return n.constructor=e,n},pe=o=>o.filter((e,t)=>o.indexOf(e)==t),Xe=new WeakMap,Hr=o=>Xe.get(o),Nr=(o,e)=>Xe.set(o,e);var Be=(o,e)=>{var t,r;let a=pe([...Object.getOwnPropertyNames(o),...Object.getOwnPropertyNames(e)]),n={};for(let i of a)n[i]=pe([...(t=o?.[i])!==null&&t!==void 0?t:[],...(r=e?.[i])!==null&&r!==void 0?r:[]]);return n},We=(o,e)=>{var t,r,a,n;return {property:Be((t=o?.property)!==null&&t!==void 0?t:{},(r=e?.property)!==null&&r!==void 0?r:{}),method:Be((a=o?.method)!==null&&a!==void 0?a:{},(n=e?.method)!==null&&n!==void 0?n:{})}},Ye=(o,e)=>{var t,r,a,n,i,s;return {class:pe([...(t=o?.class)!==null&&t!==void 0?t:[],...(r=e?.class)!==null&&r!==void 0?r:[]]),static:We((a=o?.static)!==null&&a!==void 0?a:{},(n=e?.static)!==null&&n!==void 0?n:{}),instance:We((i=o?.instance)!==null&&i!==void 0?i:{},(s=e?.instance)!==null&&s!==void 0?s:{})}},he=new Map,Dr=(...o)=>{var e;let t=new Set,r=new Set([...o]);for(;r.size>0;)for(let a of r){let n=X(a.prototype).map(u=>u.constructor),i=(e=Hr(a))!==null&&e!==void 0?e:[],l=[...n,...i].filter(u=>!t.has(u));for(let u of l)r.add(u);t.add(a),r.delete(a);}return [...t]},jr=(...o)=>{let e=Dr(...o).map(t=>he.get(t)).filter(t=>!!t);return e.length==0?{}:e.length==1?e[0]:e.reduce((t,r)=>Ye(t,r))};function Ge(...o){var e,t,r;let a=o.map(l=>l.prototype);function i(...l){for(let u of o)Ke(this,new u(...l));}i.prototype=qe(a,i),Object.setPrototypeOf(i,qe(o,null,["prototype"]));let s=i;{let l=jr(...o);for(let u of (e=l?.class)!==null&&e!==void 0?e:[]){let c=u(s);c&&(s=c);}ze((t=l?.static)!==null&&t!==void 0?t:{},s),ze((r=l?.instance)!==null&&r!==void 0?r:{},s.prototype);}return Nr(s,o),s}var ze=(o,e)=>{let t=o.property,r=o.method;if(t)for(let a in t)for(let n of t[a])n(e,a);if(r)for(let a in r)for(let n of r[a])n(e,a,Object.getOwnPropertyDescriptor(e,a));};var Pt=class{attachContextProvider(){this._onContextRequest=this.onContextRequest.bind(this),this.host.addEventListener("context-request",this._onContextRequest);}removeContextProvider(){this._onContextRequest&&this.host.removeEventListener("context-request",this._onContextRequest);}onContextRequest(e){let t=e.detail;t.context==="AutoSparkRouter"&&(e.stopPropagation(),t.callback(this));}};var G=class extends Error{constructor(){super(...arguments),this.name="AbortError";}},fe=class extends Error{constructor(){super(...arguments),this.name="TimeoutError";}},Fr=0;function D(o){let{autoReset:e=false,abortAt:t="all",until:r,abortSignal:a}=o||{},n=false,i=false,s=true,l=false,u,c,d=0,f,v=++Fr,h=null,R=null,b,y,S=0,E={},A=function(){clearTimeout(d),h&&t==="all"&&h.abort(),n=false,i=false,s=true,l=false,y=void 0,b=void 0,S=0,h=null,f=new Promise((x,m)=>{u=x,c=m;});};A();async function w(x){let{timeout:m=0,returns:p,abortSignal:k}=x||{};if(k&&!k.aborted&&k.addEventListener("abort",()=>w.abort(),{once:true}),typeof r=="function"&&r())return n=true,b;if(n||i)if(e)A();else {if(i)throw y;return b}return m>0&&(d=setTimeout(()=>{if(!(l||!s||n||i)){l=true,s=false,p instanceof Error?(i=true,n=false):(n=true,i=false);try{S=Date.now(),p instanceof Error?(y=p,c(p)):(b=p,u(b));}catch{}finally{l=false;}}},m)),f}return w.id=v,w.resolve=x=>{if(clearTimeout(d),!(typeof r=="function"&&!r())&&!(l||!s||n||i)){l=true,s=false,n=true,i=false;try{h&&(t==="all"||t==="resolve")&&h.abort(),b=x,y=void 0,S=Date.now(),u(x);}catch{}finally{l=false;}}},w.reject=x=>{if(clearTimeout(d),!(l||!s||n||i)){l=true,s=false,n=false,i=true;try{let m=typeof x=="string"?new Error(x):x instanceof Error?x:new Error;y=m,S=Date.now(),h&&(t==="all"||t==="reject")&&h.abort(),f?.catch(()=>{}),c(m);}catch{}finally{l=false;}}},w.destroy=()=>{try{clearTimeout(d),R&&a&&(a.removeEventListener("abort",R),R=null),s&&(setTimeout(()=>{try{c(new G);}catch{}}),h&&h.abort()),n=!1,i=!1,s=!1,l=!1,f=null,h=null,b=void 0,y=void 0,S=0;}catch{}},w.reset=A,w.isFulfilled=()=>n,w.isRejected=()=>i,w.isPending=()=>s,Object.defineProperty(w,"result",{get:()=>b,enumerable:true,configurable:true}),Object.defineProperty(w,"error",{get:()=>y,enumerable:true,configurable:true}),Object.defineProperty(w,"timestamp",{get:()=>S,enumerable:true,configurable:true}),Object.defineProperty(w,"meta",{get:()=>E,enumerable:true,configurable:true}),w.abort=()=>{h&&h.abort(),w.reject(new G);},a&&!a.aborted&&(R=()=>{w.abort(),R&&a&&(a.removeEventListener("abort",R),R=null);},a.addEventListener("abort",R)),w.getAbortSignal=()=>(h===null&&(h=new AbortController),h?.signal),w}D.resolve=o=>{let e=D();return e.resolve(o),e};D.reject=o=>{let e=D();return e().catch(()=>{}),e.reject(o),e};var Y;function Lt(){Y||(Y=new Map);}var me={get:o=>(Lt(),Y.get(o)),set:(o,e)=>{Lt(),Y.set(o,e);},delete:o=>{Lt(),Y.delete(o);},clear:()=>{Lt(),Y.clear();}};function Ze(o){let e=o.trim(),t=e.indexOf("?");t!==-1&&(e=e.substring(0,t));let r=e.indexOf("#");r!==-1&&(e=e.substring(0,r));let a=e;if(a.endsWith("/"))a=a+"data.json";else {let n=a.lastIndexOf("/"),i=a.lastIndexOf(".");i!==-1&&i>n?a=a.substring(0,i)+".json":a=a+".json";}return a}function it(o){if(!o||typeof o!="object")return  false;let e=Object.getPrototypeOf(o);return e===null||e===Object.prototype||Object.getPrototypeOf(e)===null?Object.prototype.toString.call(o)==="[object Object]":false}function st(o){return o&&typeof o=="function"}(o=>typeof F<"u"?F:typeof Proxy<"u"?new Proxy(o,{get:(e,t)=>(typeof F<"u"?F:e)[t]}):o)(function(o){if(typeof F<"u")return F.apply(this,arguments);throw Error('Dynamic require of "'+o+'" is not supported')});var Ur=/<[^>]+>/;function Z(o){if(typeof o!="string"||o.trim()==="")return  false;let e=o.trim();return !(e.includes(`
`)||Ur.test(e))}function Qe(o,e){let t=e;for(let r=0;r<o.length;r++)t^=o.charCodeAt(r),t=Math.imul(t,16777619),t|=0;return t}function qr(o){let e=o.toString(),t=Qe(e,2166136261),r=Qe(e,2216829733),a=(t>>>0).toString(16).padStart(8,"0"),n=(r>>>0).toString(16).padStart(8,"0");return a+n}function Br(o){return o.map(e=>qr(e)).join("|")}function tr(...o){if(o.length!==0){if(o.length===1)return o[0];for(let e of o)if(e.aborted)return e;return typeof AbortSignal.any=="function"?AbortSignal.any(o):Wr(o)}}function Wr(o){let e=new AbortController,t=()=>{e.abort();for(let r of o)r.removeEventListener("abort",t);};for(let r of o)r.addEventListener("abort",t);return e.signal}function lt(o,...e){if(!o)return;let t=Array.isArray(o)?o:[o];for(let r of t)if(typeof r=="function")try{let a=r(...e);a&&typeof a=="object"&&typeof a.then=="function"&&a.catch(()=>{});}catch{}}var er=class O{constructor(e,t){this.loader=e,this.loading=false,this.id=0,this._retryTimerId=0,this._loadToken=0,this._strategy="fallback",this._presetSettled=false;var r;if(this.options=Object.assign({autostart:true,cache:0,retry:0,retryDelay:0,storage:me,multiplex:"off",meta:{}},t),this._loaders.length===0)throw new Error("AsyncLoader requires at least one loader");let a=this._loaders.length>1;if(this.options.multiLoaderStrategy==="combine"&&a){if(typeof this.options.onResults!="function")throw new Error('multiLoaderStrategy="combine" requires onResults');this._strategy="combine";}else this._strategy="fallback";let n=(r=this.options.multiplex)!=null?r:"off";if((n!=="off"||this.options.cache>0)&&!this.options.hash&&(this.options.hash=Br(this._loaders)),n!=="off"){O.loaderCache!=null||(O.loaderCache=new Map);let i=O._getLoader(this.options.hash);if(i)return i.loading&&this.options.multiplex==="restart"&&(i.clear(),i.abort(),i.load()),i;O.loaderCache.set(this.options.hash,new WeakRef(this));}this.id=++O.seq,this.signal=D(),this.options.autostart&&this.load();}static _getLoader(e){let t=O.loaderCache;if(!t)return;let r=t.get(e);if(!r)return;let a=r.deref();return a||t.delete(e),a}static clearLoaderCache(){var e;(e=O.loaderCache)==null||e.clear();}static resolve(e){let t=new O(()=>e,{autostart:false});return t._presetSettled=true,t.signal.resolve(e),t}static reject(e){let t=new O(()=>{throw e},{autostart:false});return t._presetSettled=true,t.signal.reject(e),t}get _loaders(){return Array.isArray(this.loader)?this.loader:[this.loader]}get storage(){return this.options.storage}get hash(){return this.options.hash}get meta(){return this.options.meta}get error(){return this.signal.error}get result(){return this.signal.result}load(){var e;if(this.loading)return;(this.signal.isFulfilled()||this.signal.isRejected())&&this.signal.reset();let t=this._getCacheItem();if(t){this.signal.resolve(t.value),this._removeFromLoaderCache();return}let r=[this.signal.getAbortSignal()];this.options.abortSignal&&r.push(this.options.abortSignal);let a=tr(...r);((e=this.options.multiplex)!=null?e:"off")!=="off"&&this.options.hash&&(O.loaderCache!=null||(O.loaderCache=new Map),O.loaderCache.set(this.options.hash,new WeakRef(this))),lt(this.options.onPending),this.loading=true,this._loadToken++,this._executeLoad(a,0);}_executeLoad(e,t){let r=this._loadToken,a=0,n=null;this.options.timeout&&this.options.timeout>0&&(n=new AbortController,a=setTimeout(()=>n.abort(),this.options.timeout));let i=[e];n&&i.push(n.signal);let s={abortSignal:tr(...i),meta:this.meta},l;try{l=this._composedLoader(s);}catch(u){l=Promise.reject(u);}Promise.resolve(l).then(u=>{a&&clearTimeout(a),r===this._loadToken&&(this._setCacheItem(u),this.loading=false,this.signal.resolve(u),this._removeFromLoaderCache(),lt(this.options.onFulfilled,u));}).catch(u=>{var c,d;if(a&&clearTimeout(a),r!==this._loadToken)return;let f=(c=this.options.retry)!=null?c:0;if(t<f&&!e.aborted)this._retryTimerId=setTimeout(()=>{this._retryTimerId=0,this._executeLoad(e,t+1);},(d=this.options.retryDelay)!=null?d:0);else {let v=n!=null&&n.signal.aborted?new fe:u;if(this.loading=false,!e.aborted&&this.options.defaultValue!==void 0)this.signal.resolve(this.options.defaultValue),this._removeFromLoaderCache(),lt(this.options.onFulfilled,this.options.defaultValue);else {let h=e.aborted;this.signal.reject(v),this._removeFromLoaderCache(),h||lt(this.options.onRejected,v);}}});}_composedLoader(e){let t=this._loaders;return this._strategy==="combine"&&t.length>1?this._composeCombine(e):t.length===1?t[0](e):this._composeFallback(e)}_composeFallback(e){return new Promise((t,r)=>{let a=this._loaders,n=e.abortSignal,i=0,s,l=()=>{if(n.aborted){r(new G);return}if(i>=a.length){r(s??new Error("all loaders failed"));return}let u=a[i++],c;try{c=u(e);}catch(d){c=Promise.reject(d);}Promise.resolve(c).then(d=>t(d),d=>{s=d instanceof Error?d:new Error(String(d)),l();});};l();})}_composeCombine(e){let t=this._loaders.map(r=>{try{return Promise.resolve(r(e))}catch(a){return Promise.reject(a)}});return Promise.allSettled(t).then(r=>{if(e.abortSignal.aborted)throw new G;let a=r.map(n=>n.status==="fulfilled"?n.value:n.reason instanceof Error?n.reason:new Error(String(n.reason)));return this.options.onResults(a,this.options.defaultValue)})}_removeFromLoaderCache(){var e;let t=O.loaderCache;this.options.hash&&((e=t?.get(this.options.hash))==null?void 0:e.deref())===this&&t.delete(this.options.hash);}_useCache(){return this.options.cache>0&&this.options.hash}_setCacheItem(e){this._useCache()&&this.storage.set(this.options.hash,{value:e,timestamp:Date.now()});}_getCacheItem(){if(!this._useCache())return;let e=this.storage.get(this.options.hash);if(e){if(Date.now()-e.timestamp>this.options.cache){this.storage.delete(this.options.hash);return}return e}}get(e){let t=this._useCache()&&!this._getCacheItem();return !this._presetSettled&&!this.loading&&(!this.signal.isFulfilled()||t)&&this.load(),this.signal(e)}invalidate(){this._presetSettled=false,this.clear(),!this.loading&&(this.signal.isFulfilled()||this.signal.isRejected())&&this.signal.reset();}refresh(e){return this._presetSettled=false,this.loading&&this.abort(),this.clear(),this.load(),this.signal(e)}abort(){let e=this.loading;this.signal.abort(),this.loading=false,this._removeFromLoaderCache(),this._retryTimerId&&(clearTimeout(this._retryTimerId),this._retryTimerId=0),e&&lt(this.options.onRejected,this.signal.error);}clear(){this._useCache()&&this.options.hash&&this.storage.delete(this.options.hash);}clearAll(){this.storage.clear();}isPending(){return this.loading}isFulfilled(){return this.signal.isFulfilled()}isRejected(){return this.signal.isRejected()}};er.seq=0;var rr=er;var It=class{constructor(e){this.cache=new Map;this.router=e,this.options=Object.assign({timeout:0,cache:0,hash:"{path}"},e.options.dataOptions||{});}getLoader(e){return e.route._getData}getSignal(e){return this.getLoader(e)?.signal}_createLoader(e,t,r){let a=this._createLoaderFn(e,t),n=new rr(a,{hash:e.hash,meta:{hash:e.hash},cache:t.cache,timeout:t.timeout,retry:t.retry,retryDelay:t.retryDelay,multiplex:t.multiplex,defaultValue:t.default,abortSignal:r,storage:this.cache});return e.route._getData=n,n}_createLoaderFn(e,t){return async({abortSignal:r,meta:a})=>{let n=t.from;if(it(n)&&!Z(n))return this._validateData(n);if(Z(n)||n===true){let i=n===true?this._getAutoUrl(e):n;if(!i)throw new H("No valid URL found");let s=j(i.params(z(e)),this.router.options.base);a.url=s;let l=await fetch(s,{signal:r});if(!l.ok)throw a.statusCode=l.status,new H(`Failed to load ${s} : ${l.statusText}`,l.status);return this._validateData(await l.json())}if(st(n))return this._validateData(await n(e));throw new H("Invalid data source")}}_getRouteOptions(e){return e.route._dataOptions||(e.route._dataOptions=this._mergeRouteOptions(e)),e.route._dataOptions}_mergeRouteOptions(e){let t=e.route.data||{},r=it(t)&&"from"in t;return {...this.options,...r?t:{from:t}}}loadStateOf(e){if(e.route)return e.route._dataLoadState}setLoadState(e,t){e.route&&(e.route._dataLoadState=t);}loadRoutes(e,t,r=0){return Promise.allSettled(e.map((a,n)=>{if(!(n<r&&this.loadStateOf(a)==="ok"))return this._loadRoute(a,t)}))}async _loadRoute(e,t){if(!e.route?.data)return;let r=this._getRouteOptions(e);try{await this._createLoader(e,r,t).get(),this.setLoadState(e,"ok");}catch(a){a.name!=="AbortError"&&(this.setLoadState(e,"error"),this.router.logger.error(`DataLoader: Failed to load data for route ${e.path}`,()=>[a]));}}_getHash(e,t){return t.hash?V(t.hash,e):V("{path}",e)}_isValidData(e){return it(e)}_validateData(e){if(!this._isValidData(e))throw new H("Invalid data format: expected plain object");return e}_getAutoUrl(e){if(e.route){let t=e.route.view,r=typeof t=="function"?t(e):t;if(typeof r=="string")return Ze(r)}}async loadDatas(e,t,r=0){return this.loadRoutes(e,t,r)}invalidateRoute(e){this.getLoader(e)?.invalidate();}async refreshRoute(e){let t=this.getLoader(e);if(!t)throw new Error("No loader found for this route");return await t.refresh()}abortRoute(e){this.getLoader(e)?.abort();}isLoading(e){return this.getLoader(e)?.loading||false}cleanup(){this.cache.clear();}};var Ht=class{constructor(e){this.router=e,this.hooks={beforeRoute:[],afterRoute:[],beforeRender:[],afterRender:[],routeError:[]},this.options=Object.assign({timeout:3e3},e.options.hookOptions),this._addGlobalHooks();}_addGlobalHooks(){let e=["beforeRoute","afterRoute","beforeRender","afterRender"];for(let t of e){let r=this.router.options[t];r&&(Array.isArray(r)?this.hooks[t].push(...r):typeof r=="function"&&this.hooks[t].push(r));}}add(e,t){this.hooks[e].push(t);}remove(e,t){let r=this.hooks[e].indexOf(t);r>-1&&this.hooks[e].splice(r,1);}clear(e){e?this.hooks[e]=[]:Object.keys(this.hooks).forEach(t=>{this.hooks[t]=[];});}async runBeforeRoute(e){return this._runHooks("beforeRoute",e)}async runAfterRoute(e){return this._runHooks("afterRoute",e,{mode:"parallel"})}async runBeforeRender(e){return this._runHooks("beforeRender",e)}async runAfterRender(e){return this._runHooks("afterRender",e,{mode:"parallel"})}async runRouteError(e){return this._runHooks("routeError",e,{mode:"parallel"})}async _runHooks(e,t,r){let{mode:a,ignoreErrors:n}=Object.assign({mode:"serial",ignoreErrors:true},r),{to:i}=t,s=[...this.hooks[e],...i.flatMap(l=>l.route?.[e]||[])];if(a==="serial")for(let l of s)try{let u=await this._runHook.apply(this.router,[l,t]);if(u===!1)return !1;if(typeof u=="string")return u}catch(u){if(n)continue;throw this.router.logger.error(`Error executing hook: ${u.message}`),u}else return await Promise.allSettled(s.map(l=>this._runHook.apply(this.router,[l,t])));return  true}_runHook(e,t){return new Promise((r,a)=>{let n=this.options.timeout>0?setTimeout(()=>{a(new Error(`Hook timeout after ${this.options.timeout}ms`));},this.options.timeout):0;Promise.resolve(e.apply(this.router,[t])).then(i=>{clearTimeout(n),r(i);}).catch(i=>{clearTimeout(n),a(i);});})}};var Nt=class{};var Dt=class{};var jt=class{};var zr=new Set(["STYLE","SCRIPT","TITLE","TEXTAREA"]),$t=class $t{async _loadSignal(e){if(!e)return;let t=typeof e=="function"?e:e.signal,r={};try{let a=await t();r.value=a&&typeof a=="object"&&"value"in a?a.value:a,r.hash=t.meta.hash,r.meta=a&&typeof a=="object"&&"meta"in a?a.meta:void 0;}catch(a){r.error=new K(a.message,a.status||500);}return r}async _loadView(e){let t=e.route;return await this._loadSignal(t._getView)}async _loadData(e){let t=e.route;return await this._loadSignal(t._getData)}_routeReject(e,t,r,a,n,i){if(this.hooks.runRouteError({error:e,to:i}),!t||!r)return;let s=this._getErrorPage(e,i),l={...a,html:s.outerHTML,ready:true,raw:false};n?this._mountView(t,r,l):this._mountEphemeral(t,l);}_getCommonRouteIndex(e,t){let r=0;if(e&&e.length>0)for(let a=0;a<Math.min(e.length,t.length)&&e[a].url===t[a].url;a++)r=a+1;return this.logger.debug("{} -> \u516C\u5171\u8DEF\u7531\u5C42\u6570: {}",t[0].id,r),r}_injectRouteData(e,t,r){if(!t||typeof t!="object")return e;let a={...t,$params:r.params||{},$query:r.query||{},$state:r.state||{}},i=`<script type="autospark/data">${JSON.stringify(a).replace(/</g,"\\u003c")}</script>`,s=document.createElement("template");s.innerHTML=e;let l=false;for(let u of Array.from(s.content.children))zr.has(u.tagName)||(u.insertAdjacentHTML("beforeend",i),l=true);return l?s.innerHTML:(this.logger.debug("{} -> \u89C6\u56FE\u65E0\u53EF\u6CE8\u5165\u5143\u7D20\u6839\uFF0C\u8DEF\u7531\u6570\u636E\u672A\u6CE8\u5165",r.id),e)}_getOutletComponent(e){let t=this.engine?.getComponent(e);return t||(this.logger.error("{} -> outlet \u5BBF\u4E3B\u672A\u5173\u8054\u7EC4\u4EF6\u5B9E\u4F8B\uFF0C\u65E0\u6CD5\u6E32\u67D3\u89C6\u56FE",e.tagName),null)}_getRootOutlet(){return et(this.host)[0]??null}_resolveKeepAlive(e,t){return t?.data.mode==="tabs"?true:typeof e.keepAlive=="boolean"?e.keepAlive:t?.data.keepAlive===true}_outletData(e,t){this.engine?.data(e,t);}_mountView(e,t,r){let a=t.data.views,n=a.find(s=>s.hash===r.hash);if(n&&n.ready){this._outletData(e,{active:r.hash});return}let i=n?a.map(s=>s.hash===r.hash?{...s,html:r.html||"",ready:!!r.ready,raw:!!r.raw}:s):[...a,{hash:r.hash,url:r.url,title:r.title,html:r.html||"",ready:!!r.ready,raw:!!r.raw}];this._outletData(e,{views:i,active:r.hash});}_mountEphemeral(e,t){this._outletData(e,{ephemeral:{hash:t.hash,html:t.html||"",ready:!!t.ready,raw:!!t.raw},active:t.hash});}_findNestedOutlet(e,t){let r=e.querySelector(`[data-view-hash="${t}"]`);return r instanceof HTMLElement?et(r)[0]??null:null}async _awaitNestedOutlet(e,t,r){for(let a=0;a<=$t.NESTED_OUTLET_MICROTASK_RETRIES;a++){if(e.aborted)return null;let n=this._findNestedOutlet(t,r);if(n)return n;await Promise.resolve();}return null}_isOutletActive(e,t){return this.engine?.getComponent(e)?.data.active===t}_closestOutlet(e,t){let r=e.parentElement;for(;r&&r!==t;){if(r instanceof HTMLElement&&r.hasAttribute("data-autospark-outlet"))return r;r=r.parentElement;}return null}async _renderRoutes(e,t,r){let a,n=null;try{let i=this._getRootOutlet();if(!i){this.logger.error("\u5BBF\u4E3B\u5185\u672A\u627E\u5230 autospark.outlet \u51FA\u53E3\uFF0C\u8DF3\u8FC7\u6E32\u67D3\uFF08\u6CE8\u5165\u6A21\u5F0F\u987B\u5728\u6A21\u677F\u4E2D\u58F0\u660E\u51FA\u53E3\u5143\u7D20\uFF09"),this.emit("render:after",{route:e,error:a,slot:null});return}this.emit("render:before",{route:e});let s=this._getCommonRouteIndex(t,e),l="",u=i,c=!1;for(let d=0;d<e.length;d++){if(r.aborted)return;let f=e[d],v=f.route;if(v){if(d===0)u=i;else if(c){let E=await this._awaitNestedOutlet(r,u,l);if(r.aborted)return;E?u=E:this.logger.warn("{} -> \u5C42 {} \u672A\u627E\u5230\u5D4C\u5957\u51FA\u53E3\uFF0C\u56DE\u9000\u6CBF\u7528\u4E0A\u4E00\u5C42\u51FA\u53E3\uFF08\u8DEF\u5F84\u94FE {}\uFF09",e[0].id,d,e.map(A=>A.route?.path??"?").join(" > "));}let h=f.hash;l=h;let R=!!f.route?.view;if(c=R,d<s&&(!R||this._isOutletActive(u,h)))continue;let b=R?this._getOutletComponent(u):null,y=this._resolveKeepAlive(v,b),S={hash:h,url:f.url,title:v.title||h,raw:!1};R&&(this._lastViewSlot=u,n=u);try{if(r.aborted){this.logger.debug("\u6570\u636E\u52A0\u8F7D\u524D\u88AB\u4E2D\u6B62");return}let E=await this._loadData(f);if(r.aborted){this.logger.debug("\u89C6\u56FE\u52A0\u8F7D\u524D\u88AB\u4E2D\u6B62");return}let A=await this._loadView(f),w=b?.data.views.find(m=>m.hash===h&&m.ready)??null,x=!!(y&&w);if(!x&&b&&A){let m={...S,html:"",ready:!1};y?this._mountView(u,b,m):this._mountEphemeral(u,m);}if(b&&this._outletData(u,{active:h}),A)if(A.error){this._routeReject(A.error,u,b,S,y,e);break}else {if(await this._runBeforeRender(t||[],e,u,E?.value),b)if(x)this._outletData(u,{active:h});else {let m=A.meta?.raw===!0,p=m?A.value:this._injectRouteData(A.value,E?.value,f),k={...S,html:p,ready:!0,raw:m};y?this._mountView(u,b,k):this._mountEphemeral(u,k);}this._runAfterRender(t||[],e,u);}}catch(E){this.logger.error("\u89C6\u56FE\u6216\u6570\u636E\u52A0\u8F7D\u5931\u8D25",E),b&&this._routeReject(E,u,b,S,y,e);break}}}if(t&&t.length>e.length&&!r.aborted){let d=u;for(let f=e.length;f<t.length&&!r.aborted;f++){let v=t[f];if(!v.route?.view)break;let h=d.querySelector(`[data-view-hash="${v.hash}"]`);if(!(h instanceof HTMLElement))break;let R=this._closestOutlet(h,d);if(!R)break;this._outletData(R,{active:""}),d=R;}}}catch(i){this.logger.error(`\u6E32\u67D3\u5931\u8D25: ${i.message}`,i),a=i;}finally{this.emit("render:after",{route:e,error:a,slot:n});}}async _runBeforeRender(e,t,r,a){try{await this.hooks.runBeforeRender({from:e,to:t,view:r,data:a});}catch(n){this.logger.error("\u6E32\u67D3\u6D41\u7A0B: beforeRender \u94A9\u5B50\u6267\u884C\u5931\u8D25",n);}}_runAfterRender(e,t,r){this.hooks.runAfterRender({from:e,to:t,el:r}).catch(a=>{this.logger.error("\u6E32\u67D3\u6D41\u7A0B: afterRender \u94A9\u5B50\u6267\u884C\u5931\u8D25",a);});}_getErrorPage(e,t){let r=String(e.status||500),a=this.options.errorPages,n=a[r]||a["*"];try{return typeof n=="function"?n(e,t):n}catch(i){this.logger.error("\u9519\u8BEF\u5904\u7406\u5668\u6267\u884C\u5931\u8D25",i);let s=a["*"];return typeof s=="function"?s(i,t):s}}_findOutlet(e){return et(e)[0]||null}_ensureDefaultOutlet(){et(this.host).length>0||this.logger.warn("\u5BBF\u4E3B\u5185\u672A\u627E\u5230 autospark.outlet \u51FA\u53E3\uFF1A\u6CE8\u5165 engine \u6A21\u5F0F\u4E0B\u8BF7\u5728\u6A21\u677F\u4E2D\u58F0\u660E <div x-component:autospark.outlet>\uFF08x-outlet \u7B80\u5199\u4EC5\u5BF9\u81EA\u5EFA\u6A21\u5F0F\u4E0E\u8FDC\u7A0B\u6A21\u677F\u751F\u6548\uFF09");}};$t.NESTED_OUTLET_MICROTASK_RETRIES=20;var Vt=$t;var Ft=class{async openModal(e){let t=this.modalState,r=this.maxModals,a=this._resolveModalRoute(e);if(!a)throw new Error("Invalid modal route");let n=this._getModalConfig(a);if(!n)throw new Error("Route is not configured as modal");if(t.stack.length>=r){console.warn("Maximum modal stack depth reached");return}let i=await this._createModalElement(a),s;n.backdrop!==false&&(s=this._createBackdrop(n));let l={route:a,element:i,backdrop:s,timestamp:Date.now()};t.stack.push(l),t.current=l,await this._renderModal(l),this.emit("modal/open",{route:a,stackItem:l}),n.autoClose&&n.autoClose>0&&setTimeout(()=>{t.current===l&&this._closeTopModal();},n.autoClose),this._updateModalURL(a);}async closeModal(e){let t=this.modalState;if(e){let r;if(typeof e=="string"?r=this.routes.match(e)?.route||null:r=e,!r)return;let a=t.stack.findIndex(n=>n.route===r);if(a!==-1)for(;t.stack.length>a;)await this._closeTopModal();}else await this._closeTopModal();}async closeAllModals(){for(;this.modalState.stack.length>0;)await this._closeTopModal();}get hasOpenModals(){return this.modalState.stack.length>0}get modalCount(){return this.modalState.stack.length}get currentModal(){return this.modalState.current}_initModals(){this._createModalContainer(),this._setupModalEventListeners(),this._injectModalStyles();}injectModalStyles(){if(document.querySelector("#autospark-modal-styles"))return;let e=document.createElement("style");e.id="autospark-modal-styles",e.textContent=`
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
        `,document.head.appendChild(e);}_closeTopModal(){let e=this.modalState;if(e.stack.length===0)return Promise.resolve();let t=e.stack.pop();return t?(t.element.classList.add("closing"),t.backdrop&&t.backdrop.classList.add("closing"),new Promise(r=>{setTimeout(()=>{t.element.remove(),t.backdrop?.remove(),e.current=e.stack[e.stack.length-1]||null,this.emit("modal/close",{route:t.route,stackItem:t}),this._restoreModalURL(),r();},200);})):Promise.resolve()}_createModalElement(e){let t=document.createElement("div");if(t.className="autospark-modal-content",e.view){if(typeof e.view=="string")return this.viewLoader.loadView(e.view,e.remoteOptions).then(async a=>(a.success&&a.content&&await this.renderToOutlet(a,t,{mode:"replace"}),t));{let r=e.view;if(r.tagName==="TEMPLATE"){let n=r.content.cloneNode(true);t.appendChild(n);}else t.appendChild(r);}}return Promise.resolve(t)}createModalContainer(){let e=this.host.querySelector(".autospark-modals");return e||(e=document.createElement("div"),e.className="autospark-modals",this.host.appendChild(e)),this.modalContainer=e,e}setupModalEventListeners(){document.addEventListener("keydown",e=>{e.key==="Escape"&&this.modalState.current&&this.getModalConfig(this.modalState.current.route)?.closeOnEsc!==false&&this.closeTopModal();});}getModalConfig(e){return typeof e.modal=="boolean"?e.modal?{}:null:e.modal||null}async closeTopModal(){if(this.modalState.stack.length===0)return;let e=this.modalState.stack.pop();e&&(e.element.remove(),e.backdrop?.remove(),this.modalState.current=this.modalState.stack[this.modalState.stack.length-1]||null,this.emit("modal-close",{route:e.route,stackItem:e}),this._restoreModalURL());}_createBackdrop(e){if(e.backdrop===false)return;let t=document.createElement("div");return t.className="autospark-modal-backdrop",e.closeOnBackdropClick!==false&&t.addEventListener("click",()=>{this._closeTopModal();}),t}_renderModal(e){let t=this.modalContainer,r=this._getModalConfig(e.route);return e.backdrop&&t.appendChild(e.backdrop),this._applyModalStyles(e.element,r),t.appendChild(e.element),Promise.resolve()}_applyModalStyles(e,t){if(!t)return;let r=t.type||"dialog",a=t.position||"center",n=t.offset||[0,0];e.classList.add(`autospark-modal-${r}`),e.classList.add(`autospark-modal-${a}`),this._applyPositionStyles(e,r,a,n);}_applyPositionStyles(e,t,r,a){let n=e.style;if(n.position="fixed",n.zIndex="10000",t==="dialog"?(n.maxWidth="600px",n.maxHeight="80vh",n.overflow="auto"):t==="drawer"&&(r==="left"||r==="right"?(n.width="300px",n.maxHeight="100vh",n.overflow="auto"):(n.maxHeight="100vh",n.overflow="auto")),t!=="drawer")switch(r){case "center":n.top="50%",n.left="50%",n.transform=`translate(calc(-50% + ${a[0]}px), calc(-50% + ${a[1]}px))`;break;case "top":n.top=`${a[1]}px`,n.left="50%",n.transform=`translateX(calc(-50% + ${a[0]}px))`;break;case "top-left":n.top=`${a[1]}px`,n.left=`${a[0]}px`;break;case "top-right":n.top=`${a[1]}px`,n.right=`${a[0]}px`;break;case "right":n.top="50%",n.right=`${a[0]}px`,n.transform=`translateY(calc(-50% + ${a[1]}px))`;break;case "bottom-right":n.bottom=`${a[1]}px`,n.right=`${a[0]}px`;break;case "bottom":n.bottom=`${a[1]}px`,n.left="50%",n.transform=`translateX(calc(-50% + ${a[0]}px))`;break;case "bottom-left":n.bottom=`${a[1]}px`,n.left=`${a[0]}px`;break;case "left":n.top="50%",n.left=`${a[0]}px`,n.transform=`translateY(calc(-50% + ${a[1]}px))`;break}}_resolveModalRoute(e){return e.route?typeof e.route=="string"?this.routes.match(e.route)?.route||null:e.route:null}_updateModalURL(e){}_restoreModalURL(){}};var Ut=class{};var Kr="routes.json",Jr=10,qt=class{constructor(e){this.root=Ot();this._pendingCount=0;this._responseCache=new Map;this.router=e;}async load(){let e=this.router.options.routes||[],r=await(async a=>(typeof a=="function"?a=await a():typeof a=="string"&&(a=await fetch(a).then(n=>n.json())),Array.isArray(a)?a:[a]))(e);this.root=Ot(r),this._markPending(this.root,"/"),this._applyRouteOptions(this.root),this.router.emit("routes:loaded",void 0),this._expansion=this._expandAll();}hasPending(){return this._pendingCount>0}async whenExpanded(e){let t=this._expansion?.catch(()=>{});if(t){if(!e||e<=0){await t;return}await Promise.race([t,new Promise(r=>setTimeout(r,e))]);}}match(e){return J(e,this.root)||null}_markPending(e,t){let r=e.path&&e.path!=="/"?M(t,e.path):t;(typeof e.children=="string"||e.children===true)&&(e._childrenSource=e.children,e.children=[],e._childrenState="pending",this._pendingCount++),Array.isArray(e.children)&&e.children.forEach(a=>this._markPending(a,r));}_collectPending(e,t,r=[]){let a=e.path&&e.path!=="/"?M(t,e.path):t;return e._childrenState==="pending"&&r.push({item:e,path:a}),Array.isArray(e.children)&&e.children.forEach(n=>this._collectPending(n,a,r)),r}async _expandAll(){let e=this.router.options.maxChildrenDepth??Jr,t=this._collectPending(this.root,"/"),r=0;for(;t.length>0&&r<e;){r++;let a=[];await Promise.all(t.map(async n=>{let i=await this._expandNode(n);a.push(...i);})),t=a;}if(t.length>0){let a=new Error(`[AutoSparkRouter] \u8FDC\u7A0B\u5B50\u8868\u5C55\u5F00\u8D85\u51FA\u6700\u5927\u6DF1\u5EA6 ${e}\uFF0C\u6B8B\u4F59 ${t.length} \u4E2A\u8282\u70B9\u5DF2\u964D\u7EA7`);t.forEach(n=>{this.router.logger.warn(a.message),this._degrade(n.item,a);});}this.router.emit("routes:expanded",void 0);}async _expandNode(e){let{item:t,path:r}=e,a=Ue(t._childrenSource,{path:r,name:t.name,meta:t.meta,routesFile:this.router.options.routesFile??Kr},this.router.options.base);try{let n=await this._fetchChildren(a,t),i=this._toRouteItems(n,a),s=Ot(i),l=Array.isArray(s.children)?s.children:[];l.forEach(c=>this._applyRouteOptions(c)),t.children=l,this._settle(t,"ok");let u=[];return l.forEach(c=>{this._markPending(c,r),this._collectPending(c,r,u);}),u}catch(n){return this._degrade(t,n instanceof Error?n:new Error(String(n)),a),[]}}_fetchChildren(e,t){let r=this._responseCache.get(e);if(r)return r;let a=t.timeout??this.router.options.routeOptions?.timeout??0,n=new AbortController,i=a>0?setTimeout(()=>n.abort(new Error(`Timeout when load ${e}`)),a):null,s=fetch(e,{signal:n.signal}).then(async l=>{if(!l.ok)throw new Error(`Fail when load ${e} : ${l.statusText}`);return await l.json()}).finally(()=>{i&&clearTimeout(i);});return this._responseCache.set(e,s),s}_toRouteItems(e,t){if(Array.isArray(e))return e;if(e&&typeof e=="object")return [e];throw new Error(`[AutoSparkRouter] \u8FDC\u7A0B\u5B50\u8868 ${t} \u8FD4\u56DE\u7684\u4E0D\u662F\u8DEF\u7531\u9879\u58F0\u660E`)}_settle(e,t){e._childrenState==="pending"&&this._pendingCount--,e._childrenState=t;}_degrade(e,t,r){e.children=[],this._settle(e,"error"),this.router.emit("routes:error",{url:r,path:e.path,error:t});}_applyRouteOptions(e){let t=["keepAlive","cache","timeout","preload"],r=a=>{if(a.name&&a.name.length>0&&(this.namedRouteItems||(this.namedRouteItems=new Map),this.namedRouteItems.set(a.name,new WeakRef(a))),this.router.options.routeOptions){let n=this.router.options.routeOptions;t.forEach(i=>{a[i]===void 0&&n[i]!==void 0&&(a[i]=n[i]);});}Array.isArray(a.children)&&a.children.forEach(r);};r(e);}forEach(e){function t(r,a){e(r,a),Array.isArray(r.children)&&r.children.forEach(n=>t(n,r));}t(this.root,null);}};var Bt=class extends mt{};function ge(o){if(typeof o!="object"||o===null)return  false;var e=Object.getPrototypeOf(o);if(e===null)return  true;for(var t=e;Object.getPrototypeOf(t)!==null;)t=Object.getPrototypeOf(t);return e===t}var Wt=class{constructor(e,t,r){this.cache=new Map;this.router=e,this.loadType=t,this.options=Object.assign({timeout:0,cache:0,hash:"{url}",datatype:"json"},r),this._signalKey=`_get${t.charAt(0).toUpperCase()+t.slice(1)}`,this._optionsKey=`_${t}Options`,this._optionKey=t;}getSignal(e){return e.route[this._signalKey]}createSignal(e,t){let r=this.getSignal(e);r&&r.abort();let a=D();return e.route[this._signalKey]=a,a.meta.hash=this._getHash(e,t),a}_removeSignal(e){e.route&&delete e.route[this._signalKey];}getRouteOptions(e){return e.route[this._optionsKey]||(e.route[this._optionsKey]=this._mergeRouteOptions(e)),e.route[this._optionsKey]}isOptionsObject(e){return typeof e=="object"&&e!==null&&"from"in e}loadRoutes(e,t,r=0){return Promise.allSettled(e.map((a,n)=>{if(!(n<r&&this.loadStateOf(a)==="ok"))return this.loadRoute(a,t)}))}get loadStateKey(){return `_${this._optionKey}LoadState`}loadStateOf(e){if(e.route)return e.route[this.loadStateKey]}setLoadState(e,t){e.route&&(e.route[this.loadStateKey]=t);}_createErrorSignal(e,t,r){let a=this.createSignal(e,r);this.onLoadError(e,t,a,r);}_createSuccessSignal(e,t,r){let a=this.createSignal(e,r);this.onLoadSuccess(e,t,a,r);}async loadRoute(e,t){if(!e.route?.[this._optionKey])return;let r=this.getRouteOptions(e),a;try{if(this.hitCache(e,r))return;if(this.isValidData(r.from)&&!Z(r.from)){this._createSuccessSignal(e,r.from,r);return}if(t?.aborted)return;a=this.createSignal(e,r);let n,i;if(Z(r.from))i=r.from,a.meta.url=i,n=this._loadFromRemote(i,a,e,r,t);else if(r.from===!0)if(i=this.getAutoUrl(e),i)a.meta.url=i,n=this._loadFromRemote(i,a,e,r,t);else {this._removeSignal(e);return}else st(r.from)&&(n=r.from(e));if(n==null){this._removeSignal(e);return}Promise.resolve(n).then(s=>this.onLoadSuccess(e,s,a,r)).catch(s=>this.onLoadError(e,s,a,r));}catch(n){n.name!=="AbortError"&&this._createErrorSignal(e,n,r);}}_isCacheExpired(e,t){if(!e)return  true;let r=t.cache||0;return r<=0?true:Date.now()-e.timestamp>r}hitCache(e,t){let r=this._getHash(e,t),a=this.cache.get(r);return (t.cache||0)>0&&a&&!this._isCacheExpired(a,t)?(this._createSuccessSignal(e,a.value,t),true):((t.cache||0)>0&&this.cache.has(r)&&this.cache.delete(r),false)}_getHash(e,t){return t.hash?V(t.hash,e):V("{url}",e)}getAutoUrl(e){}isValidData(e){return  true}prepareFetchUrl(e,t){return e}_loadFromRemote(e,t,r,a,n){let i=j(this.prepareFetchUrl(e,r).params(z(r)),this.router.options.base),{timeout:s=0}=a,l=new AbortController,u=t.getAbortSignal(),c=null,d=()=>{c&&(clearTimeout(c),c=null),u&&u.removeEventListener("abort",f);},f=()=>{l.abort();};u&&u.addEventListener("abort",f),s>0&&(c=setTimeout(()=>{l.isTimeout=true,l.abort();},s));let v=[l.signal];u&&v.push(u),n&&v.push(n);let h=typeof AbortSignal.any=="function"?AbortSignal.any(v):v[0];try{return fetch(i,{signal:h}).then(async R=>{if(!R.ok)throw new H(`Fail when load ${i} : ${R.statusText}`,R.status);return await this.onResponse(R,r,{signal:h,hash:t.meta.hash,url:i})}).catch(R=>{throw R instanceof DOMException&&R.name==="AbortError"&&l.isTimeout?new xt:R}).finally(()=>{d();})}catch(R){return d(),Promise.reject(R)}}isCacheEnable(e){return (e.cache||0)>0}onLoadSuccess(e,t,r,a){try{if(this.isCacheEnable(a)){let n=this._getHash(e,a);this.cache.set(n,{value:t,timestamp:Date.now()});}t.error&&t.error instanceof Error?(this.setLoadState(e,"error"),r.reject(new H(t.error.message))):(this.setLoadState(e,"ok"),r.resolve(t));}catch(n){this.setLoadState(e,"error"),r.reject(n);}}onLoadError(e,t,r,a){if(t.name==="AbortError")r.resolve(void 0);else {this.setLoadState(e,"error"),r.meta.statusCode=t.status||500;let n=this._getHash(e,a);this.cache.delete(n),r.reject(t);}}_mergeRouteOptions(e){let t=e.route[this._optionKey]||{},r=ge(t)&&"from"in t;return {...this.options,...r?t:{from:t}}}cleanup(){this.cache.clear();}};var P=class{constructor(e){this.router=e;}test(e,t){return  true}render(e,t,r){return Promise.resolve({value:"",hash:r.hash})}};var zt="x-outlet",ye="x-component:autospark.outlet";function ut(o){o.querySelectorAll(`[${zt}]`).forEach(t=>{let r=t.getAttribute(zt);t.removeAttribute(zt),t.hasAttribute(ye)||t.setAttribute(ye,r??"");});}var Q=class extends P{test(e,t){return  true}async render(e,t,r){let a=await e.text(),{selector:n}=r,i={value:a.trim()};try{let s=new DOMParser().parseFromString(a,"text/html");if(ut(s),i.value=s.body.innerHTML.trim(),typeof n=="string"&&n.length>0)try{let l=s.querySelector(n.params({...t.params,...t.query,...t.state}));l&&(i.value=l.innerHTML);}catch(l){this.router.logger.warn(`Invalid selector: ${n}, ${l.message}`);}}catch(s){this.router.logger.error(`\u89C6\u56FE\u5185\u5BB9\u63D0\u53D6\u5931\u8D25: ${s.message}`);}return i}};function ct(o){return o.startsWith("!")}function or(o){return ct(o)?o.slice(1):o}function $(o){let e=o.route;if(!e)return;let t=e._viewOptions?.from??e.view;if(typeof t=="string")return t;if(t&&typeof t=="object"&&typeof t.from=="string")return t.from}var dt=class extends P{test(e,t){return ct($(t)??"")}async render(e,t,r){return {value:await e.text(),meta:{raw:true}}}};var Kt=class extends Wt{constructor(t){super(t,"view",Object.assign({},t.options.viewOptions));this.renderers=[];this.renderers=t.options.renderers||[],this.defaultRenderer=new Q(t),this._rawRenderer=new dt(t);}async loadViews(t,r,a=0){return this.loadRoutes(t,r,a)}prepareFetchUrl(t,r){return or(t)}selectRenderer(t,r,a){if(ct($(r)??""))return this._rawRenderer;let n=r.route?._viewOptions?.renderer;if(n)return n;for(let i of this.renderers)try{if(i&&i.test(t,r))return i}catch{}return this.defaultRenderer}async onResponse(t,r,a){let n=this.selectRenderer(t,r,a),i=[n];n instanceof Q||i.push(this.defaultRenderer),i.includes(this._rawRenderer)||i.push(this._rawRenderer);let s=[];for(let c=0;c<i.length-1;c++)try{s.push(t.clone());}catch(d){this.router.logger.warn("{} -> \u54CD\u5E94\u4F53\u4E0D\u53EF\u514B\u9686\uFF0C\u6E32\u67D3\u964D\u7EA7\u94FE\u53EF\u80FD\u4E0D\u53EF\u7528: {}",r.id,d?.message??d);break}let l=t,u=new Error("\u89C6\u56FE\u6E32\u67D3\u5931\u8D25");for(let c=0;c<i.length;c++){let d=i[c];try{let f=await d.render(l,r,a);if(!f.error)return {value:f.value,meta:f.meta};u=f.error,this.router.logger.warn("{} -> \u6E32\u67D3\u5668 {} \u52A0\u5DE5\u5931\u8D25\uFF08{}\uFF09\uFF0C\u964D\u7EA7\u4E0B\u4E00\u6E32\u67D3\u5668",r.id,d.constructor.name,f.error.message);}catch(f){u=f instanceof Error?f:new Error(String(f)),this.router.logger.warn("{} -> \u6E32\u67D3\u5668 {} \u6267\u884C\u5F02\u5E38\uFF08{}\uFF09\uFF0C\u964D\u7EA7\u4E0B\u4E00\u6E32\u67D3\u5668",r.id,d.constructor.name,u.message);}l=s[c]??l;}return {error:u}}};var Jt="data-autospark-seo";function nr(o){return typeof o=="boolean"?o:typeof o=="string"?o!=="false"&&o!=="0":!!o}function ir(o){let e={};if(Array.isArray(o))for(let t of o)t&&typeof t=="object"&&t.property&&(e[String(t.property)]=String(t.content??""));else if(o&&typeof o=="object")for(let t of Object.keys(o)){let r=o[t];r!=null&&(e[t.includes(":")?t:`og:${t}`]=String(r));}return e}function ar(o){if(!(o===null||o===""))try{return JSON.parse(o)}catch{return}}function be(o,e){let t={...o};return e&&(e.title!==void 0&&(t.title=e.title),e.description!==void 0&&(t.description=e.description),e.canonical!==void 0&&(t.canonical=e.canonical),e.robots!==void 0&&(t.robots=e.robots),e.jsonLd!==void 0&&(t.jsonLd=e.jsonLd),e.seo!==void 0&&(t.seo=e.seo),e.og!==void 0&&(t.og={...o.og??{},...e.og})),t}function Xr(o){let e={};return typeof o.title=="string"&&o.title!==""&&(e.title=o.title),typeof o.description=="string"&&(e.description=o.description),typeof o.canonical=="string"&&(e.canonical=o.canonical),typeof o.robots=="string"&&(e.robots=o.robots),o.og!==void 0&&o.og!==null&&(e.og=ir(o.og)),o.jsonLd!==void 0&&o.jsonLd!==null&&(e.jsonLd=o.jsonLd),o.seo!==void 0&&o.seo!==null&&(e.seo=nr(o.seo)),e}function Yr(o){let e={};for(let t of o){let r=t.route;r&&(r.title&&(e.title=r.title),r.meta&&typeof r.meta=="object"&&(e=be(e,Xr(r.meta))));}return e}function Gr(o,e,t){let r=o;for(;r&&r!==t;){let a=r.getAttribute?.("data-view-hash");if(a!=null)return a===e;r=r.parentElement;}return  false}function Zr(o){let e={},t=o.getAttribute("title");t&&(e.title=t);let r=o.getAttribute("description");r!==null&&(e.description=r);let a=o.getAttribute("canonical");a!==null&&(e.canonical=a);let n=o.getAttribute("robots");n!==null&&(e.robots=n);let i=o.getAttribute("seo");i!==null&&(e.seo=nr(i));let s=ar(o.getAttribute("og"));s!==void 0&&(e.og=ir(s));let l=ar(o.getAttribute("jsonld")??o.getAttribute("json-ld"));return l!==void 0&&(e.jsonLd=l),e}function Qr(o,e){let t=o.host;if(!t||!t.querySelectorAll)return null;let r=t.querySelectorAll("autospark-view-meta");if(!r.length)return null;let a=false,n={};for(let i of e)if(i.hash)for(let s of Array.from(r))Gr(s,i.hash,t)&&(a=true,n=be(n,Zr(s)));return a?n:null}function ke(o,e,t,r){for(let a of Array.from(o.querySelectorAll(e)))if(a.getAttribute(t)===r)return a;return null}function to(o){for(let e of Array.from(o.querySelectorAll("link"))){let t=e.getAttribute("rel");if(t&&t.split(/\s+/).includes("canonical"))return e}return null}function eo(o,e){return !e||/^[a-z][a-z0-9+.-]*:/i.test(o)||o.startsWith("//")?o:e.replace(/\/+$/,"")+(o.startsWith("/")?o:`/${o}`)}var Xt=class{_headEnabled(){return this.options.head!==false}_headConfig(){let e=this.options.head;return e===false||e===void 0?void 0:e}_headAttach(){this._headEnabled()&&(this._headSeedTitle=typeof document<"u"?document.title:"",this._headTags=[],this._headTitleApplied=false,this._headRouteErrorHook=e=>{this._headRenderError=e.error;},this.hooks.add("routeError",this._headRouteErrorHook),this.mode==="hash"&&!this._headHashWarned&&(this._headHashWarned=true,this.logger.warn("SEO head \u7BA1\u7406\u5728 hash \u6A21\u5F0F\u4E0B\u80FD\u529B\u53D7\u9650\uFF1A`#` \u540E\u7684\u5B50\u8DEF\u7531\u5BF9\u641C\u7D22\u5F15\u64CE\u4E0D\u53EF\u89C1\uFF08\u5F31 JS \u722C\u866B\u66F4\u662F\u5B8C\u5168\u770B\u4E0D\u5230\uFF09\u3002\u9700\u8981 SEO \u8BF7\u4F7F\u7528 history \u6A21\u5F0F\u3002")));}_headDetach(){this._headEnabled()&&(this._headViewTimer!==void 0&&(clearTimeout(this._headViewTimer),this._headViewTimer=void 0),this._headRouteErrorHook&&(this.hooks.remove("routeError",this._headRouteErrorHook),this._headRouteErrorHook=void 0),this._headClearTags(),this._headRestoreTitle(),this._headSeedTitle=void 0,this._headRouteDecl=void 0,this._headRenderError=void 0);}_headBeginNavigation(){this._headRenderError=void 0;}_headApplyRoutePhase(e){if(!this._headEnabled())return;let t=Yr(e),r=e.some(n=>n.route===void 0),a=this._headRenderError!=null||e.some(n=>n.error!=null);(r||a)&&t.robots===void 0&&(t.robots="noindex, nofollow"),this._headRenderError=void 0,this._headRouteDecl=t,this._headWrite(t.seo===false?null:t);}_headScheduleViewPhase(e,t){this._headEnabled()&&(this._headViewTimer!==void 0&&clearTimeout(this._headViewTimer),this._headViewTimer=setTimeout(()=>{this._headViewTimer=void 0,this.currentNavVersion===t&&this._headApplyViewPhase(e);},0));}_headApplyViewPhase(e){if(!this._headEnabled())return;let t=this._headRouteDecl;if(!t||t.seo===false)return;let r=Qr(this,e);if(!r)return;let a=be(t,r);this._headWrite(a.seo===false?null:a);}_headRestoreTitle(){this._headTitleApplied&&this._headSeedTitle!==void 0&&(document.title=this._headSeedTitle),this._headTitleApplied=false;}_headClearTags(){let e=this._headTags??[];for(let t of e){if(t.created){t.el.parentNode?.removeChild(t.el);continue}let r=new Set;for(let a=0;a<t.el.attributes.length;a++)r.add(t.el.attributes[a].name);for(let a of r)t.original.some(([n])=>n===a)||t.el.removeAttribute(a);for(let[a,n]of t.original)n===null?t.el.removeAttribute(a):t.el.setAttribute(a,n);}this._headTags=[];}_headAdopt(e){let t=this._headTags??=[];if(t.some(a=>a.el===e))return;let r=[];for(let a=0;a<e.attributes.length;a++){let n=e.attributes[a];r.push([n.name,n.value]);}t.push({el:e,created:false,original:r});}_headCreate(e){let t=this._headTags??=[];t.some(r=>r.el===e)||t.push({el:e,created:true,original:[]});}_headSetMeta(e,t){let r=document.head;if(!r)return;let a=ke(r,"meta","name",e);a?this._headAdopt(a):(a=document.createElement("meta"),a.setAttribute("name",e),this._headCreate(a),r.appendChild(a)),a.setAttribute(Jt,""),a.setAttribute("content",t);}_headSetOg(e,t){let r=document.head;if(!r)return;let a=ke(r,"meta","property",e);a||(a=ke(r,"meta","name",e)),a?this._headAdopt(a):(a=document.createElement("meta"),a.setAttribute("property",e),this._headCreate(a),r.appendChild(a)),a.setAttribute(Jt,""),a.setAttribute("content",t),a.hasAttribute("property")||a.setAttribute("property",e);}_headSetCanonical(e){let t=document.head;if(!t)return;let r=to(t);r?this._headAdopt(r):(r=document.createElement("link"),r.setAttribute("rel","canonical"),this._headCreate(r),t.appendChild(r)),r.setAttribute(Jt,""),r.setAttribute("href",e);}_headSetJsonLd(e){let t=document.head;if(!t)return;let r=Array.isArray(e)?e:[e];for(let a of r){if(a==null)continue;let n;try{n=JSON.stringify(a);}catch{continue}if(typeof n!="string")continue;let i=document.createElement("script");i.setAttribute("type","application/ld+json"),i.setAttribute(Jt,""),i.textContent=n,this._headCreate(i),t.appendChild(i);}}_headFormatTitle(e){let t=this._headConfig()?.titleTemplate;return t?t.includes("%s")?t.replace("%s",e):`${e} - ${t}`:e}_headWrite(e){if(!(typeof document>"u")){if(this._headClearTags(),!e){this._headRestoreTitle();return}if(e.title?(document.title=this._headFormatTitle(e.title),this._headTitleApplied=true):this._headRestoreTitle(),e.description!==void 0&&this._headSetMeta("description",e.description),e.robots!==void 0&&this._headSetMeta("robots",e.robots),e.canonical!==void 0){let t=this._headConfig()?.siteUrl;this._headSetCanonical(eo(e.canonical,t));}if(e.og)for(let t of Object.keys(e.og))this._headSetOg(t,e.og[t]);e.jsonLd!==void 0&&this._headSetJsonLd(e.jsonLd);}}};function sr(){let o=window.location.pathname;if(o.endsWith(".html")||o.endsWith(".htm")){let e=o.lastIndexOf("/");return e===0?"/":o.substring(0,e+1)}return o.endsWith("/")?o:o.length>0&&o!=="/"?o+"/":"/"}function lr(){if(typeof document>"u"||!document.querySelector("base"))return null;try{let o=new URL(document.baseURI).pathname;return !o||o==="/"?"/":o.endsWith("/")?o:o+"/"}catch{return null}}function ur(o=10){let e=Math.random().toString(36).substring(2,o+2);return /^\d/.test(e)?e:"s"+e.substring(1)}function cr(o,e){if(typeof document>"u")return;let{id:t,mode:r="default",location:a="head"}=e||{},n=t||ur(),i=document.querySelector(`#${n}`);return !i||i.tagName!=="STYLE"?(i=document.createElement("style"),i.id=n,i.textContent=o,(a==="head"?document.head:a==="body"?document.body:a instanceof HTMLElement?a:document.head).appendChild(i),i):(r==="replace"?i.textContent=o:r==="append"&&(i.textContent+=o),i)}var tt="autospark.outlet",ro="autospark-outlet-styles",oo=`.autospark-outlet-tabs{display:flex;flex-wrap:wrap;align-items:flex-end;gap:var(--autospark-outlet-tab-gap,2px);padding:var(--autospark-outlet-tabs-padding,0 8px);border-bottom:1px solid var(--autospark-outlet-tab-border-color,#e5e6eb);background:var(--autospark-outlet-tabs-bg,transparent)}
.autospark-outlet-tab{display:inline-flex;align-items:center;gap:6px;padding:var(--autospark-outlet-tab-padding,6px 12px);font-size:var(--autospark-outlet-tab-font-size,13px);line-height:1.4;color:var(--autospark-outlet-tab-color,#4e5969);background:var(--autospark-outlet-tab-bg,transparent);border:1px solid transparent;border-bottom:none;border-radius:var(--autospark-outlet-tab-radius,6px 6px 0 0);cursor:pointer;user-select:none;position:relative;top:1px}
.autospark-outlet-tab:hover{color:var(--autospark-outlet-tab-hover-color,#1d2129);background:var(--autospark-outlet-tab-hover-bg,rgba(0,0,0,.04))}
.autospark-outlet-tab.is-active{color:var(--autospark-outlet-tab-active-color,#165dff);background:var(--autospark-outlet-tab-active-bg,#fff);border-color:var(--autospark-outlet-tab-border-color,#e5e6eb)}
.autospark-outlet-tab-close{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;font-size:12px;line-height:1;color:var(--autospark-outlet-tab-close-color,#86909c);cursor:pointer}
.autospark-outlet-tab-close:hover{color:var(--autospark-outlet-tab-close-hover-color,#1d2129);background:var(--autospark-outlet-tab-close-hover-bg,rgba(0,0,0,.08))}`,Yt=`<div x-define="${tt}" class="autospark-outlet" data-autospark-outlet :data-mode="mode">
    <script setup>
    {
        data: function () {
            return {
                views: [],
                ephemeral: { hash: "", html: "", ready: false, raw: false },
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
            <!-- raw \u89C6\u56FE\u8D70\u666E\u901A x-html \u76F4\u6302\uFF08\u4E0D\u7F16\u8BD1\uFF0CADR-0008\uFF09\uFF1B\u4E24\u8005 x-show \u4E92\u65A5 -->
            <div class="autospark-outlet-view-content" x-show="!view.raw" x-html.compile="view.html"></div>
            <div class="autospark-outlet-view-content" x-show="!!view.raw" x-html="view.html"></div>
        </div>
    </div>
    <div class="autospark-outlet-ephemeral" x-show="ephemeral.hash !== '' && active === ephemeral.hash" :data-view-hash="ephemeral.hash">
        <autospark-loading x-show="!ephemeral.ready"></autospark-loading>
        <div class="autospark-outlet-view-content" x-show="!ephemeral.raw" x-html.compile="ephemeral.html"></div>
        <div class="autospark-outlet-view-content" x-show="!!ephemeral.raw" x-html="ephemeral.html"></div>
    </div>
</div>`;function Gt(o){cr(oo,{id:ro}),!o.getComponentDeclaration(tt)&&o.registerComponent(Yt,{name:tt});}function ao(o){if(o.querySelector("[x-outlet], [x-component\\:autospark\\.outlet], [data-autospark-outlet]"))return;let e=document.createElement("div");e.setAttribute("x-outlet",""),o.appendChild(e);}function dr(o){let e=o.options.engine;if(e)return Gt(e),{engine:e,owned:false};let r=globalThis.AutoSparkSpaces?.AutoSpark;if(typeof r!="function")throw new Error("[AutoSparkRouter] \u672A\u627E\u5230 window.AutoSparkSpaces.AutoSpark\uFF1A\u8BF7\u5148\u52A0\u8F7D AutoSpark.js \u518D\u52A0\u8F7D @autospark/router\uFF0C\u6216\u7ECF options.engine \u6CE8\u5165\u5B9E\u4F8B");ao(o.host),ut(o.host);let a=new r(o.host,o.options.data??{},{components:{[tt]:Yt}});return Gt(a),{engine:a,owned:true}}function no(o){let e=[],t=0,r=/\{\}/g,a;for(;(a=r.exec(o))!==null;)a.index>t&&e.push(o.slice(t,a.index)),e.push({placeholder:true}),t=a.index+a[0].length;return t<o.length&&e.push(o.slice(t)),e}function pr(o){function e(t,r){return (a,...n)=>{if(!o.debug&&["debug","info"].includes(t))return;if(a instanceof Error){r(`[${t.toUpperCase()}] ${a.message}`,...n);return}let i=[];for(let c of n)if(typeof c=="function"){let d=c();Array.isArray(d)?i.push(...d):i.push(d);}else i.push(c);let s=no(a),l=[`[${t.toUpperCase()}]`],u=0;for(let c of s)if(typeof c=="object"&&c.placeholder){if(u<i.length){let d=i[u++];if(d==null||d==="")continue;l.push(d);}}else c&&l.push(c);for(;u<i.length;)l.push(i[u++]);r(...l);}}return {debug:e("debug",console.debug),info:e("info",console.info),warn:e("warn",console.warn),error:e("error",console.error)}}function Zt(o,e){if(!e)return o;if(!o)return "";let t=e.endsWith("/")?e.slice(0,-1):e,r=o.startsWith("/")?o:`/${o}`;if(r===t)return "/";if(r.startsWith(t+"/")){let a=r.slice(t.length);return a.startsWith("/")?a:`/${a}`}return r}var hr=(o,e)=>{let t=document.createElement("autospark-feedback");return t.type="error",t.message="404",t.description="\u9875\u9762\u672A\u627E\u5230\uFF0C\u8BF7\u68C0\u67E5 URL \u662F\u5426\u6B63\u786E",t.backable=true,t};var fr=(o,e)=>{let t=document.createElement("autospark-feedback");return t.type="error",t.message="500",t.description=o?.message||"\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF",t.retryable=true,t.backable=true,t};var mr=(o,e)=>{let t=o?.status||o?.statusCode||500,r=o?.message||"\u672A\u77E5\u9519\u8BEF",a=document.createElement("autospark-feedback");return a.type="error",a.message=String(t),a.description=r,a.retryable=true,a.backable=true,a};var gr={404:hr,500:fr,"*":mr};var Qt=class extends Ge(Pt,Nt,Dt,Ft,jt,Vt,Ut,Bt,Xt){constructor(t,r=[]){super();this._cleanups=[];this.isNavigating=false;this.attached=false;this.currentNavVersion=0;this.abortController=new AbortController;this._navAbortController=null;this._redirectDepth=0;this._lastViewSlot=null;this._lastMatched=null;this.modalContainer=null;this.modalState={stack:[],current:null};this.maxModals=10;if(this.host=typeof t=="string"?document.querySelector(t):t,!(this.host instanceof HTMLElement))throw new Error("[AutoSparkRouter] Host must be a valid HTMLElement");this.host.setAttribute("data-autospark-router",""),this.host.router=this,this.options=this._initOptions(r),this.attach();}get navSignal(){return this._navAbortController?.signal||new AbortController().signal}get engine(){return this._engineBinding?.engine}get mode(){return this.options.mode}get base(){return this.options.base}get debug(){return this.options.debug}get logger(){return this._logger||(this.options.logger?this._logger=this.options.logger:this._logger=pr(this.options)),this._logger}get location(){return this.history.location}get lastViewSlot(){return this._lastViewSlot}get lastMatched(){return this._lastMatched}get renderers(){return this.options.renderers}_initOptions(t=[]){return this.options=Object.assign({mode:"history",debug:false,home:"/",keeyAlive:true,data:{},errorPages:{},renderers:[],routeOptions:{},viewOptions:{},routesFile:"routes.json",maxChildrenDepth:10},t&&typeof t=="object"&&"routes"in t?t:{routes:t}),this.options.base===void 0&&(this.options.base=lr()??sr()),this.options.errorPages={...gr,...this.options.errorPages},this.options}_matchRoute(t,r,a){let n=this.routes.current,i=t+r,s=J(i,this.routes.root,{});return a&&s.forEach(l=>{l.state=a;}),{fromRoute:n,toRoute:s}}_hasRealMatch(t){return t.slice(1).some(r=>r.route!==void 0)}async _matchRouteAfterExpansion(t,r,a,n){let i=this._matchRoute(t,r,a);return this._hasRealMatch(i.toRoute)||!this.routes.hasPending()?i:(await this.routes.whenExpanded(n??this.options.routeOptions?.timeout),this._matchRoute(t,r,a))}async onRouteUpdate(t){this.isNavigating=true,this._headBeginNavigation(),this.emit("navigation:start",t);let r=t.location.pathname,a=t.location.search;this._lastViewSlot=null;let n=await this._matchRouteAfterExpansion(Zt(r,this.options.base),a,t.location.state);this.emit("navigation:matched",n);let i=n.toRoute,s=i.length>0?i[i.length-1].url:"";if(this._currentNavUrl===s){this.logger.debug("\u5FFD\u7565\u91CD\u590D\u5BFC\u822A: {}",s),this.emit("navigation:cancel",t);return}this._currentNavUrl=s,++this.currentNavVersion;let l=this.currentNavVersion;this._navAbortController&&(this.logger.debug("\u4E2D\u6B62\u4E4B\u524D\u7684\u5BFC\u822A\u64CD\u4F5C"),this._navAbortController.abort()),this._navAbortController=new AbortController;let u=this._navAbortController.signal,c;try{if(u.aborted){this.logger.debug("\u5BFC\u822A\u5728\u8DEF\u7531\u5339\u914D\u540E\u88AB\u4E2D\u6B62");return}this.emit("navigation:matched",n),c=n.fromRoute,this.logger.debug("{} -> \u5BFC\u822A\u5230: {} {}, \u5339\u914D: {} ",()=>[i[0].id,r,a,i]);let d=await this.hooks.runBeforeRoute({from:c,to:i});if(u.aborted){this.logger.debug("\u5BFC\u822A\u5728\u5B88\u536B\u6267\u884C\u540E\u88AB\u4E2D\u6B62");return}if(typeof d=="string"){if(++this._redirectDepth>10){this._redirectDepth=0,this.logger.error("beforeRoute \u5B88\u536B\u6539\u9053\u8D85\u8FC7 10 \u6B21\uFF0C\u7591\u4F3C\u5FAA\u73AF\uFF0C\u5DF2\u53D6\u6D88\u5BFC\u822A"),this.emit("navigation:cancel",t);return}this.logger.debug("beforeRoute \u5B88\u536B\u8FD4\u56DE\u8DEF\u5F84\uFF0C\u6539\u9053: {}",d),this.replace(d);return}if(this._redirectDepth=0,!d){this.logger.debug("beforeEach \u5B88\u536B\u8FD4\u56DE false\uFF0C\u53D6\u6D88\u5BFC\u822A"),this.emit("navigation:cancel",t);return}let f=this._getCommonRouteIndex(c,i);this.dataLoader.loadDatas(i,u,f),this.viewLoader.loadViews(i,u,f),await this._renderRoutes(i,c,u),l===this.currentNavVersion&&!u.aborted&&(this._headApplyRoutePhase(i),this._headScheduleViewPhase(i,l));}finally{l===this.currentNavVersion&&(this.isNavigating=false,this._currentNavUrl=void 0,this._navAbortController&&(this._navAbortController=null)),this.hooks.runAfterRoute({to:i}),this.routes.current=i,this.isNavigating=false,this.emit("navigation:end",t);}}_attachLinkDelegation(){let t=r=>this._handleDocumentLinkClick(r);return document.addEventListener("click",t),()=>document.removeEventListener("click",t)}_handleDocumentLinkClick(t){if(t.defaultPrevented)return;let r=this._findLinkFromEvent(t);if(r){r.handleClick(t);return}this._handlePlainAnchorClick(t);}_findLinkFromEvent(t){if(typeof t.composedPath=="function")for(let n of t.composedPath()){if(n instanceof U)return n;if(n===this.host||n===document)break}let a=t.target?.closest?.("auto-link");return a instanceof U?a:void 0}_findAnchorFromEvent(t){let r;if(typeof t.composedPath=="function")for(let a of t.composedPath()){if(a instanceof HTMLAnchorElement){r=a;break}if(a===this.host||a===document)break}if(!r){let n=t.target?.closest?.("a");n instanceof HTMLAnchorElement&&(r=n);}if(!(!r||!this.host.contains(r)))return r}_handlePlainAnchorClick(t){let r=this._findAnchorFromEvent(t);if(!r||r.closest("auto-link")||t.metaKey||t.ctrlKey||t.shiftKey||t.altKey||t.button!==0)return;let a=r.getAttribute("target");if(a&&a!=="_self"||r.hasAttribute("download")||(r.getAttribute("rel")??"").split(/\s+/).includes("external"))return;let i=r.getAttribute("href");if(!i||i.startsWith("#"))return;if(te(i)){t.preventDefault();return}let s;try{s=new URL(i,window.location.href);}catch{return}s.protocol!=="http:"&&s.protocol!=="https:"||s.origin===window.location.origin&&(t.preventDefault(),this.push(Zt(s.pathname,this.options.base)+s.search+s.hash));}async isStopNavigating(){if(this.isNavigating)return new Promise(t=>{let r=null,a=this.once("navigation:cancel",()=>{r?.(),t();});r=this.once("navigation:end",()=>{a(),t();});})}_ensureAttached(){if(!this.attached)throw new Error("[AutoSparkRouter] Cannot navigate: router is not attached to a host element. Call attach() first.")}handleGuardFailure(t){if(t.length>1){let r=t[t.length-2].route;this.replace(r.path);}else this.replace("/");}push(t,r){if(this._ensureAttached(),this._pendingNavigationType="push",t.startsWith("!")){let a=t.slice(1);this.openModal({route:a});return}r!==void 0?this.history.push(t,r):this.history.push(t);}replace(t,r){this._ensureAttached(),this._pendingNavigationType="replace",r!==void 0?this.history.replace(t,r):this.history.replace(t);}home(){this._ensureAttached();let t=M(this.options.base||"",this.options.home||"/");this.replace(t);}back(){if(this._ensureAttached(),this._pendingNavigationType="pop",this.modalState.stack.length>0){this.closeTopModal();return}this.history.back();}forward(){this._ensureAttached(),this._pendingNavigationType="pop",this.history.forward();}go(t){this._ensureAttached(),this._pendingNavigationType="pop",this.history.go(t);}attach(){if(this.attached)throw new Error("Already attached to a host element");this.history=this.mode==="hash"?At():Ie(),this.routes=new qt(this),this.hooks=new Ht(this),this._headAttach(),this.routes.load().then(async()=>{this.viewLoader=new Kt(this),this.dataLoader=new It(this),this._cleanups.push(this.history.listen(this.onRouteUpdate.bind(this))),this._cleanups.push(this._attachLinkDelegation()),this.attachContextProvider(),this._engineBinding=dr(this),this._ensureDefaultOutlet(),this.attached=true,this.emit("routes:attached",void 0);let t=this.history.location.pathname,r=Zt(t,this.options.base),a=t.endsWith(".html")||t.endsWith(".htm");if(r===""||r==="/")this.home();else {let n=await this._matchRouteAfterExpansion(r,this.history.location.search);this._hasRealMatch(n.toRoute)?this.replace(t):a?this.home():this.replace(t);}}).catch(t=>{this.logger.error("\u8DEF\u7531\u8868\u52A0\u8F7D\u5931\u8D25:{}",t);});}detach(){this.attached&&(this._headDetach(),this._cleanups.forEach(t=>t()),this._cleanups=[],this.viewLoader.cleanup(),this.dataLoader.cleanup(),this._engineBinding?.owned&&this._engineBinding.engine.destroy(),this._engineBinding=void 0,this.abortController.abort(),this.removeContextProvider(),this.host instanceof HTMLElement&&(this.host.removeAttribute("data-autospark-router"),delete this.host.router),this.attached=false);}};var io=[".json"],ve=class extends P{test(e,t){let r=$(t);if(!r)return  false;let a=r.split("?")[0].split("#")[0].toLowerCase();return io.some(n=>a.endsWith(n))}async render(e,t,r){let a=await e.text(),n;try{n=JSON.parse(a);}catch(l){return {value:a,error:new Error(`JSON \u89C6\u56FE\u89E3\u6790\u5931\u8D25: ${l.message}`)}}return {value:`<pre class="autospark-json-view">${JSON.stringify(n,null,2).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>`}}};var yr=[".png",".jpg",".jpeg",".gif",".webp",".svg",".bmp",".ico",".avif"],Re=class extends P{test(e,t){let r=$(t);if(!r)return  false;let a=r.split("?")[0].split("#")[0].toLowerCase();return yr.some(n=>a.endsWith(n))}async render(e,t,r){return {value:`<img class="autospark-image-view" src="${(r.url||e.url).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}" alt="">`}}};function ss(o,e){return new Qt(o,e)}exports.AutoSparkFeedback=ft;exports.AutoSparkImageViewRenderer=Re;exports.AutoSparkJsonViewRenderer=ve;exports.AutoSparkLink=U;exports.AutoSparkLoading=ht;exports.AutoSparkRawViewRenderer=dt;exports.AutoSparkRouter=Qt;exports.AutoSparkRouterElementBase=pt;exports.AutoSparkRouterViewRendererBase=P;exports.AutoSparkTemplateViewRenderer=Q;exports.AutoSparkViewMeta=oe;exports.EventEmitter=mt;exports.IMAGE_EXTENSIONS=yr;exports.OUTLET_COMPONENT_ATTR=ye;exports.OUTLET_COMPONENT_CODE=Yt;exports.OUTLET_COMPONENT_NAME=tt;exports.X_OUTLET_ATTR=zt;exports.compilePathPattern=Tr;exports.createHashHistoryFromLib=Xo;exports.createLogger=pr;exports.createRouteMatcher=_r;exports.createRouter=ss;exports.findOutlet=et;exports.generateRouteHash=Uo;exports.isDangerousProtocol=te;exports.isExternalLink=ne;exports.isInternalLink=Ae;exports.joinPath=M;exports.matchRoute=J;exports.normalizeHashPath=Jo;exports.normalizeRoutes=Ot;exports.params=q;exports.parsePathParams=fa;exports.prefixBaseUrl=j;exports.registerOutletComponent=Gt;exports.resolveChildrenUrl=Ue;exports.transformXOutlet=ut;return exports;})({});//# sourceMappingURL=index.global.js.map
//# sourceMappingURL=index.global.js.map