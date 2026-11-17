(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
var e=(e=>typeof require<`u`?require:typeof Proxy<`u`?new Proxy(e,{get:(e,t)=>(typeof require<`u`?require:e)[t]}):e)(function(e){if(typeof require<`u`)return require.apply(this,arguments);throw Error('Calling `require` for "'+e+"\" in an environment that doesn't expose the `require` function. See https://rolldown.rs/in-depth/bundling-cjs#require-external-modules for more details.")}),t=null;function n(){return globalThis.AutoSpark??t}function r(e){let t=n()?.[e];if(t==null)throw Error(`[autospark/components] autospark 运行时命名空间不可达或缺少成员 "${e}"——autospark 须先于本插件加载（或经 __AUTOSPARK_PLUGINS__ 预加载队列引导）`);return t}function i(){return r(`SCOPES_KEY`)}function a(){return r(`AutoSparkScope`)}function o(e){return r(`resolveAnimate`)(e)}function s(e){return r(`getOverlayContainer`)(e)}var c=`autospark.dialog`,l=`autospark.drawer`,u=`autospark.popover`,d=`autospark-dialog-mask`,f=`autospark.overlay`,p=[],m=null;function h(e){if(e.key!==`Escape`)return;let t=p[p.length-1];t&&t.requestClose(`esc`)}function g(e){p.includes(e)||(p.push(e),!m&&typeof document<`u`&&(m=h,document.addEventListener(`keydown`,m)))}function _(e){let t=p.indexOf(e);t>=0&&p.splice(t,1),p.length===0&&m&&(document.removeEventListener(`keydown`,m),m=null)}function v(e){return e.hasAttribute(`data-autospark`)?null:e.parentElement}function y(e,t){if(!e||t==null)return e??null;let n=t.trim();if(!n||n===`.`||n===`./`)return e;try{if(n.startsWith(`^`)){let t=e,r=n.slice(1);for(;r.startsWith(`../`);)r=r.slice(3),t=v(t)??t;if(!r)return null;let i=t;for(;i;){if(i.matches(r))return i;i=v(i)}return null}if(n.startsWith(`/`)){let e=n.slice(1);return e?document.querySelector(e):null}let t=e,r=n;for(;r.startsWith(`../`);)r=r.slice(3),t=v(t)??t;return r?t.querySelector(r):null}catch{return null}}var b=[`top`,`right`,`bottom`,`left`],x=[`start`,`end`],S=b.reduce((e,t)=>e.concat(t,t+`-`+x[0],t+`-`+x[1]),[]),C=Math.min,w=Math.max,T=Math.round,E=Math.floor,D=e=>({x:e,y:e}),ee={left:`right`,right:`left`,bottom:`top`,top:`bottom`};function te(e,t,n){return w(e,C(t,n))}function O(e,t){return typeof e==`function`?e(t):e}function k(e){return e.split(`-`)[0]}function A(e){return e.split(`-`)[1]}function j(e){return e===`x`?`y`:`x`}function ne(e){return e===`y`?`height`:`width`}function M(e){let t=e[0];return t===`t`||t===`b`?`y`:`x`}function re(e){return j(M(e))}function N(e,t,n){n===void 0&&(n=!1);let r=A(e),i=re(e),a=ne(i),o=i===`x`?r===(n?`end`:`start`)?`right`:`left`:r===`start`?`bottom`:`top`;return t.reference[a]>t.floating[a]&&(o=fe(o)),[o,fe(o)]}function ie(e){let t=fe(e);return[ae(e),t,ae(t)]}function ae(e){return e.includes(`start`)?e.replace(`start`,`end`):e.replace(`end`,`start`)}var oe=[`left`,`right`],se=[`right`,`left`],ce=[`top`,`bottom`],le=[`bottom`,`top`];function ue(e,t,n){switch(e){case`top`:case`bottom`:return n?t?se:oe:t?oe:se;case`left`:case`right`:return t?ce:le;default:return[]}}function de(e,t,n,r){let i=A(e),a=ue(k(e),n===`start`,r);return i&&(a=a.map(e=>e+`-`+i),t&&(a=a.concat(a.map(ae)))),a}function fe(e){let t=k(e);return ee[t]+e.slice(t.length)}function pe(e){return{top:e.top??0,right:e.right??0,bottom:e.bottom??0,left:e.left??0}}function me(e){return typeof e==`number`?{top:e,right:e,bottom:e,left:e}:pe(e)}function he(e){let{x:t,y:n,width:r,height:i}=e;return{width:r,height:i,top:n,left:t,right:t+r,bottom:n+i,x:t,y:n}}function ge(e,t,n){let{reference:r,floating:i}=e,a=M(t),o=re(t),s=ne(o),c=k(t),l=a===`y`,u=r.x+r.width/2-i.width/2,d=r.y+r.height/2-i.height/2,f=r[s]/2-i[s]/2,p;switch(c){case`top`:p={x:u,y:r.y-i.height};break;case`bottom`:p={x:u,y:r.y+r.height};break;case`right`:p={x:r.x+r.width,y:d};break;case`left`:p={x:r.x-i.width,y:d};break;default:p={x:r.x,y:r.y}}let m=A(t);return m&&(p[o]+=f*(m===`end`?1:-1)*(n&&l?-1:1)),p}async function _e(e,t){t===void 0&&(t={});let{x:n,y:r,platform:i,rects:a,elements:o,strategy:s}=e,{boundary:c=`clippingAncestors`,rootBoundary:l=`viewport`,elementContext:u=`floating`,altBoundary:d=!1,padding:f=0}=O(t,e),p=me(f),m=o[d?u===`floating`?`reference`:`floating`:u],h=he(await i.getClippingRect({element:await(i.isElement==null?void 0:i.isElement(m))??!0?m:m.contextElement||await(i.getDocumentElement==null?void 0:i.getDocumentElement(o.floating)),boundary:c,rootBoundary:l,strategy:s})),g=u===`floating`?{x:n,y:r,width:a.floating.width,height:a.floating.height}:a.reference,_=await(i.getOffsetParent==null?void 0:i.getOffsetParent(o.floating)),v=await(i.isElement==null?void 0:i.isElement(_))&&await(i.getScale==null?void 0:i.getScale(_))||{x:1,y:1},y=he(i.convertOffsetParentRelativeRectToViewportRelativeRect?await i.convertOffsetParentRelativeRectToViewportRelativeRect({elements:o,rect:g,offsetParent:_,strategy:s}):g);return{top:(h.top-y.top+p.top)/v.y,bottom:(y.bottom-h.bottom+p.bottom)/v.y,left:(h.left-y.left+p.left)/v.x,right:(y.right-h.right+p.right)/v.x}}var ve=50,ye=async(e,t,n)=>{let{placement:r=`bottom`,strategy:i=`absolute`,middleware:a=[],platform:o}=n,s=o.detectOverflow?o:{...o,detectOverflow:_e},c=await(o.isRTL==null?void 0:o.isRTL(t)),l=await o.getElementRects({reference:e,floating:t,strategy:i}),{x:u,y:d}=ge(l,r,c),f=r,p=0,m={};for(let n=0;n<a.length;n++){let h=a[n];if(!h)continue;let{name:g,fn:_}=h,{x:v,y,data:b,reset:x}=await _({x:u,y:d,initialPlacement:r,placement:f,strategy:i,middlewareData:m,rects:l,platform:s,elements:{reference:e,floating:t}});u=v??u,d=y??d,m[g]={...m[g],...b},x&&p<ve&&(p++,typeof x==`object`&&(x.placement&&(f=x.placement),x.rects&&(l=x.rects===!0?await o.getElementRects({reference:e,floating:t,strategy:i}):x.rects),{x:u,y:d}=ge(l,f,c)),n=-1)}return{x:u,y:d,placement:f,strategy:i,middlewareData:m}},be=e=>({name:`arrow`,options:e,async fn(t){let{x:n,y:r,placement:i,rects:a,platform:o,elements:s,middlewareData:c}=t,{element:l,padding:u=0}=O(e,t)||{};if(l==null)return{};let d=me(u),f={x:n,y:r},p=re(i),m=ne(p),h=await o.getDimensions(l),g=p===`y`,_=g?`top`:`left`,v=g?`bottom`:`right`,y=g?`clientHeight`:`clientWidth`,b=a.reference[m]+a.reference[p]-f[p]-a.floating[m],x=f[p]-a.reference[p],S=await(o.getOffsetParent==null?void 0:o.getOffsetParent(l)),w=S?S[y]:0;w&&await(o.isElement==null?void 0:o.isElement(S))||(w=s.floating[y]||a.floating[m]);let T=b/2-x/2,E=w/2-h[m]/2-1,D=C(d[_],E),ee=C(d[v],E),k=w-h[m]-ee,j=w/2-h[m]/2+T,M=te(D,j,k),N=!c.arrow&&A(i)!=null&&j!==M&&a.reference[m]/2-(j<D?D:ee)-h[m]/2<0,ie=N?j<D?j-D:j-k:0;return{[p]:f[p]+ie,data:{[p]:M,centerOffset:j-M-ie,...N&&{alignmentOffset:ie}},reset:N}}});function xe(e,t,n){return(e?[...n.filter(t=>A(t)===e),...n.filter(t=>A(t)!==e)]:n.filter(e=>k(e)===e)).filter(n=>!e||A(n)===e||(t?ae(n)!==n:!1))}var Se=function(e){return e===void 0&&(e={}),{name:`autoPlacement`,options:e,async fn(t){let{rects:n,middlewareData:r,placement:i,platform:a,elements:o}=t,{crossAxis:s=!1,alignment:c,allowedPlacements:l=S,autoAlignment:u=!0,...d}=O(e,t),f=c!==void 0||l===S?xe(c||null,u,l):l,p=r.autoPlacement?.index||0,m=f[p];if(m==null)return{};if(i!==m)return{reset:{placement:f[0]}};let h=await a.detectOverflow(t,d),g=N(m,n,await(a.isRTL==null?void 0:a.isRTL(o.floating))),_=[h[k(m)],h[g[0]],h[g[1]]],v=[...r.autoPlacement?.overflows||[],{placement:m,overflows:_}],y=f[p+1];if(y)return{data:{index:p+1,overflows:v},reset:{placement:y}};let b=v.map(e=>{let t=A(e.placement);return[e.placement,t&&s?e.overflows.slice(0,2).reduce((e,t)=>e+t,0):e.overflows[0],e.overflows]}).sort((e,t)=>e[1]-t[1]),x=b.filter(e=>e[2].slice(0,A(e[0])?2:3).every(e=>e<=0))[0]?.[0]||b[0][0];return x===i?{}:{data:{index:p+1,overflows:v},reset:{placement:x}}}}},Ce=function(e){return e===void 0&&(e={}),{name:`flip`,options:e,async fn(t){var n;let{placement:r,middlewareData:i,rects:a,initialPlacement:o,platform:s,elements:c}=t,{mainAxis:l=!0,crossAxis:u=!0,fallbackPlacements:d,fallbackStrategy:f=`bestFit`,fallbackAxisSideDirection:p=`none`,flipAlignment:m=!0,...h}=O(e,t);if((n=i.arrow)!=null&&n.alignmentOffset)return{};let g=k(r),_=M(o),v=k(o)===o,y=await(s.isRTL==null?void 0:s.isRTL(c.floating)),b=d||(v||!m?[fe(o)]:ie(o)),x=p!==`none`;!d&&x&&b.push(...de(o,m,p,y));let S=[o,...b],C=await s.detectOverflow(t,h),w=[],T=i.flip?.overflows||[];if(l&&w.push(C[g]),u){let e=N(r,a,y);w.push(C[e[0]],C[e[1]])}if(T=[...T,{placement:r,overflows:w}],!w.every(e=>e<=0)){let e=(i.flip?.index||0)+1,t=S[e];if(t&&(u!==`alignment`||_===M(t)||T.every(e=>M(e.placement)!==_||e.overflows[0]>0)))return{data:{index:e,overflows:T},reset:{placement:t}};let n=T.filter(e=>e.overflows[0]<=0).sort((e,t)=>e.overflows[1]-t.overflows[1])[0]?.placement;if(!n)switch(f){case`bestFit`:{let e=T.filter(e=>{if(x){let t=M(e.placement);return t===_||t===`y`}return!0}).map(e=>[e.placement,e.overflows.filter(e=>e>0).reduce((e,t)=>e+t,0)]).sort((e,t)=>e[1]-t[1])[0]?.[0];e&&(n=e);break}case`initialPlacement`:n=o}if(r!==n)return{reset:{placement:n}}}return{}}}},we=new Set([`left`,`top`]);async function Te(e,t){let{placement:n,platform:r,elements:i}=e,a=await(r.isRTL==null?void 0:r.isRTL(i.floating)),o=k(n),s=A(n),c=M(n)===`y`,l=we.has(o)?-1:1,u=a&&c?-1:1,d=O(t,e),{mainAxis:f,crossAxis:p,alignmentAxis:m}=typeof d==`number`?{mainAxis:d,crossAxis:0,alignmentAxis:null}:{mainAxis:d.mainAxis||0,crossAxis:d.crossAxis||0,alignmentAxis:d.alignmentAxis};return s&&typeof m==`number`&&(p=s===`end`?m*-1:m),c?{x:p*u,y:f*l}:{x:f*l,y:p*u}}var Ee=function(e){return e===void 0&&(e=0),{name:`offset`,options:e,async fn(t){var n;let{x:r,y:i,placement:a,middlewareData:o}=t,s=await Te(t,e);return a===o.offset?.placement&&(n=o.arrow)!=null&&n.alignmentOffset?{}:{x:r+s.x,y:i+s.y,data:{...s,placement:a}}}}},De=function(e){return e===void 0&&(e={}),{name:`shift`,options:e,async fn(t){let{x:n,y:r,placement:i,platform:a}=t,{mainAxis:o=!0,crossAxis:s=!1,limiter:c={fn:e=>{let{x:t,y:n}=e;return{x:t,y:n}}},...l}=O(e,t),u={x:n,y:r},d=await a.detectOverflow(t,l),f=M(i),p=j(f),m=u[p],h=u[f],g=(e,t)=>te(t+d[e===`y`?`top`:`left`],t,t-d[e===`y`?`bottom`:`right`]);o&&(m=g(p,m)),s&&(h=g(f,h));let _=c.fn({...t,[p]:m,[f]:h});return{..._,data:{x:_.x-n,y:_.y-r,enabled:{[p]:o,[f]:s}}}}}};function Oe(){return typeof window<`u`}function P(e){return ke(e)?(e.nodeName||``).toLowerCase():`#document`}function F(e){var t;return(e==null||(t=e.ownerDocument)==null?void 0:t.defaultView)||window}function I(e){return((ke(e)?e.ownerDocument:e.document)||window.document)?.documentElement}function ke(e){return Oe()?e instanceof Node||e instanceof F(e).Node:!1}function L(e){return Oe()?e instanceof Element||e instanceof F(e).Element:!1}function R(e){return Oe()?e instanceof HTMLElement||e instanceof F(e).HTMLElement:!1}function Ae(e){return!Oe()||typeof ShadowRoot>`u`?!1:e instanceof ShadowRoot||e instanceof F(e).ShadowRoot}function je(e){let{overflow:t,overflowX:n,overflowY:r,display:i}=V(e);return/auto|scroll|overlay|hidden|clip/.test(t+r+n)&&i!==`inline`&&i!==`contents`}function Me(e){return/^(table|td|th)$/.test(P(e))}function Ne(e){try{if(e.matches(`:popover-open`))return!0}catch{}try{return e.matches(`:modal`)}catch{return!1}}var Pe=/transform|translate|scale|rotate|perspective|filter/,Fe=/paint|layout|strict|content/,z=e=>!!e&&e!==`none`,Ie;function Le(e){let t=L(e)?V(e):e;return z(t.transform)||z(t.translate)||z(t.scale)||z(t.rotate)||z(t.perspective)||!ze()&&(z(t.backdropFilter)||z(t.filter))||Pe.test(t.willChange||``)||Fe.test(t.contain||``)}function Re(e){let t=U(e);for(;R(t)&&!B(t);){if(Le(t))return t;if(Ne(t))return null;t=U(t)}return null}function ze(){return Ie??=typeof CSS<`u`&&CSS.supports&&CSS.supports(`-webkit-backdrop-filter`,`none`),Ie}function B(e){return/^(html|body|#document)$/.test(P(e))}function V(e){return F(e).getComputedStyle(e)}function H(e){return L(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function U(e){if(P(e)===`html`)return e;let t=e.assignedSlot||e.parentNode||Ae(e)&&e.host||I(e);return Ae(t)?t.host:t}function Be(e){let t=U(e);return B(t)?(e.ownerDocument||e).body:R(t)&&je(t)?t:Be(t)}function W(e,t,n){t===void 0&&(t=[]),n===void 0&&(n=!0);let r=Be(e),i=r===e.ownerDocument?.body,a=F(r);if(i){let e=Ve(a);return t.concat(a,a.visualViewport||[],je(r)?r:[],e&&n?W(e):[])}return t.concat(r,W(r,[],n))}function Ve(e){return e.parent&&Object.getPrototypeOf(e.parent)?e.frameElement:null}function He(e){let t=V(e),n=parseFloat(t.width)||0,r=parseFloat(t.height)||0,i=R(e),a=i?e.offsetWidth:n,o=i?e.offsetHeight:r,s=T(n)!==a||T(r)!==o;return s&&(n=a,r=o),{width:n,height:r,$:s}}function Ue(e){return L(e)?e:e.contextElement}function G(e){let t=Ue(e);if(!R(t))return D(1);let n=t.getBoundingClientRect(),{width:r,height:i,$:a}=He(t),o=(a?T(n.width):n.width)/r,s=(a?T(n.height):n.height)/i;return o&&Number.isFinite(o)||(o=1),s&&Number.isFinite(s)||(s=1),{x:o,y:s}}var We=D(0);function Ge(e){let t=F(e);return!ze()||!t.visualViewport?We:{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}}function Ke(e,t,n){return t===void 0&&(t=!1),!!n&&t&&n===F(e)}function K(e,t,n,r){t===void 0&&(t=!1),n===void 0&&(n=!1);let i=e.getBoundingClientRect(),a=Ue(e),o=D(1);t&&(r?L(r)&&(o=G(r)):o=G(e));let s=Ke(a,n,r)?Ge(a):D(0),c=(i.left+s.x)/o.x,l=(i.top+s.y)/o.y,u=i.width/o.x,d=i.height/o.y;if(a&&r){let e=F(a),t=L(r)?F(r):r,n=e,i=Ve(n);for(;i&&t!==n;){let e=G(i),t=i.getBoundingClientRect(),r=V(i),a=t.left+(i.clientLeft+parseFloat(r.paddingLeft))*e.x,o=t.top+(i.clientTop+parseFloat(r.paddingTop))*e.y;c*=e.x,l*=e.y,u*=e.x,d*=e.y,c+=a,l+=o,n=F(i),i=Ve(n)}}return he({width:u,height:d,x:c,y:l})}function qe(e,t){let n=H(e).scrollLeft;return t?t.left+n:K(I(e)).left+n}function Je(e,t){let n=e.getBoundingClientRect();return{x:n.left+t.scrollLeft-qe(e,n),y:n.top+t.scrollTop}}function Ye(e){let{elements:t,rect:n,offsetParent:r,strategy:i}=e,a=i===`fixed`,o=I(r),s=t?Ne(t.floating):!1;if(r===o||s&&a)return n;let c={scrollLeft:0,scrollTop:0},l=D(1),u=D(0),d=R(r);if((d||!a)&&((P(r)!==`body`||je(o))&&(c=H(r)),d)){let e=K(r);l=G(r),u.x=e.x+r.clientLeft,u.y=e.y+r.clientTop}let f=o&&!d&&!a?Je(o,c):D(0);return{width:n.width*l.x,height:n.height*l.y,x:n.x*l.x-c.scrollLeft*l.x+u.x+f.x,y:n.y*l.y-c.scrollTop*l.y+u.y+f.y}}function Xe(e){return e.getClientRects?Array.from(e.getClientRects()):[]}function Ze(e){let t=H(e),n=e.ownerDocument.body,r=w(e.scrollWidth,e.clientWidth,n.scrollWidth,n.clientWidth),i=w(e.scrollHeight,e.clientHeight,n.scrollHeight,n.clientHeight),a=-t.scrollLeft+qe(e),o=-t.scrollTop;return V(n).direction===`rtl`&&(a+=w(e.clientWidth,n.clientWidth)-r),{width:r,height:i,x:a,y:o}}var Qe=25;function $e(e,t,n){n===void 0&&(n=`viewport`);let r=n===`layoutViewport`,i=F(e),a=I(e),o=i.visualViewport,s=a.clientWidth,c=a.clientHeight,l=0,u=0;if(o){let e=!ze()||t===`fixed`;r?e||(l=-o.offsetLeft,u=-o.offsetTop):(s=o.width,c=o.height,e&&(l=o.offsetLeft,u=o.offsetTop))}if(qe(a)<=0){let e=a.ownerDocument,t=e.body,n=getComputedStyle(t),r=e.compatMode===`CSS1Compat`&&parseFloat(n.marginLeft)+parseFloat(n.marginRight)||0,i=Math.abs(a.clientWidth-t.clientWidth-r),o=getComputedStyle(a).scrollbarGutter===`stable both-edges`?i/2:i;o<=Qe&&(s-=o)}return{width:s,height:c,x:l,y:u}}function et(e,t){let n=K(e,!0,t===`fixed`),r=n.top+e.clientTop,i=n.left+e.clientLeft,a=G(e);return{width:e.clientWidth*a.x,height:e.clientHeight*a.y,x:i*a.x,y:r*a.y}}function tt(e,t,n){let r;if(t===`viewport`||t===`layoutViewport`)r=$e(e,n,t);else if(t===`document`)r=Ze(I(e));else if(L(t))r=et(t,n);else{let n=Ge(e);r={x:t.x-n.x,y:t.y-n.y,width:t.width,height:t.height}}return he(r)}function nt(e,t){let n=t.get(e);if(n)return n;let r=W(e,[],!1).filter(e=>L(e)&&P(e)!==`body`),i=null,a=V(e).position===`fixed`,o=a?U(e):e;for(;L(o)&&!B(o);){let e=V(o),t=Le(o),n=i?i.position:a?`fixed`:``;!t&&(n===`fixed`||n===`absolute`&&e.position===`static`)?r=r.filter(e=>e!==o):i=e,o=U(o)}return t.set(e,r),r}function rt(e){let{element:t,boundary:n,rootBoundary:r,strategy:i}=e,a=[...n===`clippingAncestors`?Ne(t)?[]:nt(t,this._c):[].concat(n),r],o=tt(t,a[0],i),s=o.top,c=o.right,l=o.bottom,u=o.left;for(let e=1;e<a.length;e++){let n=tt(t,a[e],i);s=w(n.top,s),c=C(n.right,c),l=C(n.bottom,l),u=w(n.left,u)}return{width:c-u,height:l-s,x:u,y:s}}function it(e){let{width:t,height:n}=He(e);return{width:t,height:n}}function at(e,t,n){let r=R(t),i=I(t),a=n===`fixed`,o=K(e,!0,a,t),s={scrollLeft:0,scrollTop:0},c=D(0);if((r||!a)&&((P(t)!==`body`||je(i))&&(s=H(t)),r)){let e=K(t,!0,a,t);c.x=e.x+t.clientLeft,c.y=e.y+t.clientTop}!r&&i&&(c.x=qe(i));let l=i&&!r&&!a?Je(i,s):D(0);return{x:o.left+s.scrollLeft-c.x-l.x,y:o.top+s.scrollTop-c.y-l.y,width:o.width,height:o.height}}function ot(e){return V(e).position===`static`}function st(e,t){if(!R(e)||V(e).position===`fixed`)return null;if(t)return t(e);let n=e.offsetParent;return I(e)===n&&(n=n.ownerDocument.body),n}function ct(e,t){let n=F(e);if(Ne(e))return n;if(!R(e)){let t=U(e);for(;t&&!B(t);){if(L(t)&&!ot(t))return t;t=U(t)}return n}let r=st(e,t);for(;r&&Me(r)&&ot(r);)r=st(r,t);return r&&B(r)&&ot(r)&&!Le(r)?n:r||Re(e)||n}var lt=async function(e){let t=this.getOffsetParent||ct,n=this.getDimensions,r=await n(e.floating);return{reference:at(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,width:r.width,height:r.height}}};function ut(e){return V(e).direction===`rtl`}var dt={convertOffsetParentRelativeRectToViewportRelativeRect:Ye,getDocumentElement:I,getClippingRect:rt,getOffsetParent:ct,getElementRects:lt,getClientRects:Xe,getDimensions:it,getScale:G,isElement:L,isRTL:ut};function ft(e,t){return e.x===t.x&&e.y===t.y&&e.width===t.width&&e.height===t.height}function pt(e,t,n){let r=null,i,a=I(e);function o(){var e;clearTimeout(i),(e=r)==null||e.disconnect(),r=null}function s(n,c){n===void 0&&(n=!1),c===void 0&&(c=1),o();let l=e.getBoundingClientRect(),{left:u,top:d,width:f,height:p}=l;if(n||t(),!f||!p)return;let m=E(d),h=E(a.clientWidth-(u+f)),g=E(a.clientHeight-(d+p)),_=E(u),v={rootMargin:-m+`px `+-h+`px `+-g+`px `+-_+`px`,threshold:w(0,C(1,c))||1},y=!0;function b(t){let n=t[0].intersectionRatio;if(!ft(l,e.getBoundingClientRect()))return s();if(n!==c){if(!y)return s();n?s(!1,n):i=setTimeout(()=>{s(!1,1e-7)},1e3)}y=!1}try{r=new IntersectionObserver(b,{...v,root:a.ownerDocument})}catch{r=new IntersectionObserver(b,v)}r.observe(e)}let c=F(e),l=()=>s(n);return c.addEventListener(`resize`,l),s(!0),()=>{c.removeEventListener(`resize`,l),o()}}function mt(e,t,n,r){r===void 0&&(r={});let{ancestorScroll:i=!0,ancestorResize:a=!0,elementResize:o=typeof ResizeObserver==`function`,layoutShift:s=typeof IntersectionObserver==`function`,animationFrame:c=!1}=r,l=Ue(e),u=i||a?[...l?W(l):[],...t?W(t):[]]:[];u.forEach(e=>{i&&e.addEventListener(`scroll`,n),a&&e.addEventListener(`resize`,n)});let d=l&&s?pt(l,n,a):null,f=-1,p=null;o&&(p=new ResizeObserver(e=>{let[r]=e;r&&r.target===l&&p&&t&&(p.unobserve(t),cancelAnimationFrame(f),f=requestAnimationFrame(()=>{var e;(e=p)==null||e.observe(t)})),n()}),l&&!c&&p.observe(l),t&&p.observe(t));let m,h=c?K(e):null;c&&g();function g(){let t=K(e);h&&!ft(h,t)&&n(),h=t,m=requestAnimationFrame(g)}return n(),()=>{var e;u.forEach(e=>{i&&e.removeEventListener(`scroll`,n),a&&e.removeEventListener(`resize`,n)}),d?.(),(e=p)==null||e.disconnect(),p=null,c&&cancelAnimationFrame(m)}}var ht=Ee,gt=Se,_t=De,vt=Ce,yt=be,bt=(e,t,n)=>{let r=new Map,i=n??{},a={...dt,...i.platform,_c:r};return ye(e,t,{...i,platform:a})},xt={top:`bottom`,bottom:`top`,left:`right`,right:`left`};function St(e,t,n,r,i){if(typeof document>`u`)return!1;t.style.position=`fixed`,t.style.margin=`0`;let a=n.placement??`auto`,o=a===`auto`,s=n.arrow===!1?null:t.querySelector(i.arrowSelector),c=[];n.offset==null?s&&c.push(ht(6)):c.push(ht(n.offset)),o?c.push(gt()):(n.flip??i.flipDefault??!0)!==!1&&c.push(vt()),n.shift!==!1&&c.push(n.shift==null||n.shift===!0?_t():_t(n.shift)),s&&c.push(yt({element:s}));let l=()=>{bt(e,t,{strategy:`fixed`,placement:o?void 0:a,middleware:c}).then(({x:n,y:r,placement:a,middlewareData:o})=>{if(Object.assign(t.style,{left:`${n}px`,top:`${r}px`}),t.setAttribute(i.placementAttr,a),i.fitToEl){let e=String(a).split(`-`)[0];e===`left`||e===`right`?(t.style.height=`${i.fitToEl.offsetHeight}px`,t.style.width=``):(t.style.width=`${i.fitToEl.offsetWidth}px`,t.style.height=``)}if(i.onPositioned?.(String(a),e,t),s&&o.arrow){let{x:e,y:t}=o.arrow,n=xt[String(a).split(`-`)[0]??`bottom`]??`bottom`;Object.assign(s.style,{left:e==null?``:`${e}px`,top:t==null?``:`${t}px`,[n]:`${-s.offsetWidth/2}px`})}}).catch(()=>{})};return l(),typeof ResizeObserver<`u`&&r(mt(e,t,l)),!0}var Ct=`autospark-overlay-arrow`;function wt(e,t){if(e instanceof HTMLElement)return e;let n=String(e??``).trim();if(!n)return null;let r=y(t??document.body,n);return r instanceof HTMLElement?r:null}function Tt(e,t,n,r,i){return typeof document>`u`?!1:St(t,n,e,r,{placementAttr:`data-overlay-placement`,arrowSelector:`:scope > .${Ct}`,flipDefault:i?.flipDefault,onPositioned:i?.onPositioned,fitToEl:i?.fitToEl})}var Et=new WeakMap;function Dt(e,t){let n=Et.get(e);n||(n=new Set,Et.set(e,n)),n.add(t)}function Ot(e,t){Et.get(e)?.delete(t)}function kt(e){return Array.from(Et.get(e)??[])}var At={border:!0,closeOnMask:!0,animate:`fade`,delayClose:0,title:void 0,icon:void 0,closeable:void 0,actions:void 0,padding:void 0};function jt(e){return e==null?null:typeof e==`string`||e instanceof HTMLElement?{selector:e}:e}function Mt(e,t){let n=t.key==null?``:String(t.key),r=typeof t.url==`string`?t.url.trim():``;return r===``?`${e}::${n}`:`${e}::${n}::${r}`}function Nt(e,t,n,r,i){if(e instanceof HTMLElement)return{parentScope:r.findScopeByEl(e)??null,scopeEl:e};if(e===`host`)return{parentScope:n,scopeEl:null};e!==`declarer`&&i(`无效 dataContext ${JSON.stringify(e)}（须 'declarer'|'host' 或元素），按默认 'declarer' 处理`);let a=t?.declarerScope??null;return{parentScope:!a||a.destroyed?null:a,scopeEl:null}}function Pt(e){return r(`markRaw`)(e)}function Ft(e){return r(`createLoadingMask`)(e)}function It(e){for(let t of Array.from(e.querySelectorAll(`*`))){let e=t.tagName.toLowerCase();if(e===`x-component:autospark.overlay`||e.startsWith(`x-component:autospark.overlay.`)||e===`x-autospark.overlay`||e.startsWith(`x-autospark.overlay.`))return!0;for(let e of Array.from(t.attributes)){let t=e.name;if(t===`x-component:autospark.overlay`||t.startsWith(`x-component:autospark.overlay.`))return!0}}return!1}var Lt=class{constructor(e,t,n,r,i,a={}){this.onCloseRequest=null,this.remoteFailed=!1,this.isFragment=!1,this.chromeSlots=null,this.el=null,this.instanceScope=null,this.boundary=null,this.boundaryScope=null,this.boundaryMask=null,this._shellScope=null,this._visible=!1,this._closing=!1,this._destroyed=!1,this._panel=null,this._cleanups=[],this._unsubScopeDeath=null,this._delayTimer=null,this._suspended=!1,this._contentHost=null,this._onMaskClick=e=>{this.config.closeOnMask&&e.target===this.el&&this.requestClose(`mask`)},this._onCloseAction=()=>{this.requestClose(`close-action`)},this.engine=e,this.name=t,this.snapshot=n,this.def=r,this.config=i,this.parentScope=a.parentScope??null,this.searchRoot=a.searchRoot??null,this.dataContextEl=a.dataContextEl??null,this.mask=a.mask??!1,this._shell=a.shell??{name:`autospark.dialog`,...this.engine._resolveGlobalComponentFull(`autospark.dialog`)},this._positioner=a.positioner??null,this._onPanelReady=a.onPanelReady??null,this.cacheKey=a.cacheKey??null}get visible(){return this._visible}get destroyed(){return this._destroyed}get panel(){return this._panel}open(){if(!this._destroyed){if(this._suspended)this._resume();else{if(this._closing){if(this.engine.animate.cancel(this.el),this._destroyed)this._destroyed=!1;else if(this._suspended){this._resume();return}}this._visible||(this._buildAndMount(),this._armDelayClose())}}}requestClose(e){if(!(!this._visible||this._closing||this._destroyed)){if(this.onCloseRequest)try{this.onCloseRequest(this,e)}catch(e){this.engine.logger.error(e)}this.close()}}close(){if(!this._visible||this._closing||this._destroyed)return;this._visible=!1,_(this),this._clearAnchorCleanup(),this._broadcast(`overlay:close`);let e=this.el,t=o(this.config.animate).leave;this._closing=!0;let n=()=>{this._closing=!1,!this._destroyed&&(this.cacheKey&&this.config.keepalive===!0&&!this.remoteFailed?this._suspend():this.destroy())};this.engine.animate.leave(e,t,n)||n()}mountContent(e,t,n=!1){this._destroyed||(this.remoteFailed=!1,this._rearmBoundaryForContent(),this._contentHost=e,this.instanceScope=t,this.isFragment=n,this._unsubScopeDeath?.(),this._unsubScopeDeath=Rt(this.engine,t,()=>this.destroy()),this.boundary?.appendChild(e))}destroyContent(){if(!this._destroyed){if(this._unsubScopeDeath?.(),this._unsubScopeDeath=null,this.instanceScope){let e=this._collectContentScopeIds();this.instanceScope.destroy();let t=this.engine.store.state[i];if(t)for(let n of e)delete t[n];this.instanceScope=null}this._contentHost?.remove(),this._contentHost=null,this.isFragment=!1,this._rearmBoundaryForLoading(),this.parentScope&&(this._unsubScopeDeath=Rt(this.engine,this.parentScope,()=>this.destroy()))}}rebuildBoundary(){if(this._destroyed)return;let e=this.boundary;if(!e)return;let t=e.parentElement,n=e.nextSibling;e.remove(),this.boundaryScope?.destroy(),this.boundaryScope=null,this.boundary=null;let r=this._makeBoundary();t&&t.insertBefore(r,n)}destroy(){if(!this._destroyed){if(this._destroyed=!0,this.el&&this.engine.animate.cancel(this.el),this._unsubScopeDeath?.(),this._unsubScopeDeath=null,this._delayTimer&&=(clearTimeout(this._delayTimer),null),this._clearAnchorCleanup(),_(this),this.instanceScope){let e=this._collectScopeIds(this.instanceScope);this.instanceScope.destroy();let t=this.engine.store.state[i];if(t)for(let n of e)delete t[n];this.instanceScope=null}if(this.boundaryScope?.destroy(),this.boundaryScope=null,this._shellScope){let e=this._collectScopeIds(this._shellScope);this._shellScope.destroy();let t=this.engine.store.state[i];if(t)for(let n of e)delete t[n];this._shellScope=null}if(this.el){let e=this.el;e.removeEventListener(`click`,this._onMaskClick),e.removeEventListener(`action:close`,this._onCloseAction),e.remove(),this.engine.dispatcher.removeExtraRoot(e),this.el=null,this._panel=null}this.boundary=null,this._contentHost=null,Ot(this.snapshot,this)}}_suspend(){this._suspended=!0,this._delayTimer&&=(clearTimeout(this._delayTimer),null),this.el.style.display=`none`}_resume(){this._suspended=!1,this._show(),this._armDelayClose()}_armDelayClose(){let e=Number(this.config.delayClose);e<=0||(this._delayTimer=setTimeout(()=>{this._delayTimer=null,this.requestClose(`delay`)},e))}_makeBoundary(){let e=document.createElement(`div`);e.setAttribute(`x-error`,``),this.boundaryMask=Ft(e),this.boundaryMask.show(),e.style.cssText=`position:relative;min-width:var(--autospark-overlay-loading-min-width, 240px);min-height:var(--autospark-overlay-loading-min-height, 120px);`;let t=new(a())(this.engine,e,e);return this.engine.scopes.set(new WeakRef(e),t),this.boundary=e,this.boundaryScope=t,e}_rearmBoundaryForContent(){let e=this.boundary;e&&(this.boundaryMask?.hide(),e.style.minWidth=``,e.style.minHeight=``)}_rearmBoundaryForLoading(){let e=this.boundary;e&&(this.boundaryMask?.show(),e.style.minWidth=`var(--autospark-overlay-loading-min-width, 240px)`,e.style.minHeight=`var(--autospark-overlay-loading-min-height, 120px)`)}_collectScopeIds(e){let t=[],n=e=>{t.push(String(e.id));for(let t of e.children)n(t)};return n(e),t}_buildAndMount(){let e=this._makeBoundary();this._buildShellAndMount(e),this.parentScope&&(this._unsubScopeDeath=Rt(this.engine,this.parentScope,()=>this.destroy()))}_buildShellAndMount(e){let t=s(this.engine);if(!t)return;let n=this._shell,r=!!n.def?.slots?.includes(`default`),i=!r&&It(n.snapshot),a=null;if(r||i?a=new Map([[`default`,{name:`default`,nodes:[e],params:[],paramsExpr:null,mode:`live`}]]):this.engine.logger.warn(`x-overlay "${this.name}": shell "${n.name}" 未声明默认出口（x-slot），内容直挂面板根（ADR-0062）`),this.chromeSlots&&this.chromeSlots.size>0){a??=new Map;for(let[e,t]of this.chromeSlots)a.set(e,t)}let o=n.snapshot.cloneNode(!0);Array.isArray(this.config.actions)&&(this.config.actions=Pt(this.config.actions));let c=this.engine.compiler.instantiateDetachedComponent(o,null,n.def,this.config,void 0,a,this.parentScope);this._shellScope=c.scope;let l=c.el;!r&&!i&&l.appendChild(e),l.setAttribute(`data-overlay`,this.name),this.config.border!==!1&&l.setAttribute(`data-overlay-border`,``);let u=l;this.mask&&(u=document.createElement(`div`),u.className=d,u.appendChild(l),u.addEventListener(`click`,this._onMaskClick)),u.addEventListener(`action:close`,this._onCloseAction),this.el=u,this._panel=l,this.engine.dispatcher.addExtraRoot(u),t.appendChild(u),this._show()}_show(){let e=this.el;if(e.style.display=``,this._visible=!0,this._clearAnchorCleanup(),this._positioner){let e=jt(this.config.at),t=e?wt(e.selector,this.searchRoot):null;this._positioner({panel:this._panel,anchor:e,anchorEl:t,registerCleanup:e=>this._cleanups.push(e),warn:e=>this.engine.logger.warn(e)})}else{let e=jt(this.config.at),t=e?wt(e.selector,this.searchRoot):null,n=this._panel.querySelector(`:scope > .${Ct}`);if(t&&e){e.arrow===!1&&n?.remove();let r=this.config.fit&&this.searchRoot?{fitToEl:this.searchRoot}:void 0;Tt(e,t,this._panel,e=>this._cleanups.push(e),r)}else n?.remove(),this.config.at!=null&&this.engine.logger.warn(`x-overlay "${this.name}": at "${String(e?.selector??this.config.at)}" 未命中，退屏幕居中（ADR-0052 决策 22）`),this._resetPanelToCentered()}let t=o(this.config.animate).enter;t&&this.engine.animate.enter(e,t),g(this),this._broadcast(`overlay:open`),this._onPanelReady?.({panel:this._panel,config:this.config,registerCleanup:e=>this._cleanups.push(e)})}_resetPanelToCentered(){let e=this._panel;e&&(e.style.position=``,e.style.left=``,e.style.top=``,e.style.margin=``,e.removeAttribute(`data-overlay-placement`))}_broadcast(e){let t={name:this.name,instance:this,dataContext:this.dataContextEl??void 0,key:this.config.key??void 0};this.el?.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0})),this.engine.emit(e,t)}_clearAnchorCleanup(){for(let e of this._cleanups)try{e()}catch{}this._cleanups.length=0}};function Rt(e,t,n){let r=e.on(`scope/destroyed`,e=>{(e?.payload??e)?.scope===t&&n()});return typeof r==`function`?r:()=>r.off()}function q(e){if(typeof e!=`object`||!e)return!1;var t=Object.getPrototypeOf(e);if(t===null)return!0;for(var n=t;Object.getPrototypeOf(n)!==null;)n=Object.getPrototypeOf(n);return t===n}function zt(e,...t){if(t.length===0)return e;let n=t.map((e,t)=>{let n=Object.entries(e||{});return n.some(([e,t])=>t===void 0)?n.reduce((e,[t,n])=>(n!==void 0&&(e[t]=n),e),{}):e});return Object.assign(e,...n)}function Bt(e){return q(e)?[`$merge`,`$ignoreUndefined`].some(t=>t in e):!1}function Vt(...e){if(e.length<2)throw Error(`deepMerge函数至少需要两个参数`);let t=e.length>0&&Bt(e[e.length-1]),{$merge:n,$ignoreUndefined:r,skipKeys:i}=zt({skipKeys:[],$ignoreUndefined:!0,$merge:`replace`},t?e[e.length-1]:{});function a(e,t){q(e)&&Object.entries(e).forEach(([i,o])=>{let s;i in t?Array.isArray(o)&&Array.isArray(t[i])?(n===`replace`?s=o:n===`append`?s=[...t[i],...o]:n===`append`?s=[...new Set([...t[i],...o])]:typeof n==`function`&&(s=n(t[i],o,{key:i,from:e,to:t})),t[i]=r&&o===void 0?t[i]:s):q(o)&&q(t[i])?a(o,t[i]):t[i]=r&&o===void 0?t[i]:o:t[i]=o})}return e.reduce((n,r,i)=>i==0?n||{}:(!q(r)||t&&i===e.length-1||a(r,n||{}),n),e[0])}(t=>typeof e<`u`?e:typeof Proxy<`u`?new Proxy(t,{get:(t,n)=>(typeof e<`u`?e:t)[n]}):t)(function(t){if(typeof e<`u`)return e.apply(this,arguments);throw Error(`Dynamic require of "`+t+`" is not supported`)});function Ht(e,t){return e instanceof Error?{name:e.name,message:e.message,stack:e.stack,source:t}:typeof e==`string`?{message:e,source:t}:e&&typeof e==`object`?{...e,source:t}:{message:String(e),source:t}}function J(e,t,n,r,i,a){let o=a;r&&o&&o.length>0&&!r.slots?.length&&(e.warn(`覆盖物组件 "${n}" 未声明任何 x-slot 出口，已提供的内容无法投影，已丢弃（ADR-0056 决策十修订）`),o=null);let s=e.resolveParentScope(r),c=document.createElement(`div`);c.setAttribute(`x-component:${n}`,i??``),c.setAttribute(`x-component-options`,`{ open: true, dataContext: "host" }`);for(let e of o??[])c.appendChild(e.cloneNode(!0));let l=document.createElement(`div`);l.appendChild(c);let u=e.engine.compiler.compileChild(l,s,null,void 0,void 0);t.mountContent(u.el.firstElementChild,u.scope,!1)}function Ut(e,t,n,r){let i=e.resolveParentScope(null),a=r(),o=document.createElement(`div`);o.setAttribute(`x-html.compile`,n);let s=document.createElement(`div`);s.appendChild(o);let c=e.engine.compiler.compileChild(s,i,null,void 0,a?{...a}:void 0),l=c.el.firstElementChild,u=e.engine.findScopeByEl(l);if(u){let r=null;u.watch(`$error || null`,({value:i})=>{i&&i!==r&&(r=i,Gt(e.warn,t,i,n))})}t.mountContent(l,c.scope,!0),e.onFragmentApplied?.(a)}async function Wt(e,t,n,r,i,a,o,s){try{let c=await e.engine.importComponentsFromUrl(r,e.registerScope,!1,void 0,s);if(s?.aborted||t.destroyed)return;if(c===null){Gt(e.warn,t,Error(`远程内容加载失败`),r);return}let l=e.findComponent(n);if(l){J(e,t,n,l.def,a,i);return}c.length>0&&e.warn(`远程内容（${r}）未声明覆盖物组件 "${n}"（实际注册: ${c.join(`, `)}），已按片段渲染——若意图消费组件请核对消费名 "${n}" 与远程 x-define 名（ADR-0123）`),i&&i.length>0&&e.warn(`url 片段路径不支持插槽内容投影，已丢弃（片段无组件出口，ADR-0123）`),Ut(e,t,r,o)}catch(n){if(s?.aborted||t.destroyed)return;Gt(e.warn,t,n instanceof Error?n:Error(String(n)),r)}}function Gt(e,t,n,r){if(t.destroyed)return;t.remoteFailed=!0;let i={...Ht(n,`load`),...r?{url:r}:{}};e(`覆盖物内容加载失败: ${i.message}${r?`（${r}）`:``}`),t.boundary?.dispatchEvent(new CustomEvent(`error`,{bubbles:!0,composed:!0,detail:{error:i,message:i.message,closeable:!1,retryable:!1,actions:[{name:`overlayRetry`,title:`重试`},{name:`overlayClose`,title:`关闭`}]}}))}function Kt(e,t,n){let r=t.boundaryScope;r&&(r.actions={...r.actions??{},overlayRetry:{id:`overlayRetry`,title:`重试`,handle:()=>{t.destroyed||(t.destroyContent(),t.rebuildBoundary(),Kt(e,t,n),n())}},overlayClose:{id:`overlayClose`,title:`关闭`,handle:()=>t.requestClose(`error-close`)}})}var qt=class{constructor(e,t,n,r,i,a=null){this.engine=e,this.name=t,this.snapshot=n,this.def=r;let{props:o,...s}=i??{};this._defaultProps=o,this._options=s,this._anchorScope=a}open(e){let t,n=this._defaultProps;if(e&&typeof e==`object`){let{props:r,...i}=e;r!==void 0&&(n=r),t=i}let r=Jt(this._options,t);r.keepalive===!0&&this.engine.logger.warn(`engine.getOverlay("${this.name}"): keepalive 在命令式通道不生效（v1 声明式专属，ADR-0119），已忽略`);let{parentScope:i,scopeEl:a}=r.dataContext===void 0?{parentScope:null,scopeEl:null}:Nt(r.dataContext,this.def,this._anchorScope,this.engine,e=>this.engine.logger.warn(`engine.getOverlay("${this.name}"): ${e}`)),o=r.mask!==!1,s=new Lt(this.engine,this.name,this.snapshot,this.def,r,{parentScope:i,searchRoot:a,dataContextEl:a,mask:o,shell:Yt(this.engine,this._anchorScope,this.name,r,o)});Dt(this.snapshot,s),s.open();let c=r.dataContext===void 0?this._anchorScope:i,l=this._hostCtx(c),u=typeof r.url==`string`?r.url.trim():``,d=this._serializeProps(n),f=()=>{let e=l.findComponent(this.name);e?J(l,s,this.name,e.def,d,null):u===``?(this.engine.logger.warn(`engine.getOverlay("${this.name}"): 组件当前不可达（锚点 scope 可能已销毁），面板已开并显示加载占位——组件注册后自动挂载（ADR-0123）`),J(l,s,this.name,null,d,null)):Wt(l,s,this.name,u,null,d,()=>n)};return Kt(l,s,f),f(),s}_hostCtx(e){return{engine:this.engine,warn:e=>this.engine.logger.warn(`engine.getOverlay("${this.name}"): ${e}`),registerScope:e,findComponent:e=>{let t=this._anchorScope?.getComponentDeclaration(e)??this.engine._resolveGlobalComponent(e);return t?{snapshot:t,def:this.engine.getComponentDef(t)??this.engine.getGlobalComponentDef(e)??null}:null},resolveParentScope:()=>e}}_serializeProps(e){if(e===void 0)return null;try{return JSON.stringify(e)}catch(e){return this.engine.logger.warn(`engine.getOverlay("${this.name}"): props 序列化失败，已忽略: ${e?.message??e}`),null}}close(){for(let e of kt(this.snapshot))e.requestClose(`api`)}};function Jt(...e){let t={...At};for(let n of e)if(n&&typeof n==`object`){let e=n,r=n.at;r!=null&&(typeof r==`string`||r instanceof HTMLElement)&&(e={...n,at:{selector:r}}),t=Vt(t,e,{})}return t}function Yt(e,t,n,r,i){let a=r.shell,o=a==null?``:String(a).trim();if(o!==``){let r=t?.getComponentDeclaration(o)??e._resolveGlobalComponent(o);if(r)return{name:o,snapshot:r,def:e.getComponentDef(r)??e.getGlobalComponentDef(o)??null};e.logger.warn(`engine.getOverlay("${n}"): shell "${o}" 未命中（scope 链与全局组件表均无），回退内置默认 shell（ADR-0062）`)}let s=i?c:u;return{name:s,...e._resolveGlobalComponentFull(s)}}function Xt(e){return e===`x-slot`||e.startsWith(`x-slot.`)||e.startsWith(`x-slot:`)}function Zt(e){return e===`x-slots`||e.startsWith(`x-slots.`)||e.startsWith(`x-slots:`)}function Qt(e){if(!(e instanceof HTMLElement))return null;for(let t of Array.from(e.attributes))if(Zt(t.name))return{attrName:t.name,name:t.value.trim()};return null}function $t(e){if(!(e instanceof HTMLElement))return null;let t=null;for(let n of Array.from(e.attributes)){let e=n.name;if(tn(e)){t||=en(e);continue}let r=en(e);if(r)return r}return t}function en(e){if(e===`x-slot`||e.startsWith(`x-slot.`))return{name:`default`,attrName:e};if(e.startsWith(`x-slot:`)){let t=e.slice(7).split(`.`),n=t[0]??``;return n===``?{name:`default`,attrName:e}:{name:[n,...t.slice(1).filter(e=>e!==`bind`)].join(`.`),attrName:e}}return null}function tn(e){return e===`x-slot.bind`?!0:e.startsWith(`x-slot.`)?e.slice(7).split(`.`).includes(`bind`):e.startsWith(`x-slot:`)?e.slice(7).split(`.`).slice(1).includes(`bind`):!1}function nn(e){if(!(e instanceof HTMLElement))return null;for(let t of Array.from(e.attributes)){let e=t.name;if(!tn(e))continue;let n=e.slice(7).split(`.`),r=n[0]??``;return{attrName:e,name:e.startsWith(`x-slot:`)&&r!==``?[r,...n.slice(1).filter(e=>e!==`bind`)].join(`.`):`default`,value:t.value}}return null}function rn(e){let t=(e??``).trim();if(t===``)return[];let n=/^\{([\s\S]*)\}$/.exec(t);if(!n)return null;let r=(n[1]??``).trim();if(r===``)return[];let i=[];for(let e of r.split(`,`)){let t=e.trim();if(t!==``){if(!/^[A-Za-z_$][\w$]*$/.test(t))return null;i.push(t)}}return i}function an(e){let t=[];for(let n of Array.from(e.attributes))Xt(n.name)&&t.push(n.name);for(let n of t)e.removeAttribute(n)}function on(e,t){for(let n of Array.from(e.querySelectorAll(`*`)))n instanceof HTMLElement&&$t(n)&&(t(`x-slot: 插槽内容内部的嵌套 x-slot 标记已忽略（内容分段仅认宿主直接子级，ADR-0056）`),an(n))}function sn(e){return e.nodeType===Node.TEXT_NODE&&(e.nodeValue??``).trim()===``}function cn(e){let t=e instanceof HTMLTemplateElement?e.content:e;return Array.from(t.childNodes).every(e=>e.nodeType===Node.COMMENT_NODE||e.nodeType===Node.TEXT_NODE&&(e.nodeValue??``).trim()===``)}function ln(e,t){if(e instanceof HTMLTemplateElement){let n=[];for(let r of Array.from(e.content.childNodes)){let e=r.cloneNode(!0);e instanceof HTMLElement&&on(e,t),n.push(e)}return n}let n=e.cloneNode(!0);return an(n),on(n,t),[n]}function un(e,t,n,r){let i=new Map,a=[],o=null,s=null,c=-1,l=-1;for(let t=0;t<e.length;t++){let r=e[t];if(r.nodeType===Node.COMMENT_NODE)continue;if(r.nodeType===Node.TEXT_NODE){if(sn(r)&&a.length===0&&c<0)continue;c<0&&(c=t),a.push(r.cloneNode(!0));continue}if(!(r instanceof HTMLElement)){c<0&&(c=t),a.push(r.cloneNode(!0));continue}let u=$t(r);if(!u){c<0&&(c=t);let e=r.cloneNode(!0);on(e,n),a.push(e);continue}if(u.name!=="default"){if(i.has(u.name)){n(`x-slot: 插槽内容 "${u.name}" 重复，后者已忽略（ADR-0056）`);continue}let e=nn(r),t=e&&e.attrName===u.attrName?`x-slot:${u.name}`:u.attrName,a=r.hasAttribute(t)?r.getAttribute(t):null,o=rn(a);o===null&&(n(`x-slot: 内容 "${u.name}" 的形参须为简单解构形（{ item, index }），已按无形参处理`),o=[]),i.set(u.name,{name:u.name,nodes:ln(r,n),params:o,paramsExpr:o.length>0&&(a??``).trim()||null,bindingsExpr:e&&e.value.trim()||null});continue}let d=nn(r),f=!!d&&d.attrName===u.attrName&&!r.hasAttribute(`x-slot`);if(f){let e=d.value.trim();if(e!==``&&(s===null?s=e:n(`x-slot: 默认插槽传递绑定重复，后者已忽略（ADR-0108）`)),cn(r))continue}if(o){n(`x-slot: 默认插槽内容重复（裸 x-slot 标记），后者已忽略（ADR-0056）`);continue}l=t;let p=f?r.hasAttribute(`x-slot`)?r.getAttribute(`x-slot`):null:r.getAttribute(u.attrName),m=rn(p);m===null&&(p!==null&&n(`x-slot: 默认插槽标记的形参须为简单解构形（{ item }），已按无形参处理`),m=[]),o={name:`default`,nodes:ln(r,n),params:m,paramsExpr:m.length>0&&(p??``).trim()||null,bindingsExpr:d&&d.value.trim()||null}}let u=new Map(i),d=a.length>0;if(d&&o?l>=0&&c>=0&&l<c?(n(`x-slot: 默认插槽同时存在裸 x-slot 标记与裸子节点，标记在前——裸子节点已丢弃（ADR-0056）`),u.set(`default`,{...o,bindingsExpr:o.bindingsExpr??s})):(n(`x-slot: 默认插槽同时存在裸子节点与裸 x-slot 标记，裸子节点在前——x-slot 标记已丢弃（ADR-0056）`),u.set(`default`,{name:`default`,nodes:a,params:[],paramsExpr:null,bindingsExpr:s})):o?u.set(`default`,{...o,bindingsExpr:o.bindingsExpr??s}):d?a.every(e=>sn(e))?s!==null&&n(`x-slot: 默认插槽传递绑定未附着任何内容（仅有绑定载体），已忽略（ADR-0108）`):u.set(`default`,{name:`default`,nodes:a,params:[],paramsExpr:null,bindingsExpr:s}):s!==null&&n(`x-slot: 默认插槽传递绑定未附着任何内容（仅有绑定载体），已忽略（ADR-0108）`),!r?.skipValidation){let e=t?new Set(t):null,r=new Map;for(let[t,i]of u)!e||!e.has(t)?n(`x-slot: 内容 "${t}" 无对应出口（组件未声明该 x-slot 出口），已丢弃（ADR-0056）`):r.set(t,i);return r.size>0?r:null}return u.size>0?u:null}function dn(e,t){Qt(e)&&(t(`x-slots: 归属容器内部的嵌套 x-slots 已忽略（归属只认宿主直接子级），标记属性已剥除`),pn(e))}function fn(e,t){for(let n of Array.from(e.querySelectorAll(`*`)))n instanceof HTMLElement&&dn(n,t)}function pn(e){let t=[];for(let n of Array.from(e.attributes))Zt(n.name)&&t.push(n.name);for(let n of t)e.removeAttribute(n)}function mn(e,t){let n=e instanceof HTMLTemplateElement?e.content:e,r=[];for(let e of Array.from(n.childNodes)){let n=e.cloneNode(!0);n instanceof HTMLElement&&(dn(n,t),fn(n,t)),r.push(n)}return r}function hn(e,t,n){let r=Array.from(new Set(t)),i=new Map,a=[];for(let t of Array.from(e.childNodes)){let e=t instanceof HTMLElement?Qt(t):null;if(e){if(e.name===``){n(`x-slots: 归属容器缺少覆盖物组件名（应写 x-slots="组件名"），容器内容已丢弃`);continue}if(i.has(e.name)){n(`x-slots: 归属容器 "${e.name}" 重复，后者已丢弃`);continue}if(!r.includes(e.name)){n(`x-slots: 宿主上无名为 "${e.name}" 的覆盖物消费者（现有：${r.join(`、`)||`无`}），容器内容已丢弃`);continue}i.set(e.name,mn(t,n))}else t instanceof HTMLElement&&$t(t)&&a.push(t)}return a.length>0&&(r.length===1?i.set(r[0],a):r.length>1?n(`x-slots: 宿主上有 ${r.length} 个覆盖物消费者（${r.join(`、`)}），未被归属容器包裹的内容无法判定归属，已丢弃——请用 x-slots="组件名" 分别包裹`):n(`x-slots: 宿主上无覆盖物消费者，未被归属容器包裹的内容已丢弃`)),i}function gn(e,t){if(globalThis.document===void 0)return;let{id:n,mode:r=`default`,location:i=`head`,el:a}=t??{},o=()=>typeof e==`function`?e():e,s=_n(n,a);if(!s){let e=document.createElement(`style`);return n&&(e.id=n),e.textContent=o(),a?a.appendChild(e):i==`body`?document.body.appendChild(e):document.head.appendChild(e),e}if(r==`replace`)s.textContent=o();else if(r==`patch`){let e=o();s.textContent!==e&&(s.textContent=e)}else r==`append`&&(s.textContent+=o());return s}function _n(e,t){if(!e)return null;let n=e.replace(/["\\]/g,`\\$&`),r=t?.querySelector(`[id="${n}"]`)??document.getElementById(e);return r?.tagName===`STYLE`?r:null}var vn=new Set([`n`,`s`,`e`,`w`,`ne`,`nw`,`se`,`sw`]),yn=[`e`,`s`,`se`],bn={minWidth:null,maxWidth:null,minHeight:null,maxHeight:null,snap:0,aspectRatio:0},xn=e=>e==null||!Number.isFinite(e)?null:e,Y=(e,t,n)=>t!=null&&e<t?t:n!=null&&e>n?n:e;function Sn(e){if(typeof e==`number`)return Number.isFinite(e)&&e>=0?e:null;if(typeof e==`string`){let t=e.trim();return/^\d+(\.\d+)?px?$/.test(t)?parseFloat(t):null}return null}function X(e,t){let n=e?e.getPropertyValue(t):``;if(!n||n===`none`||n===`auto`)return null;let r=parseFloat(n);return Number.isFinite(r)&&r>0?r:null}function Cn(e,t,n){let r={...bn};if(e){r.snap=xn(e.snap)??0,r.snap<0&&(r.snap=0);let i=e.aspectRatio;if(typeof i==`string`){let e=i.trim().match(/^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/),t=e?Number(e[1]):NaN,a=e?Number(e[2]):NaN;Number.isFinite(t)&&Number.isFinite(a)&&t>0&&a>0?r.aspectRatio=t/a:i.trim()!==``&&n?.(`x-resizable: aspectRatio "${i}" 无法解析为比值（如 '16:9'），已忽略`)}else{let e=xn(i);e!=null&&e>0&&(r.aspectRatio=e)}for(let[i,a]of[[`minWidth`,`minWidth`],[`maxWidth`,`maxWidth`],[`minHeight`,`minHeight`],[`maxHeight`,`maxHeight`]]){let o=e[i];if(o==null)continue;let s=Sn(o);if(s!=null){r[a]=s;continue}let c=wn(t,String(o));c==null?n?.(`x-resizable: 约束 ${i} 值 "${String(o)}" 无法解析为长度，已忽略`):r[a]=c}}if(t){let e=typeof getComputedStyle==`function`?getComputedStyle(t):null;r.minWidth??=X(e,`min-width`),r.maxWidth??=X(e,`max-width`),r.minHeight??=X(e,`min-height`),r.maxHeight??=X(e,`max-height`)}return r}function wn(e,t){let n=document.createElement(`div`);n.style.position=`absolute`,n.style.visibility=`hidden`,n.style.width=t;let r=e?.isConnected?e:document.body;if(!r)return null;try{r.appendChild(n);let e=parseFloat(getComputedStyle(n).width);return Number.isFinite(e)&&e>=0?e:null}catch{return null}finally{n.remove()}}function Tn(e,t,n,r){let i=e=>r.snap>0?Math.round(e/r.snap)*r.snap:e;if(r.aspectRatio>0){if(n===`n`||n===`s`){let e=Y(i(t),r.minHeight,r.maxHeight);return{width:Y(e*r.aspectRatio,r.minWidth,r.maxWidth),height:e}}let a=Y(i(e),r.minWidth,r.maxWidth);return{width:a,height:Y(a/r.aspectRatio,r.minHeight,r.maxHeight)}}return{width:Y(i(e),r.minWidth,r.maxWidth),height:Y(i(t),r.minHeight,r.maxHeight)}}function En(e,t){let n=new Set,r=e=>{let r=e.trim().toLowerCase();vn.has(r)?n.add(r):t?.(`x-resizable: 未知调节方向 "${e}"（合法：n/s/e/w/ne/nw/se/sw），已忽略`)},i=e?.handles;if(typeof i==`string`?i.split(`,`).forEach(e=>e.trim()&&r(e)):Array.isArray(i)?i.forEach(e=>r(String(e))):i!=null&&t?.(`x-resizable: handles 须为逗号串或数组，已忽略: ${JSON.stringify(i)}`),e)for(let t of Object.keys(e))e[t]===!0&&vn.has(t)&&n.add(t);return n.size===0&&i==null?[...yn]:[...n]}function Dn(e){let t=(t,n)=>{if(/^-?\d+(\.\d+)?px$/.test(t.trim()))return parseFloat(t);let r=typeof getComputedStyle==`function`?getComputedStyle(e):null,i=r?parseFloat(r.getPropertyValue(n)):NaN;return Number.isFinite(i)?i:0};return{left:t(e.style.left,`left`),top:t(e.style.top,`top`)}}function Z(e){let t=e=>/^-?\d+(\.\d+)?px$/.test(e.trim())?parseFloat(e):null,n=(e,n)=>t(e)??(n>0?n:parseFloat(e)||0);return{width:n(e.style.width,e.offsetWidth),height:n(e.style.height,e.offsetHeight)}}var On=class{constructor(e){this.opts=e,this._handles=[],this._start=null,this._kbHandle=null,this._c=null,this._destroyed=!1,this._kbDir=null}get active(){return this._start!=null||this._kbHandle!=null}attach(){if(!(this._destroyed||this._handles.length))for(let e of this.opts.handles){let t=document.createElement(`span`);t.setAttribute(`data-autospark-resize-handle`,e),t.tabIndex=0,t.setAttribute(`role`,`separator`),e===`n`||e===`s`?t.setAttribute(`aria-orientation`,`horizontal`):(e===`e`||e===`w`)&&t.setAttribute(`aria-orientation`,`vertical`),t.setAttribute(`aria-label`,`调节尺寸 ${e}`),t.addEventListener(`pointerdown`,n=>this._onPointerDown(n,e,t)),t.addEventListener(`keydown`,n=>this._onKeyDown(n,e,t)),t.addEventListener(`keyup`,()=>this._endKeyboard()),t.addEventListener(`blur`,()=>this._endKeyboard()),this.opts.target.appendChild(t),this._handles.push(t)}}destroy(){this._destroyed=!0,this._start=null,this._kbHandle=null,this._c=null;for(let e of this._handles)e.remove();this._handles=[]}_onPointerDown(e,t,n){if(this._destroyed||e.button>0)return;e.preventDefault(),this._begin(t,e.clientX,e.clientY);try{n.setPointerCapture?.(e.pointerId)}catch{}let r=e=>this._move(e.clientX,e.clientY),i=()=>{n.removeEventListener(`pointermove`,r),n.removeEventListener(`pointerup`,i),n.removeEventListener(`pointercancel`,i);try{n.releasePointerCapture?.(e.pointerId)}catch{}this._end()};n.addEventListener(`pointermove`,r),n.addEventListener(`pointerup`,i),n.addEventListener(`pointercancel`,i)}_begin(e,t,n){let r=this.opts.target,i=Z(r),a=Dn(r);this._c=this.opts.constraints(),this._start={x:t,y:n,width:i.width,height:i.height,w0:i.width,h0:i.height,left:a.left,top:a.top,_dir:e},this._dispatch(`resize:start`,e)}_move(e,t){let n=this._start;if(!n||this._destroyed)return;let r=this._currentDir,i=e-n.x,a=t-n.y,o=r.includes(`e`)?i:r.includes(`w`)?-i:0,s=r.includes(`s`)?a:r.includes(`n`)?-a:0;this._applyClamped(n.w0+o,n.h0+s,r)}_end(){if(!this._start)return;let e=this._currentDir;this._start=null,this._c=null;let t=Z(this.opts.target);this._dispatch(`resize:end`,e,t.width,t.height)}get _currentDir(){return this._start?._dir??`se`}_onKeyDown(e,t,n){let r=e.key,i=e.shiftKey?10:1,a=0,o=0;switch(r){case`ArrowRight`:a=t.includes(`e`)?i:t.includes(`w`)?-i:0;break;case`ArrowLeft`:a=t.includes(`e`)?-i:t.includes(`w`)?i:0;break;case`ArrowDown`:o=t.includes(`s`)?i:t.includes(`n`)?-i:0;break;case`ArrowUp`:o=t.includes(`s`)?-i:t.includes(`n`)?i:0;break;case`Home`:case`End`:return;default:return}if(e.preventDefault(),this._destroyed)return;if(!this._kbHandle){let e=this.opts.target;this._c=this.opts.constraints();let r=Z(e),i=Dn(e);this._start={x:0,y:0,width:r.width,height:r.height,w0:r.width,h0:r.height,left:i.left,top:i.top,_dir:t},this._kbHandle=n,this._kbDir=t,this._dispatch(`resize:start`,t)}let s=this._start;this._applyClamped(s.width+a,s.height+o,t)}_endKeyboard(){if(!this._kbHandle)return;this._kbHandle=null,this._kbDir=null;let e=this._currentDir;this._start=null,this._c=null;let t=Z(this.opts.target);this._dispatch(`resize:end`,e,t.width,t.height)}_applyClamped(e,t,n){let r=this._start,{width:i,height:a}=Tn(e,t,n,this._c??this.opts.constraints());r.width=i,r.height=a,this.opts.apply(i,a,n,r),this.opts.onApplied?.(i,a,n),this._dispatch(`resize:move`,n,i,a)}applyExternal(e,t){let{width:n,height:r}=Tn(e,t,`se`,this.opts.constraints()),i=this.opts.target,a=Z(i),o=Dn(i);this.opts.apply(n,r,`se`,{x:0,y:0,width:a.width,height:a.height,w0:a.width,h0:a.height,left:o.left,top:o.top,_dir:`se`})}_dispatch(e,t,n,r){let i=n==null?Z(this.opts.target):{width:n,height:r??0};this.opts.eventTarget.dispatchEvent(new CustomEvent(e,{detail:{width:i.width,height:i.height,handle:t},bubbles:!0}))}};function kn(e,t,n){return r(`setVal`)(e,t,n)}function An(e){return r(`isSimpleStatePath`)(e)}var Q=`autospark-expandable-trigger`;function jn(e){let t=document.createElement(`div`);t.className=Q,t.setAttribute(`role`,`button`),t.setAttribute(`aria-label`,e.label??`展开/折叠`),t.tabIndex=0,t.setAttribute(`data-direction`,e.direction);let n=document.createElementNS(`http://www.w3.org/2000/svg`,`svg`);n.setAttribute(`aria-hidden`,`true`);let r=document.createElementNS(`http://www.w3.org/2000/svg`,`use`);return r.setAttribute(`href`,`#as-arrow`),n.appendChild(r),t.appendChild(n),t.addEventListener(`click`,()=>e.onActivate()),t.addEventListener(`keydown`,t=>{(t.key===`Enter`||t.key===` `)&&(t.preventDefault(),e.onActivate())}),t}var Mn=`
/* 主题化（ADR-0129）：三级样式回退链 var(--auto-X, var(--autospark-<feature>-X, 校准兜底值))；
   尺寸/圆形半径属功能几何不映射；暗色兜底变体见块尾（只切末级字面值） */
.${Q}{position:absolute;z-index:5;width:var(--autospark-expandable-trigger-size,20px);height:var(--autospark-expandable-trigger-size,20px);border-radius:50%;border:1px solid var(--auto-border-color, var(--autospark-expandable-trigger-border,#f0f0f0));background:var(--auto-bgcolor, var(--autospark-expandable-trigger-bg,#fff));box-shadow:var(--auto-shadow, var(--autospark-expandable-trigger-shadow,0 2px 4px hsl(240 3.8% 46.1% / 12%)));cursor:pointer;display:flex;align-items:center;justify-content:center;user-select:none;-webkit-user-select:none;transition:border-color .15s,background .15s,opacity .15s;color:var(--auto-third-color, var(--autospark-expandable-trigger-fg,rgba(96,96,96,0.55)));}
.${Q}>svg{width:var(--autospark-expandable-trigger-icon-size,12px);height:var(--autospark-expandable-trigger-icon-size,12px);stroke-width:1.5;transition:transform .15s,width .15s,height .15s;}
.${Q}:hover{border-color:var(--auto-hover-border-color, var(--autospark-expandable-trigger-border-hover,#009aff));background:var(--auto-hover-bgcolor, var(--autospark-expandable-trigger-bg-hover,rgba(0,154,255,0.15)));}
/* 滑轨定位基建：圆心半径变量（半圆数学/钳制表达式公共基准） */
.${Q}{--as-pos-half:calc(var(--autospark-expandable-trigger-size,20px)/2);}
/* 箭头旋转矩阵（展开态指向收起方向） */
.${Q}[data-direction="left"]>svg{transform:rotate(180deg);}
.${Q}[data-direction="right"]>svg{transform:rotate(0deg);}
.${Q}[data-direction="top"]>svg{transform:rotate(-90deg);}
.${Q}[data-direction="bottom"]>svg{transform:rotate(90deg);}
/* 折叠态通用（全圆形态，minSize>0 收缩折叠）：仅翻转箭头指向「重开方向」 */
.${Q}[data-collapsed][data-direction="left"]>svg{transform:rotate(0deg);}
.${Q}[data-collapsed][data-direction="right"]>svg{transform:rotate(180deg);}
.${Q}[data-collapsed][data-direction="top"]>svg{transform:rotate(90deg);}
.${Q}[data-collapsed][data-direction="bottom"]>svg{transform:rotate(-90deg);}
/* 半圆折叠态（data-half）：图标缩至 0.8 倍并平移 1/5 圆径移入半圆中心 */
.${Q}[data-half]>svg{width:calc(var(--autospark-expandable-trigger-icon-size,12px)*0.8);height:calc(var(--autospark-expandable-trigger-icon-size,12px)*0.8);}
.${Q}[data-half][data-direction="left"]>svg{transform:translateX(calc(var(--autospark-expandable-trigger-size,20px)/5)) rotate(0deg);}
.${Q}[data-half][data-direction="right"]>svg{transform:translateX(calc(var(--autospark-expandable-trigger-size,20px)*-1/5)) rotate(180deg);}
.${Q}[data-half][data-direction="top"]>svg{transform:translateY(calc(var(--autospark-expandable-trigger-size,20px)/5)) rotate(90deg);}
.${Q}[data-half][data-direction="bottom"]>svg{transform:translateY(calc(var(--autospark-expandable-trigger-size,20px)*-1/5)) rotate(-90deg);}
/* 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值 */
[dark] .${Q},[data-dark] .${Q}{border-color:var(--auto-border-color, var(--autospark-expandable-trigger-border,#606060));background:var(--auto-bgcolor, var(--autospark-expandable-trigger-bg,#606060));box-shadow:var(--auto-shadow, var(--autospark-expandable-trigger-shadow,0 2px 4px hsl(0 0% 0% / 50%)));color:var(--auto-third-color, var(--autospark-expandable-trigger-fg,rgba(250,250,250,0.55)));}
[dark] .${Q}:hover,[data-dark] .${Q}:hover{border-color:var(--auto-hover-border-color, var(--autospark-expandable-trigger-border-hover,#56baff));background:var(--auto-hover-bgcolor, var(--autospark-expandable-trigger-bg-hover,rgba(86,186,255,0.15)));}
`;function Nn(){gn(Mn,{id:`autospark-trigger-styles`})}var Pn=`ready`,Fn=`__AUTOSPARK_PLUGINS__`;function In(e){let t=globalThis.AutoSpark;if(typeof t?.[Pn]==`function`){e(t);return}let n=globalThis,r=n[Fn]??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}var Ln=`<div class="autospark-dialog" x-define="autospark.dialog">\r
    <!-- ADR-0124 决策 8：内嵌 overlay 结构骨架（chrome 出口 + header/footer + body 区），\r
         slots="*" 通配转发消费者 chrome 分段；内容（x-error 边界 live 段）经 overlay body\r
         出口的内置直通锚投递（default 段 shell 内容集 stash，见 OverlayInstance）。\r
         props 透传 OverlayConfig 骨架五字段（config 整包注入 shell data 域，ADR-0062） -->\r
    <!-- 属性形态宿主（元素名形态挂 props 值非法）：宿主化身组件根，模板根 class\r
         （autospark-overlay）并入宿主——原内容包装类的定位 CSS 语义保留。props 平铺读取：\r
         config 整包注入 shell data 域是字段级散开（ADR-0062 既有机制），无 config 键——\r
         点路径读法对 undefined 取成员会抛错（watcher 错误重试死循环） -->\r
    <div class="autospark-dialog-content" x-component:autospark.overlay="{ title: title, icon: icon, closeable: closeable, actions: actions, padding: padding }" x-component-options='{ slots: "*" }'></div>\r
    <div class="autospark-overlay-arrow"></div>\r
    <style global id="autospark-shell-styles">\r
        /* 主题化（ADR-0129）：三级样式回退链 var(--auto-X, var(--autospark-<feature>-X, 校准兜底值))；\r
             z-index 恒两级（永不映射）；暗色兜底变体只切末级字面值、不改变量引用链 */\r
        [data-overlay] {\r
            position: relative;\r
            border-radius: var(--auto-border-radius, var(--autospark-overlay-radius, 0.5rem));\r
        }\r
        .autospark-dialog > .autospark-dialog-content {\r
            position: relative;\r
            z-index: var(--autospark-overlay-z, 1000);\r
        }\r
        [data-overlay][data-overlay-border] {\r
            border: 1px solid var(--auto-border-color, var(--autospark-overlay-border, #f0f0f0));\r
            background: var(--auto-bgcolor, var(--autospark-overlay-bg, #fff));\r
            box-shadow: var(--auto-shadow, var(--autospark-overlay-shadow, 0 2px 4px hsl(240 3.8% 46.1% / 12%)));\r
        }\r
        .autospark-overlay-arrow {\r
            position: absolute;\r
            width: 8px;\r
            height: 8px;\r
            pointer-events: none;\r
        }\r
        .autospark-overlay-arrow::before {\r
            content: "";\r
            position: absolute;\r
            inset: 0;\r
            background: var(--auto-bgcolor, var(--autospark-overlay-bg, #fff));\r
            box-shadow: var(--auto-shadow, var(--autospark-overlay-shadow, 0 2px 4px hsl(240 3.8% 46.1% / 12%)));\r
            transform: rotate(45deg);\r
        }\r
        .autospark-overlay-arrow::after {\r
            content: "";\r
            position: absolute;\r
            inset: -1px;\r
            background: var(--auto-bgcolor, var(--autospark-overlay-bg, #fff));\r
            transform: rotate(45deg);\r
        }\r
        [data-overlay][data-overlay-border] > .autospark-overlay-arrow::before {\r
            background: var(--auto-border-color, var(--autospark-overlay-border, #f0f0f0));\r
        }\r
        [data-overlay][data-overlay-border] > .autospark-overlay-arrow::after {\r
            inset: -2px;\r
        }\r
        [data-overlay-placement^="top"] > .autospark-overlay-arrow::after {\r
            translate: 0 -4px;\r
        }\r
        [data-overlay-placement^="bottom"] > .autospark-overlay-arrow::after {\r
            translate: 0 4px;\r
        }\r
        [data-overlay-placement^="left"] > .autospark-overlay-arrow::after {\r
            translate: -4px 0;\r
        }\r
        [data-overlay-placement^="right"] > .autospark-overlay-arrow::after {\r
            translate: 4px 0;\r
        }\r
        [data-autospark-overlays] > [data-overlay] {\r
            z-index: var(--autospark-overlay-z, 1000);\r
        }\r
        /* 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值 */\r
        [dark] [data-overlay][data-overlay-border],\r
        [data-dark] [data-overlay][data-overlay-border] {\r
            border-color: var(--auto-border-color, var(--autospark-overlay-border, #606060));\r
            background: var(--auto-bgcolor, var(--autospark-overlay-bg, #606060));\r
            box-shadow: var(--auto-shadow, var(--autospark-overlay-shadow, 0 2px 4px hsl(0 0% 0% / 50%)));\r
        }\r
        [dark] [data-overlay][data-overlay-border] > .autospark-overlay-arrow::before,\r
        [data-dark] [data-overlay][data-overlay-border] > .autospark-overlay-arrow::before {\r
            background: var(--auto-border-color, var(--autospark-overlay-border, #606060));\r
        }\r
    </style>\r
</div>\r
`,Rn=`<div class="autospark-drawer" x-define="autospark.drawer">\r
    <!-- ADR-0124 决策 8：内嵌 overlay 结构骨架（同 dialog-shell 注记）；整壳滚动移除\r
         （决策 9：滚动归 overlay body 区）——高度链经宿主化身 100% 闭合（面板 fixed\r
         贴边 inset 对拉定高，贴边轴 100% 成立）。属性形态宿主：宿主化身组件根，\r
         autospark-overlay class（flex 列布局）并入宿主 -->\r
    <div class="autospark-drawer-slot" x-component:autospark.overlay="{ title: title, icon: icon, closeable: closeable, actions: actions, padding: padding }" x-component-options='{ slots: "*" }'></div>\r
    <style global id="autospark-shell-styles">\r
        .autospark-drawer {\r
            border-radius: 0;\r
            box-sizing: border-box;\r
        }\r
        .autospark-drawer > .autospark-drawer-slot {\r
            height: 100%;\r
        }\r
        .autospark-drawer[data-overlay-placement^="left"],\r
        .autospark-drawer[data-overlay-placement^="right"] {\r
            width: var(--autospark-drawer-size, 280px);\r
        }\r
        .autospark-drawer[data-overlay-placement^="top"],\r
        .autospark-drawer[data-overlay-placement^="bottom"] {\r
            height: var(--autospark-drawer-size, 280px);\r
        }\r
        .autospark-dialog-mask.drawer-enter-active,\r
        .autospark-dialog-mask.drawer-leave-active {\r
            transition: opacity 0.3s ease;\r
        }\r
        .autospark-dialog-mask.drawer-enter-from,\r
        .autospark-dialog-mask.drawer-leave-to {\r
            opacity: 0;\r
        }\r
        .autospark-overlays > .autospark-expandable-trigger {\r
            position: fixed;\r
            z-index: calc(var(--autospark-overlay-z, 1000) + 1);\r
            box-shadow: none;\r
            transition:\r
                left 0.3s ease,\r
                top 0.3s ease,\r
                clip-path 0.3s ease,\r
                border-color 0.15s,\r
                background 0.15s,\r
                opacity 0.15s;\r
        }\r
        .autospark-overlays > .autospark-expandable-trigger[data-show-trigger="hover"] {\r
            opacity: 0;\r
        }\r
        .autospark-overlays > .autospark-expandable-trigger[data-show-trigger="hover"]:hover,\r
        .autospark-overlays\r
            > .autospark-expandable-trigger[data-show-trigger="hover"]:focus-visible {\r
            opacity: 1;\r
        }\r
        .autospark-overlays > .autospark-expandable-trigger[data-collapsed] {\r
            /* 主题化（ADR-0129）：三级样式回退链；drawer 尺寸/z-index/贴边 radius 0 属功能几何不映射 */\r
            box-shadow: var(--auto-shadow, var(--autospark-expandable-trigger-shadow, 0 2px 4px hsl(240 3.8% 46.1% / 12%)));\r
            opacity: 1;\r
        }\r
        /* 暗色兜底变体（ADR-0129）：只切末级字面值 */\r
        [dark] .autospark-overlays > .autospark-expandable-trigger[data-collapsed],\r
        [data-dark] .autospark-overlays > .autospark-expandable-trigger[data-collapsed] {\r
            box-shadow: var(--auto-shadow, var(--autospark-expandable-trigger-shadow, 0 2px 4px hsl(0 0% 0% / 50%)));\r
        }\r
        @media (hover: none) {\r
            .autospark-overlays > .autospark-expandable-trigger[data-show-trigger="hover"] {\r
                opacity: 1;\r
            }\r
        }\r
        .autospark-overlays > .autospark-expandable-edge {\r
            position: fixed;\r
            display: none;\r
            z-index: calc(var(--autospark-overlay-z, 1000) + 1);\r
        }\r
        @media (hover: hover) {\r
            .autospark-overlays > .autospark-expandable-edge[data-show-trigger="hover"] {\r
                display: block;\r
            }\r
        }\r
        .autospark-overlays\r
            > .autospark-expandable-trigger[data-collapsed][data-direction="right"] {\r
            clip-path: inset(0 50% 0 0);\r
        }\r
        .autospark-overlays > .autospark-expandable-trigger[data-collapsed][data-direction="left"] {\r
            clip-path: inset(0 0 0 50%);\r
        }\r
        .autospark-overlays > .autospark-expandable-trigger[data-collapsed][data-direction="top"] {\r
            clip-path: inset(50% 0 0 0);\r
        }\r
        .autospark-overlays\r
            > .autospark-expandable-trigger[data-collapsed][data-direction="bottom"] {\r
            clip-path: inset(0 0 50% 0);\r
        }\r
    </style>\r
</div>\r
`,zn=`<div class="autospark-popover" x-define="autospark.popover">\r
    <!-- ADR-0124 决策 8：内嵌 overlay 结构骨架（同 dialog-shell 注记）；padding 归\r
         overlay body 区（padding props，决策 9 视觉变化接受），content 层不再显式 0px -->\r
    <!-- 属性形态宿主（元素名形态挂 props 值非法）：宿主化身组件根，模板根 class\r
         （autospark-overlay）并入宿主——原内容包装类的定位 CSS 语义保留。props 平铺读取\r
         （同 dialog-shell 注记：config 字段级散开，点路径读法抛错死循环） -->\r
    <div class="autospark-popover-content" x-component:autospark.overlay="{ title: title, icon: icon, closeable: closeable, actions: actions, padding: padding }" x-component-options='{ slots: "*" }'></div>\r
    <div class="autospark-overlay-arrow"></div>\r
    <style global id="autospark-popover-styles">\r
        /* 主题化（ADR-0129）：三级样式回退链 var(--auto-X, var(--autospark-<feature>-X, 校准兜底值))；\r
             z-index 恒两级（永不映射）；暗色兜底变体只切末级字面值、不改变量引用链 */\r
        [data-overlay] {\r
            position: relative;\r
            border-radius: var(--auto-border-radius, var(--autospark-overlay-radius, 0.5rem));\r
        }\r
        .autospark-popover > .autospark-popover-content {\r
            position: relative;\r
            z-index: var(--autospark-overlay-z, 1000);\r
        }\r
        [data-overlay][data-overlay-border] {\r
            border: 1px solid var(--auto-border-color, var(--autospark-overlay-border, #f0f0f0));\r
            background: var(--auto-bgcolor, var(--autospark-overlay-bg, #fff));\r
            box-shadow: var(--auto-shadow, var(--autospark-overlay-shadow, 0 2px 4px hsl(240 3.8% 46.1% / 12%)));\r
        }\r
        .autospark-overlay-arrow {\r
            position: absolute;\r
            width: 8px;\r
            height: 8px;\r
            pointer-events: none;\r
        }\r
        .autospark-overlay-arrow::before {\r
            content: "";\r
            position: absolute;\r
            inset: 0;\r
            background: var(--auto-bgcolor, var(--autospark-overlay-bg, #fff));\r
            box-shadow: var(--auto-shadow, var(--autospark-overlay-shadow, 0 2px 4px hsl(240 3.8% 46.1% / 12%)));\r
            transform: rotate(45deg);\r
        }\r
        .autospark-overlay-arrow::after {\r
            content: "";\r
            position: absolute;\r
            inset: -1px;\r
            background: var(--auto-bgcolor, var(--autospark-overlay-bg, #fff));\r
            transform: rotate(45deg);\r
        }\r
        [data-overlay][data-overlay-border] > .autospark-overlay-arrow::before {\r
            background: var(--auto-border-color, var(--autospark-overlay-border, #f0f0f0));\r
        }\r
        [data-overlay][data-overlay-border] > .autospark-overlay-arrow::after {\r
            inset: -2px;\r
        }\r
        [data-overlay-placement^="top"] > .autospark-overlay-arrow::after {\r
            translate: 0 -4px;\r
        }\r
        [data-overlay-placement^="bottom"] > .autospark-overlay-arrow::after {\r
            translate: 0 4px;\r
        }\r
        [data-overlay-placement^="left"] > .autospark-overlay-arrow::after {\r
            translate: -4px 0;\r
        }\r
        [data-overlay-placement^="right"] > .autospark-overlay-arrow::after {\r
            translate: 4px 0;\r
        }\r
        [data-autospark-overlays] > [data-overlay] {\r
            z-index: var(--autospark-overlay-z, 1000);\r
        }\r
        /* 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值 */\r
        [dark] [data-overlay][data-overlay-border],\r
        [data-dark] [data-overlay][data-overlay-border] {\r
            border-color: var(--auto-border-color, var(--autospark-overlay-border, #606060));\r
            background: var(--auto-bgcolor, var(--autospark-overlay-bg, #606060));\r
            box-shadow: var(--auto-shadow, var(--autospark-overlay-shadow, 0 2px 4px hsl(0 0% 0% / 50%)));\r
        }\r
        [dark] [data-overlay][data-overlay-border] > .autospark-overlay-arrow::before,\r
        [data-dark] [data-overlay][data-overlay-border] > .autospark-overlay-arrow::before {\r
            background: var(--auto-border-color, var(--autospark-overlay-border, #606060));\r
        }\r
    </style>\r
</div>\r
`,Bn=`<!--
  autospark.overlay：覆盖物家族通用结构骨架（ADR-0124）。

  header / body / footer 三段 + 七出口（title / header / body / footer /
  actions.top / actions.left / actions.right；裸 \`actions\` = actions.right 的
  收集侧等价别名，归一在消费侧收集裁决完成）。chrome 出口由消费方投影：
  内置 shell 经 \`x-component-options.slots="*"\` 上行转发消费者分段（ADR-0125），
  自定义 shell 可显式提供或同名覆盖。fallback 承载默认渲染：

  - title 出口 fallback：icon + title props 文本（x-icon 表达式形态防空值字面量回退）；
  - actions.* 出口 fallback：props.actions 按 pos 归位过滤的按钮组（created 期
    分组进 _topActions/_leftActions/_rightActions，order 升序稳定排序）；
  - header / footer 出口整块替换：出口有内容时 fallback（含 close 按钮）让位，
    closeable 失效（ADR-0124 决策 2）；
  - header/footer 条件渲染（决策 3 修订：closeable 移出 header 判定集——header 只看
    内容：title ∥ icon ∥ title 出口 ∥ actions.top 出口 ∥ pos=top actions）：props
    （响应式）+ 出口内容命中（编译期静态——created 期沿持有者链复算 _chrome 旗标，
    重开/重建即重评）；
  - close 按钮双形态（决策 3 修订）：header 有内容 → 行内 x（header flex 尾部，
    top actions 最右）；header 无内容且 closeable !== false → 根级绝对定位浮动 x
    （右上角 0.375em，两份 DOM 互斥——对偶条件与 header x-show 同构）；
  - body 出口恒渲染，padding props 控制内边距（默认 0.5em）。

  close 按钮复用全局 close 信号 action（x-on 裸名 → method miss → getAction 链
  → SIGNAL_ACTIONS.close → action:close 冒泡 → 实例根委托 requestClose，决策 5）。
-->
<div class="autospark-overlay" x-define="autospark.overlay">
    <!-- 浮动 close（决策 3 修订）：header 不渲染且可关时的根级绝对定位 x——
         条件 = header 判定集取反 ∩ closeable（与 header 行内 x 互斥对偶） -->
    <button class="autospark-overlay-close autospark-overlay-close-floating" type="button"
        x-show="closeable !== false && !(_chrome.header || !!title || !!icon || _chrome.title || _chrome['actions.top'] || _topActions.length > 0)"
        x-on:click="close" x-icon="'no'" aria-label="关闭"></button>
    <!-- header 区：出口整块替换 or 默认结构（title / actions.top / close） -->
    <div class="autospark-overlay-header" x-slot:header
        x-show="_chrome.header || !!title || !!icon || _chrome.title || _chrome['actions.top'] || _topActions.length > 0">
        <div class="autospark-overlay-title" x-slot:title x-show="_chrome.title || !!title || !!icon">
            <i class="autospark-overlay-icon" x-icon="icon || null"></i>
            <span class="autospark-overlay-title-text" x-text="title"></span>
        </div>
        <div class="autospark-overlay-actions autospark-overlay-actions-top" x-slot:actions.top
            x-show="_chrome['actions.top'] || _topActions.length > 0">
            <template x-for="a of _topActions" :key="a.id">
                <button class="autospark-overlay-action" type="button" x-bind:title="a.tooltip || null"
                    x-on:click="a.handle($event)">
                    <i x-show="!!a.icon" x-icon="a.icon"></i>
                    <span x-show="!a.icon" x-text="a.title"></span>
                </button>
            </template>
        </div>
        <button class="autospark-overlay-close" type="button" x-show="closeable !== false" x-on:click="close"
            x-icon="'no'" aria-label="关闭"></button>
    </div>
    <!-- body 区：恒渲染（内容出口的直通位）；padding 归一走 _bodyStyle。
         直通锚（ADR-0124 决策 8 实现偏差注记）：shell 默认出口语义内置于本 fallback——
         内容收集管线剥离嵌套 x-slot 标记（ADR-0056 决策九），直通锚不可经 shell 内容段
         携带（<template x-slot:body><div x-slot> 形态锚会被剥），故锚写在 overlay 模板内：
         body 出口无内容命中时 fallback 渲染，锚（default 出口）沿 slots="*" 转发链上溯
         shell 内容集命中活体边界直挂；自定义 shell 显式提供 body 段时 fallback 让位 -->
    <div class="autospark-overlay-body" x-slot:body x-bind:style="_bodyStyle">
        <div class="autospark-overlay-body-anchor" x-slot></div>
    </div>
    <!-- footer 区：出口整块替换 or 默认动作区（左 / 右） -->
    <div class="autospark-overlay-footer" x-slot:footer
        x-show="_chrome.footer || _chrome['actions.left'] || _chrome['actions.right'] || _leftActions.length > 0 || _rightActions.length > 0">
        <div class="autospark-overlay-actions autospark-overlay-actions-left" x-slot:actions.left
            x-show="_chrome['actions.left'] || _leftActions.length > 0">
            <template x-for="a of _leftActions" :key="a.id">
                <button class="autospark-overlay-action" type="button" x-bind:title="a.tooltip || null"
                    x-on:click="a.handle($event)">
                    <i x-show="!!a.icon" x-icon="a.icon"></i>
                    <span x-show="!a.icon" x-text="a.title"></span>
                </button>
            </template>
        </div>
        <div class="autospark-overlay-actions autospark-overlay-actions-right" x-slot:actions.right
            x-show="_chrome['actions.right'] || _rightActions.length > 0">
            <template x-for="a of _rightActions" :key="a.id">
                <button class="autospark-overlay-action" type="button" x-bind:title="a.tooltip || null"
                    x-on:click="a.handle($event)">
                    <i x-show="!!a.icon" x-icon="a.icon"></i>
                    <span x-show="!a.icon" x-text="a.title"></span>
                </button>
            </template>
        </div>
    </div>
    <style global id="autospark-overlay-styles">
        .autospark-overlay {
            display: flex;
            flex-direction: column;
            min-width: 0;
            min-height: 0;
            /* 浮动 close 的定位基准（决策 3 修订：header 不渲染时 x 绝对定位右上角） */
            position: relative;
        }

        .autospark-overlay-header {
            display: flex;
            align-items: center;
            gap: 0.5em;
            padding: 0.5em 0.75em;
            border-bottom: 1px solid var(--autospark-overlay-divider, rgba(0, 0, 0, 0.08));
            flex: none;
        }

        .autospark-overlay-title {
            display: flex;
            align-items: center;
            gap: 0.4em;
            flex: 1 1 auto;
            min-width: 0;
            font-weight: 600;
        }

        .autospark-overlay-title-text {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .autospark-overlay-actions {
            display: flex;
            align-items: center;
            gap: 0.375em;
            flex: none;
        }

        .autospark-overlay-actions-top {
            margin-left: auto;
        }

        .autospark-overlay-close {
            flex: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 1.75em;
            height: 1.75em;
            padding: 0;
            border: none;
            border-radius: 0.375em;
            background: transparent;
            color: inherit;
            cursor: pointer;
        }

        .autospark-overlay-close:hover {
            background: var(--autospark-overlay-hover, rgba(0, 0, 0, 0.06));
        }

        /* 浮动形态（决策 3 修订）：header 不渲染时绝对定位右上角，压在 body padding 区之上
           （padding: 0 + 内容贴角时遮挡内容——已知取舍）；z-index 确保浮于 body 内容 */
        .autospark-overlay-close-floating {
            position: absolute;
            top: 0.375em;
            right: 0.375em;
            z-index: 1;
        }

        .autospark-overlay-body {
            flex: 1 1 auto;
            min-height: 0;
            overflow: auto;
        }

        .autospark-overlay-body-anchor {
            display: contents;
        }

        .autospark-overlay-footer {
            display: flex;
            align-items: center;
            gap: 0.5em;
            padding: 0.5em 0.75em;
            border-top: 1px solid var(--autospark-overlay-divider, rgba(0, 0, 0, 0.08));
            flex: none;
        }

        .autospark-overlay-actions-right {
            margin-left: auto;
        }

        .autospark-overlay-action {
            display: inline-flex;
            align-items: center;
            gap: 0.3em;
            padding: 0.3em 0.75em;
            border: 1px solid var(--autospark-overlay-action-border, rgba(0, 0, 0, 0.12));
            border-radius: 0.375em;
            background: transparent;
            color: inherit;
            font: inherit;
            cursor: pointer;
        }

        .autospark-overlay-action:hover {
            background: var(--autospark-overlay-hover, rgba(0, 0, 0, 0.06));
        }

        /* 顶区动作与 close 同处 header 行：幽灵图标钮风格（无边框，hover 底色统一）；
           footer 动作保留按钮边框（取消/确认等决策性操作） */
        .autospark-overlay-actions-top .autospark-overlay-action {
            border: none;
        }
    </style>
    <script setup>
        ({
            data: () => ({
                _chrome: {
                    title: false,
                    header: false,
                    footer: false,
                    "actions.top": false,
                    "actions.left": false,
                    "actions.right": false,
                },
                _topActions: [],
                _leftActions: [],
                _rightActions: [],
                _bodyStyle: {},
            }),
            created() {
                // ── chrome 出口内容命中（ADR-0124 决策 3，编译期静态）──
                // 复刻 SlotDirective 持有者链查找（ADR-0125 白名身上溯 + 转发翻译接力），
                // 起点为自身 scope（与出口元素 parent 链同位）。内置 shell 场景：自身内容集
                // 仅 body 直通段，转发声明 \`*\` 使 chrome 名原名上溯命中 shell 内容集（消费者
                // 分段 stash，OverlayInstance）；自定义 shell 显式提供段时同链命中。
                const chrome = this.data._chrome;
                const hasOutlet = (name) => {
                    let holder = this.scope || null;
                    let lookup = name;
                    while (holder) {
                        if (holder.slotContents || holder.slotForwarding) {
                            const hit = holder.slotContents?.get(lookup);
                            if (hit) return true;
                            const fw = holder.slotForwarding;
                            const translated = fw
                                ? fw.map.get(lookup) || (fw.wildcard ? lookup : null)
                                : null;
                            if (translated === null) return false; // 持有者已定：无段且不转发 → 边界
                            lookup = translated;
                        }
                        holder = holder.parent;
                    }
                    return false;
                };
                for (const k of Object.keys(chrome)) chrome[k] = hasOutlet(k);
                // ── actions 分组（ADR-0124 决策 4：pos 归位 + order 升序稳定排序）──
                // top → 顶区；left → 左区；right / auto / bottom / 无 pos → 右区。
                // 无 handle 条目剪枝（防御，正常经合并通道到达的条目 handle 必在）；
                // 无 id 条目补合成键（x-for :key 稳定锚）。
                const regroup = (list) => {
                    const rows = (Array.isArray(list) ? list : []).filter(
                        (a) => a && typeof a.handle === "function",
                    );
                    const withId = rows.map((a, i) =>
                        a.id != null ? a : Object.assign({}, a, { id: "__overlay_action_" + i }),
                    );
                    const top = withId.filter((a) => a.pos === "top");
                    const left = withId.filter((a) => a.pos === "left");
                    const right = withId.filter((a) => a.pos !== "top" && a.pos !== "left");
                    const byOrder = (x, y) =>
                        (x.order == null ? 0 : x.order) - (y.order == null ? 0 : y.order);
                    top.sort(byOrder);
                    left.sort(byOrder);
                    right.sort(byOrder);
                    // 变更守卫：watch 回调可能因键缺位退化为空 deps watch-all（任意变更触发），
                    // 无条件写新数组引用会自反馈成死循环——组员引用与顺序均未变时跳过写入
                    const same = (key, next) => {
                        const cur = this.data[key];
                        return (
                            Array.isArray(cur) &&
                            cur.length === next.length &&
                            next.every((a, i) => a === cur[i])
                        );
                    };
                    // markRaw：组员含 handle 函数——autostore 见函数即求值（计算属性语义），
                    // 分组数组赋入响应式 data 前须标记豁免，否则点击时读到求值结果而非函数
                    if (!same("_topActions", top)) this.data._topActions = markRaw(top);
                    if (!same("_leftActions", left)) this.data._leftActions = markRaw(left);
                    if (!same("_rightActions", right)) this.data._rightActions = markRaw(right);
                };
                regroup(this.watch("actions", (r) => regroup(r.value)));
                // ── body 内边距（决策 6：padding props，默认 0.5em；number → px）──
                const bodyStyle = (p) => {
                    const pad =
                        typeof p === "number" && p >= 0
                            ? p + "px"
                            : typeof p === "string" && p.trim() !== ""
                                ? p
                                : "0.5em";
                    // 变更守卫：同 regroup——键缺位退化 watch-all 时避免无条件写新对象自反馈
                    if (this.data._bodyStyle?.padding !== pad) {
                        this.data._bodyStyle = { padding: pad };
                    }
                };
                bodyStyle(this.data.padding);
                this.watch("padding", (r) => bodyStyle(r.value));
            },
        })
    <\/script>
</div>`;function Vn(e){let t=e.components;t[`autospark.dialog`]===void 0&&(t[c]=Ln),t[`autospark.popover`]===void 0&&(t[u]=zn),t[`autospark.drawer`]===void 0&&(t[l]=Rn),t[`autospark.overlay`]===void 0&&(t[f]=Bn)}function Hn(e){let t={dialog:c,popover:u,drawer:l},n=new Set([`title`,`header`,`footer`,`actions.top`,`actions.left`,`actions.right`]),r=new Set,i=new Set([`top`,`bottom`,`left`,`right`]),a=`right`;class o extends e{constructor(...e){super(...e),this.overlayKind=``,this.directiveLabel=`x-dialog`,this._overlayInstance=null,this._driveOn=!1,this._keepaliveCache=new Map,this._remoteAbort=null,this._resizeMem=null}static ownsChildren(){return!1}static{this.singleton=!1}static{this.overlayConsumer=!0}get overlayName(){return this.attr??``}get _modalMask(){return!1}created(){this.binding?.hostOptions&&`props`in this.binding.hostOptions&&this.warn(`${this.directiveLabel}:${this.attr}: 宿主 x-options 中的 props 键不被接受（props 走 x-dialog-options.props 指令级通道），已忽略`);let e=this.info.optionExprs?.props,t;if(e!==void 0){if(t=[`props`],e.trim()===``)this.warn(`${this.directiveLabel}:${this.attr}: props 成员属性的值为空（须提供表达式：对象字面量或状态路径），已忽略`);else{let t=this.binding.watch(e,({value:e})=>this._onPropsChange(e),{depth:2});this._onPropsChange(t)}}else{let e=this.options?.props;e!==void 0&&this._onPropsChange(e)}this._watchOptionExprs(t)}_open(){this._instantiate(this.overlayName)}_close(){let e=this._overlayInstance;e&&!e.destroyed&&e.visible&&e.close()}_onPropsChange(e){let t;Array.isArray(e)?this.warn(`${this.directiveLabel}:${this.attr}: props 值须为对象（字面量或状态对象），数组已忽略: ${JSON.stringify(e)}`):typeof e==`object`&&e?t=e:e!=null&&this.warn(`${this.directiveLabel}:${this.attr}: props 值须为对象（字面量或状态对象），已忽略: ${JSON.stringify(e)}`),this._props=t;let n=this._overlayInstance;n&&!n.destroyed&&n.isFragment&&n.instanceScope?.data&&(this._propsEqual(t,this._appliedProps)||(t&&Object.assign(n.instanceScope.data,t),this._appliedProps=t))}_instantiate(t){let{props:n,...r}=this.options??{},i=this._resolveConfig(r),a=Mt(t,i);if(i.keepalive===!0){let e=this._keepaliveCache.get(a);if(e&&!e.destroyed){this._overlayInstance=e,e.open();return}e&&this._keepaliveCache.delete(a)}let o=typeof i.url==`string`?i.url.trim():``,s=this._findComponentDef(t);if(s&&this._recursiveDepth(t)>=e.MAX_DEPTH){this.warn(`${this.directiveLabel}:${this.attr}: 组件 "${t}" 递归实例化深度超过上限（${e.MAX_DEPTH}），已停止（疑似无终止条件递归）。`);return}let c=this._collectSlotGroup(t),l=this._splitOverlaySlots(c,s?.def?.slots);this._splitContent=l.content;let u=this._mergeOverlayActions(i.actions);u&&(i.actions=u);let d=this._resolveShell(i),f=new Lt(this.engine,t,document.createElement(`div`),null,i,{parentScope:this.binding,searchRoot:this.el??null,mask:this._modalMask,shell:d,positioner:this._positioner(),onPanelReady:e=>this._attachResize(e),cacheKey:a});f.chromeSlots=l.chrome,f.onCloseRequest=this._makeCloseRequest(),this._overlayInstance=f,i.keepalive===!0&&this._keepaliveCache.set(a,f),f.open();let p=this._hostCtx(i),m=()=>this._regenerateContent(f,i,t,o);Kt(p,f,m),m()}_hostCtx(e){return{engine:this.engine,warn:e=>this.warn(`${this.directiveLabel}:${this.attr}: ${e}`),registerScope:this.binding.parent,findComponent:e=>this._findComponentDef(e),resolveParentScope:t=>e.dataContext===void 0?this.binding:this._resolveParentScope(e,t).parentScope,onFragmentApplied:e=>{this._appliedProps=e}}}_probe(e,t,n,r,i,a){this._remoteAbort?.abort();let o=this._remoteAbort=new AbortController;return Wt(e,t,n,r,i,a,()=>this._props,o.signal).finally(()=>{this._remoteAbort===o&&(this._remoteAbort=null)})}_regenerateContent(e,t,n,r){let i=this._hostCtx(t),a=i.findComponent(n),o=this._splitContent===void 0?this._collectSlotGroup(n):this._splitContent,s=this._propsValueText();a?J(i,e,n,a.def,s,o):r===``?(this.warn(`${this.directiveLabel}:${this.attr}: 未找到覆盖物组件 "${n}"（scope 链与全局均未命中），面板已开并显示加载占位——组件注册后自动挂载（ADR-0123）`),J(i,e,n,null,s,o)):this._probe(i,e,n,r,o,s)}_propsValueText(){let e=this.info.optionExprs?.props;if(e!==void 0&&e.trim()!==``)return e;let t=this.options?.props;if(t!==void 0)try{return JSON.stringify(t)}catch(e){return this.warn(`${this.directiveLabel}:${this.attr}: 静态 props 序列化失败，已忽略: ${e?.message??e}`),null}return null}_resolveConfig(e){return Jt(e,this._optionExprValues)}_positioner(){}_resolveShell(e){let n=this.overlayKind,r=n?this.engine.options.overlay?.[n]?.shell:void 0,i=e.shell??r,a=i==null?``:String(i).trim();if(a!==``){let e=this._findComponentDef(a);if(e)return{name:a,snapshot:e.snapshot,def:e.def};this.warn(`${this.directiveLabel}:${this.attr}: shell "${a}" 未命中（scope 链与全局组件表均无），回退内置默认 shell（若来自 x-import 请先注册再打开）（ADR-0062）`)}let o=n!=null&&t[n]||`autospark.dialog`;return{name:o,...this.engine._resolveGlobalComponentFull(o)}}_collectSlotGroup(e){return this.template?hn(this.template,this._overlayConsumers(),e=>this.warn(`${this.directiveLabel}:${this.attr}: ${e}`)).get(e)??null:null}_overlayConsumers(){return this.binding.directives.filter(e=>e instanceof o).map(e=>e.overlayName).filter(e=>e!==``)}_splitOverlaySlots(e,t){if(!e||e.length===0)return{content:e,chrome:null};let r=t&&t.length>0?new Set(t):null,i=[],a=[];for(let t of e){let e=t instanceof HTMLElement?$t(t):null,o=e?e.name:`default`,s=o===`actions`?`actions.right`:o;!r?.has(o)&&n.has(s)?a.push(t):i.push(t)}if(a.length===0)return{content:e,chrome:null};let o=e=>this.warn(`${this.directiveLabel}:${this.attr}: ${e}`),s=un(a,void 0,o,{skipValidation:!0}),c=new Map;for(let[e,t]of s??[]){let n=e===`actions`?`actions.right`:e;c.has(n)&&o(`x-slot: chrome 内容 "${n}" 重复（裸 actions 与 actions.right 并存），后者已生效`),c.set(n,t)}return{content:i.length>0?i:null,chrome:c.size>0?c:null}}_mergeOverlayActions(e){let t=new Map,n=(e,n)=>{n&&typeof n.handle==`function`&&(n.pos===`top`||n.pos===`left`||n.pos===`right`)&&t.set(e,n)};for(let[e,t]of Object.entries(this.engine.actions))n(e,t);let r=[];for(let e=this.binding;e;e=e.parent)r.push(e);for(let e=r.length-1;e>=0;e--){let t=r[e].actions;if(t)for(let[e,r]of Object.entries(t))n(e,r)}return(e??[]).forEach((e,n)=>{if(!e||typeof e.handle!=`function`){this.warn(`${this.directiveLabel}:${this.attr}: config.actions 第 ${n} 项缺执行体（handle），已忽略（ADR-0124）`);return}let r=typeof e.id==`string`&&e.id!==``?e.id:`__overlay_config_${n}`;t.set(r,e)}),t.size>0?Array.from(t.values()):null}destroy(){if(this._remoteAbort?.abort(),this._remoteAbort=null,this._keepaliveCache.size){for(let e of[...this._keepaliveCache.values()])e.destroyed||e.destroy();this._keepaliveCache.clear()}super.destroy()}_resolveParentScope(e,t){return Nt(e.dataContext===void 0?`declarer`:e.dataContext,t,this.binding,this.engine,e=>this.warn(`${this.directiveLabel}:${this.attr}: ${e}`))}_makeCloseRequest(){return null}_resizeAllowedHandles(){return null}_applyResize(e,t,n,r){e.style.width=`${t}px`,e.style.height=`${n}px`}_attachResize(e){let t=e.config.resize;if(t==null||t===!1)return;let n=e=>this.warn(`${this.directiveLabel}:${this.attr}: ${e}`),r=this._resizeAllowedHandles();if(!r){n(`resize 选项在该形态不受支持，已忽略（ADR-0064）`);return}let i=r,a=null;if(t!==!0){if(typeof t!=`object`){n(`resize 须为 true 或选项对象（与 x-resizable 选项同构），已忽略: ${JSON.stringify(t)}`);return}if(a=t,a.handles!=null){let e=En(a,n);i=e.filter(e=>r.includes(e));let t=e.filter(e=>!r.includes(e));t.length&&n(`resize.handles 方向 ${t.join(`,`)} 不在形态合法集 ${r.join(`,`)} 内，已忽略（handles 只能收窄，ADR-0064）`)}}if(i.length===0){n(`resize 手柄集为空，跳过挂载`);return}let o=new On({target:e.panel,eventTarget:this.el,handles:i,constraints:()=>Cn(a,e.panel,n),apply:(t,n,r)=>this._applyResize(e.panel,t,n,r),onApplied:(e,t)=>{this._resizeMem={width:e,height:t}},warn:n});o.attach(),e.registerCleanup(()=>o.destroy())}}class d extends o{constructor(...e){super(...e),this._visiblePath=null,this._visibleExpr=null}created(){super.created();let e=String(this.value??``).trim();if(e.startsWith(`{`)){this.warn(`${this.directiveLabel}:${this.attr}: 对象形态已删除（ADR-0052 v2.3）——visible 写指令值、props 写 ${this.directiveLabel}-options.props、配置写 ${this.directiveLabel}-options，指令被忽略`);return}if(this._visibleExpr=e,this._visibleExpr===``){this.warn(`${this.directiveLabel}:${this.attr}: 缺少 visible 绑定，恒不打开。请声明状态路径或表达式（ADR-0052 决策 6）`);return}let t=this._resolveLiteral(this._visibleExpr);if(t!==null){t&&(this._driveOn=!0,this._open());return}this._visiblePath=An(this._visibleExpr)?this._visibleExpr:null;let n=this.binding.watch(this._visibleExpr,({value:e})=>this._toggle(!!e));this._toggle(!!n)}destroy(){let e=this._overlayInstance;this._overlayInstance=null,e&&!e.destroyed&&e.visible&&e.requestClose(`consumer-destroyed`),super.destroy()}_makeCloseRequest(){return this._visiblePath?()=>this._writeVisible(!1):null}_toggle(e){this._driveOn=e,e?this._open():this._close()}_resolveLiteral(e){let t=(e??``).trim().toLowerCase();return t===`true`||t!==`false`&&null}_writeVisible(e){let t=this._visiblePath,n=t.split(this.engine.store.delimiter),r=this.binding;for(;r;){let t=r.locals&&n[0]in r.locals?r.locals:r._data&&n[0]in r._data?r._data:null;if(t){let r=t;for(let e=0;e<n.length-1;e++)if(r=r?.[n[e]],r==null)return;r[n[n.length-1]]=e;return}r=r.parent}try{kn(this.engine.store.state,n,e)}catch(e){this.warn(`${this.directiveLabel}:${this.attr}: visible 回写失败（"${t}"）: ${e?.message??e}`)}}}class f extends d{constructor(...e){super(...e),this.overlayKind=`dialog`}static initialize(e){}get _modalMask(){return!0}_resizeAllowedHandles(){return[`ne`,`nw`,`se`,`sw`]}}class p extends o{constructor(...e){super(...e),this.overlayKind=`popover`,this.directiveLabel=`x-popover`,this._showTimer=null,this._hideTimer=null,this._lastPointer=null,this._unsubClose=null,this._unsubDocClick=null,this._onEnter=e=>{if(this._resolveTrigger()!==`hover`||(this._recordPointer(e),this._clearHideTimer(),this._isInstanceAlive()))return;let t=this._resolveDelay(`delayShow`,200);this._clearShowTimer(),t>0?this._showTimer=setTimeout(()=>{this._showTimer=null,this._resolveTrigger()===`hover`&&this._openNow()},t):this._openNow()},this._onLeave=e=>{this._resolveTrigger()===`hover`&&(this._recordPointer(e),this._clearShowTimer(),this._scheduleClose(e))},this._onClick=()=>{this._resolveTrigger()===`click`&&(this._clearShowTimer(),this._clearHideTimer(),this._isInstanceAlive()?this._closeNow():this._openNow())},this._onPanelEnter=e=>{this._resolveTrigger()===`hover`&&(this._recordPointer(e),this._clearHideTimer())},this._onPanelLeave=e=>{this._resolveTrigger()===`hover`&&(this._recordPointer(e),this._scheduleClose(e))},this._onDocClick=e=>{let t=e.target instanceof Element?e.target:null;if(t&&(this.el===t||this.el.contains(t)))return;let n=this._overlayInstance?.el;(!n||n!==t&&!n.contains(t))&&this._closeNow()}}static initialize(e){}created(){if(super.created(),!this.attr){this.warn(`x-popover: 缺少组件名 attr（x-popover:名称），无法查找覆盖物组件，指令被忽略`);return}let e=String(this.value??``).trim();e&&this.warn(`x-popover:${this.attr}: 指令值不参与驱动（触发模型无 visible 真相源，显示由宿主悬浮/点击驱动，见 trigger 选项），已忽略值 "${e}"`);let t=this.binding.directives.filter(e=>e instanceof p);t.length>1&&this.warn(`x-popover:${this.attr}: 同宿主声明了 ${t.length} 个 popover 消费者，触发源重合，同一次触发将同时打开全部面板`),this.el.addEventListener(`mouseenter`,this._onEnter),this.el.addEventListener(`mouseleave`,this._onLeave),this.el.addEventListener(`click`,this._onClick)}destroy(){this._teardownTriggers();let e=this._overlayInstance;this._overlayInstance=null,e&&!e.destroyed&&e.visible&&e.requestClose(`consumer-destroyed`),super.destroy()}_open(){this._unsubInstanceClose(),this._instantiate(this.overlayName,this._props),this._attachInstance()}_retryPendingComponent(){super._retryPendingComponent(),this._attachInstance()}_resolveConfig(e){let t=super._resolveConfig(e),n=jt(t.at)??{};return n.selector??=this.el,n.placement??=`bottom`,t.at=n,t.closeable??=!1,t}_isInstanceAlive(){let e=this._overlayInstance;return!!e&&!e.destroyed&&e.visible}_openNow(){this._driveOn=!0,this._open()}_scheduleClose(e){let t=e.relatedTarget instanceof Element?e.relatedTarget:null;if(t&&this._inZone(t)){this._clearHideTimer();return}let n=this._resolveDelay(`delayHide`,150);this._clearHideTimer(),n>0?this._hideTimer=setTimeout(()=>{this._hideTimer=null,this._closeNow()},n):this._closeNow()}_closeNow(){this._driveOn=!1,this._close()}_inZone(e){if(!e)return!1;let t=new Set;this._collectZone(t);for(let n of t)if(n===e||n.contains(e))return!0;return!1}_collectZone(e){e.add(this.el);let t=this._overlayInstance;t&&!t.destroyed&&t.el&&e.add(t.el);for(let t of r)if(!(t===this||e.has(t.el))){for(let n of e)if(n.contains(t.el)){t._collectZone(e);break}}}_reevaluate(){if(!this._isInstanceAlive())return;let e=this._lastPointer,t=e&&typeof document<`u`?document.elementFromPoint(e.x,e.y):null;t&&this._inZone(t)?this._clearHideTimer():this._closeNow()}_onInstanceClosed(){this._unsubInstanceClose(),this._unsubDocClick?.(),this._unsubDocClick=null,r.delete(this),this._clearHideTimer(),this._clearShowTimer(),this._driveOn=!1,this._overlayInstance=null,this._notifyAncestors()}_notifyAncestors(){for(let e of r){if(e===this||e._resolveTrigger()===`click`)continue;let t=e._overlayInstance?.el;t&&t.contains(this.el)&&e._reevaluate()}}_attachInstance(){let e=this._overlayInstance;if(!e||e.destroyed||!e.el)return;e.el.addEventListener(`mouseenter`,this._onPanelEnter),e.el.addEventListener(`mouseleave`,this._onPanelLeave),this._applyContentPadding(e.el),r.add(this),this._resolveTrigger()===`click`&&(document.addEventListener(`click`,this._onDocClick,!0),this._unsubDocClick=()=>document.removeEventListener(`click`,this._onDocClick,!0));let t=this.engine.on(`overlay:close`,t=>{(t?.payload??t)?.instance===e&&this._onInstanceClosed()});this._unsubClose=typeof t==`function`?t:()=>t.off()}_applyContentPadding(e){let t=this._resolvePadding(),n=e.querySelector(`.autospark-popover-content`);n&&(n.style.padding=t)}_resolvePadding(){let e=this.getOption(`padding`);return e==null||e===``?``:typeof e==`number`?!Number.isFinite(e)||e<0?(this.warn(`x-popover:${this.attr}: padding 须为非负数字（px）或 CSS 长度字符串，已按默认 0 处理`),``):`${e}px`:String(e)}_resolveTrigger(){let e=this.getOption(`trigger`);if(e==null||e===``)return this.getOption(`click`)===!0?`click`:`hover`;let t=String(e).trim();return t===`hover`||t===`click`?t:(this.warn(`x-popover:${this.attr}: trigger 须为 'hover' | 'click'，已按默认 'hover' 处理`),`hover`)}_resolveDelay(e,t){let n=this.getOption(e);if(n==null||n===``)return t;let r=Number(n);return!Number.isFinite(r)||r<0?(this.warn(`x-popover:${this.attr}: ${e} 须为非负数字（ms），已按默认 ${t}ms 处理`),t):r}_recordPointer(e){this._lastPointer={x:e.clientX,y:e.clientY}}_clearShowTimer(){this._showTimer&&=(clearTimeout(this._showTimer),null)}_clearHideTimer(){this._hideTimer&&=(clearTimeout(this._hideTimer),null)}_unsubInstanceClose(){this._unsubClose&&=(this._unsubClose(),null)}_teardownTriggers(){this.el.removeEventListener(`mouseenter`,this._onEnter),this.el.removeEventListener(`mouseleave`,this._onLeave),this.el.removeEventListener(`click`,this._onClick),this._clearShowTimer(),this._clearHideTimer(),this._unsubInstanceClose(),this._unsubDocClick?.(),this._unsubDocClick=null,r.delete(this)}}class m extends d{constructor(...e){super(...e),this.overlayKind=`drawer`,this.directiveLabel=`x-drawer`,this._config=null,this._triggerEl=null,this._triggerOn=!1,this._triggerCleanup=null,this._edgeEl=null,this._triggerFrame=null,this._triggerTimer=null,this._resizeSyncFrame=null,this._suppressTriggerClick=!1}static initialize(e){Nn()}created(){if(super.created(),this.getOption(`expandable`)===!1||!this._visiblePath)return;let e=s(this.engine);if(!e)return;let t=jn({direction:this._screenPlacement(),onActivate:()=>this._onTriggerClick(),label:`抽屉展开/折叠`}),n=this.getOption(`expandable`)?.showTrigger;if(n!=null&&n!==`hover`&&n!==`always`&&this.warn(`x-drawer:${this.attr}: expandable.showTrigger 值 "${n}" 无效（hover/always），已回退 hover`),t.setAttribute(`data-show-trigger`,n===`always`?`always`:`hover`),n!==`always`&&!this.getOption(`resize`)){let e=document.createElement(`div`);e.className=`autospark-expandable-edge`,e.setAttribute(`aria-hidden`,`true`),e.setAttribute(`data-show-trigger`,`hover`),this._edgeEl=e}t.addEventListener(`pointerdown`,e=>this._onTriggerPointerDown(e)),this._triggerEl=t,this._positionTrigger(),this._edgeEl&&e.appendChild(this._edgeEl),e.appendChild(t);let r=()=>this._positionTrigger();window.addEventListener(`resize`,r),window.addEventListener(`scroll`,r,!0),this._triggerCleanup=()=>{window.removeEventListener(`resize`,r),window.removeEventListener(`scroll`,r,!0)}}_onOptionExprChange(e,t){e===`expandable`&&this._positionTrigger()}destroy(){this._triggerCleanup?.(),this._triggerCleanup=null,this._cancelTriggerSync(),this._edgeEl?.remove(),this._edgeEl=null,this._triggerEl?.remove(),this._triggerEl=null,super.destroy()}_open(){super._open(),this._triggerOn=!0,this._cancelTriggerSync(),this._triggerFrame=requestAnimationFrame(()=>{this._triggerTimer=setTimeout(()=>{this._triggerFrame=null,this._triggerTimer=null,this._positionTrigger()},0)})}_close(){super._close(),this._triggerOn=!1,this._cancelTriggerSync(),this._positionTrigger()}_cancelTriggerSync(){this._triggerFrame!=null&&(cancelAnimationFrame(this._triggerFrame),this._triggerFrame=null),this._triggerTimer!=null&&(clearTimeout(this._triggerTimer),this._triggerTimer=null),this._resizeSyncFrame!=null&&(cancelAnimationFrame(this._resizeSyncFrame),this._resizeSyncFrame=null)}_onTriggerPointerDown(e){if(!this._config?.resize||!this._triggerOn)return;let t=this._overlayInstance?.panel?.querySelector(`[data-autospark-resize-handle]`);if(!t)return;let n=t.getBoundingClientRect();n.width+n.height>0&&e.clientX>=n.left&&e.clientX<=n.right&&e.clientY>=n.top&&e.clientY<=n.bottom&&(e.preventDefault(),this._suppressTriggerClick=!0,t.dispatchEvent(new MouseEvent(`pointerdown`,{bubbles:!0,clientX:e.clientX,clientY:e.clientY,button:0})))}_onTriggerClick(){if(this._suppressTriggerClick)this._suppressTriggerClick=!1;else if(this._triggerOn){let e=this._overlayInstance;e&&!e.destroyed&&e.visible&&e.requestClose(`trigger`)}else this._writeVisible(!0)}_positionTrigger(){let e=this._triggerEl;if(!e)return;let t=this._screenPlacement();e.setAttribute(`data-direction`,t),e.toggleAttribute(`data-collapsed`,!this._triggerOn),e.toggleAttribute(`data-half`,!this._triggerOn);let n=t===`left`||t===`right`,r=(n?e.offsetWidth||20:e.offsetHeight||20)/2,i=this._effectiveAt(),a=(i?wt(i.selector,this.el):null)?.getBoundingClientRect(),o=document.documentElement.clientWidth,s=document.documentElement.clientHeight,c=a?t===`right`?a.right:t===`left`?a.left:t===`top`?a.top:a.bottom:t===`right`?o:t===`left`||t===`top`?0:s,l=a?n?a.height:a.width:n?s:o,u=a?n?a.top:a.left:0,d=this._triggerCross(l,r),f=c,p=this._overlayInstance?.panel;this._triggerOn&&p&&(f=t===`right`?p.offsetLeft:t===`left`?p.offsetLeft+p.offsetWidth:t===`top`?p.offsetTop+p.offsetHeight:p.offsetTop),n?(e.style.left=`${f-r}px`,e.style.top=`${u+d-r}px`):(e.style.top=`${f-r}px`,e.style.left=`${u+d-r}px`);let m=this._edgeEl;m&&(n?(m.style.left=`${f-12}px`,m.style.top=`${u}px`,m.style.width=`24px`,m.style.height=`${l}px`):(m.style.top=`${f-12}px`,m.style.left=`${u}px`,m.style.height=`24px`,m.style.width=`${l}px`))}_triggerCross(e,t){let n=this.getOption(`expandable`),r=typeof n==`object`&&n?n.pos:n,i=this._parseTriggerDist(r,e);return i??=(this.warn(`x-drawer:${this.attr}: expandable.pos 须为 true/数字（px）或 CSS 长度字符串（如 '-20%'），已按居中处理`),e/2),Math.min(Math.max(i,t),e-t)}_parseTriggerDist(e,t){if(e==null||e===!0||e===``)return t/2;if(e===!1)return null;let n=e=>e>=0?e:t-Math.min(-e,t);if(typeof e==`number`)return Number.isFinite(e)?n(e):null;if(typeof e!=`string`)return null;let r=/^(-?[\d.]+)\s*(%|px|rem|em|vw|vh)?$/i.exec(e.trim());if(!r)return null;let i=parseFloat(r[1]);if(!Number.isFinite(i))return null;switch((r[2]??`px`).toLowerCase()){case`%`:return n(i/100*t);case`rem`:return n(i*this._rootFontSize());case`em`:return n(i*this._elFontSize());case`vw`:return n(i/100*window.innerWidth);case`vh`:return n(i/100*window.innerHeight);default:return n(i)}}_rootFontSize(){return parseFloat(getComputedStyle(document.documentElement).fontSize)||16}_elFontSize(){let e=this._triggerEl;return e&&parseFloat(getComputedStyle(e).fontSize)||this._rootFontSize()}_resolveConfig(e){let t=e.animate!==void 0||this._optionExprValues?.animate!==void 0,n=super._resolveConfig(e);return this._config=n,t||(n.animate=`drawer`),n.closeable??=!1,n}get _modalMask(){return this._config?.mask!==!1}_positioner(){return e=>this._positionDrawer(e)}_positionDrawer(e){let{panel:t,anchor:n,anchorEl:r,registerCleanup:i,warn:a}=e;n&&r?this._applyAnchorEdge(t,r,this._screenPlacement(),i):(n&&a(`x-drawer:${this.attr}: at "${String(n.selector??``)}" 未命中，退屏幕贴边（方向 ${this._screenPlacement()}，ADR-0063）`),this._applyScreenEdge(t))}_applyAnchorEdge(e,t,n,r){let i=()=>{let r=t.getBoundingClientRect(),i=n===`left`||n===`right`?`${t.offsetHeight}px`:`${t.offsetWidth}px`;e.style.left=e.style.right=e.style.top=e.style.bottom=``,e.style.position=`fixed`,e.style.margin=`0`,n===`left`||n===`right`?(e.style.top=`${r.top}px`,e.style.height=i,e.style.width=this._shortAxisSize(),n===`right`?e.style.right=`${document.documentElement.clientWidth-r.right}px`:e.style.left=`${r.left}px`):(e.style.left=`${r.left}px`,e.style.width=i,e.style.height=this._shortAxisSize(),n===`top`?e.style.top=`${r.top}px`:e.style.bottom=`${document.documentElement.clientHeight-r.bottom}px`),e.setAttribute(`data-overlay-placement`,n)};i();let a=null;typeof ResizeObserver<`u`&&(a=new ResizeObserver(i),a.observe(t));let o=()=>i();window.addEventListener(`resize`,o),window.addEventListener(`scroll`,o,!0),r(()=>{a?.disconnect(),window.removeEventListener(`resize`,o),window.removeEventListener(`scroll`,o,!0)})}_applyScreenEdge(e){let t=this._screenPlacement();e.style.position=`fixed`,e.style.margin=`0`,t===`left`?(e.style.top=`0`,e.style.bottom=`0`,e.style.left=`0`):t===`right`?(e.style.top=`0`,e.style.bottom=`0`,e.style.right=`0`):t===`top`?(e.style.top=`0`,e.style.left=`0`,e.style.right=`0`):(e.style.bottom=`0`,e.style.left=`0`,e.style.right=`0`),t===`left`||t===`right`?e.style.width=this._shortAxisSize():e.style.height=this._shortAxisSize(),e.setAttribute(`data-overlay-placement`,t)}_attachResize(e){let t=e.config.resize;if(t==null||t===!1)return;let n=this._screenPlacement(),r=t===!0?{enable:!1,resize:!0,direction:n}:{enable:!1,resize:{...t},direction:n},i=n===`left`||n===`right`,a=this.engine.directives.get(`expandable`);if(typeof a?.compose!=`function`)return;let o=a.compose(this.engine,this.binding,e.panel,r,{get:()=>!1,set:()=>{},resized:e=>{this._resizeMem=i?{width:e.value,height:this._resizeMem?.height??0}:{width:this._resizeMem?.width??0,height:e.value},this._scheduleTriggerFollow()}},this.el);o.created(),o.compile(void 0,e.panel),e.registerCleanup(()=>o.destroy());let s=e.panel.querySelectorAll(`[data-autospark-resize-handle]`);if(!s.length)return;let c=e=>this._triggerEl?.toggleAttribute(`data-edge-hover`,e);for(let e of s)e.addEventListener(`mouseenter`,()=>c(!0)),e.addEventListener(`mouseleave`,()=>c(!1)),e.addEventListener(`focus`,()=>c(!0)),e.addEventListener(`blur`,()=>c(!1))}_scheduleTriggerFollow(){this._triggerEl!=null&&this._triggerOn&&this._resizeSyncFrame==null&&(this._resizeSyncFrame=requestAnimationFrame(()=>{this._resizeSyncFrame=null,this._positionTrigger()}))}_shortAxisSize(){if(this._resizeMem){let e=this._screenPlacement(),t=e===`left`||e===`right`?this._resizeMem.width:this._resizeMem.height;if(Number.isFinite(t)&&t>0)return`${t}px`}let e=this._config?.size,t=`var(--autospark-drawer-size, 280px)`;if(e==null||e===``)return t;if(typeof e==`number`){if(Number.isFinite(e)&&e>0)return`${e}px`}else if(typeof e==`string`){let t=e.trim();if(/^\d+(\.\d+)?$/.test(t))return`${Number(t)}px`;if(t)return t}return this.warn(`x-drawer:${this.attr}: size 须为正数（px）或 CSS 长度字符串（如 '40%'），已按默认 280px 处理`),t}_effectiveAt(){return jt(this._config?.at??this._optionExprValues?.at??this.options?.at)}_screenPlacement(){let e=this._effectiveAt(),t=String(e?.placement??``).trim();if(t===``||t===`auto`)return a;let n=t.split(`-`)[0];return i.has(n)?n:a}}return{dialog:f,popover:p,drawer:m}}function Un(){In(e=>{Vn(e);let t=Hn(e.ComponentDirective);for(let n of[`dialog`,`popover`,`drawer`])e.directive(n,t[n]);e.getOverlay=(e,t,n,r)=>{let i=t?e.findScopeByEl(t):void 0,a=i?i.getComponentDeclaration(n):e._resolveGlobalComponent(n)??void 0;if(!a)e.logger.warn(`engine.getOverlay("${n}"): 未找到覆盖物组件（${t?`scope 链与全局`:`全局`}均未命中，ADR-0052 决策 15）`);else return new qt(e,n,a,e.getComponentDef(a)??e.getGlobalComponentDef(n)??null,r??null,i??null)}})}Un();function Wn(){return r(`DirectiveKind`)}var Gn=`autospark-foldable`,Kn=`autospark-foldable-panel`,$=`autospark-foldable-trigger`,qn=`autospark-foldable-content`,Jn=`autospark-foldable-styles`,Yn=`
.autospark-foldable{display:flex;flex-wrap:nowrap;align-items:center;overflow:hidden;}
.autospark-foldable[data-direction="column"]{flex-direction:column;}
/* 子元素强制不伸不缩（grow:0/shrink:0 是溢出判据的布局数学前提——伸缩态 offsetWidth
   是拉伸布局宽而非自然宽，求和判据失效；引擎不提供伸缩直通出口，用户须改布局结构） */
.autospark-foldable>:not(.${$}){flex-grow:0;flex-shrink:0;}
/* more 触发按钮：未溢出 display:none（不参与 flex 布局、不计 gap），溢出时由指令切
   inline-flex——显示与折叠态单一真相在指令。order 把按钮视觉恒排末尾（DOM 上按钮在
   compile 期先于模板子元素 append、恒居首位——more 语义要求溢出时出现在行尾，flex
   order 免 DOM 移动、不扰动子元素序与折叠锚） */
.autospark-foldable>.${$}{
  display:none;order:9999;flex-grow:0;flex-shrink:0;align-items:center;justify-content:center;
  width:var(--autospark-foldable-trigger-size,24px);height:var(--autospark-foldable-trigger-size,24px);
  padding:0;border:none;background:transparent;color:inherit;cursor:pointer;border-radius:4px;
}
.autospark-foldable>.${$}>svg{width:16px;height:16px;stroke-width:1.5;}
/* column 轴：more 图标旋转 90°（横排省略号转竖排——与纵向主轴、底部按钮、右侧弹出
   面板的视觉语义一致；data-direction 是轴的单一真相，换轴经 dataset 写入自动跟随） */
.autospark-foldable[data-direction="column"]>.${$}>svg{transform:rotate(90deg);}
.autospark-foldable>.${$}:hover{background:var(--auto-hover-bgcolor, var(--autospark-foldable-trigger-hover,rgba(0,154,255,0.15)));}
.autospark-foldable>.${$}:focus-visible{outline:2px solid var(--autospark-foldable-trigger-focus,rgba(96,96,96,0.55));outline-offset:-2px;}
/* 暗色兜底变体（ADR-0129）：focus 色属非映射声明（保持两级），兜底按 theme 校准切换 */
[dark] .autospark-foldable>.${$}:hover,[data-dark] .autospark-foldable>.${$}:hover{background:var(--auto-hover-bgcolor, var(--autospark-foldable-trigger-hover,rgba(86,186,255,0.15)));}
[dark] .autospark-foldable>.${$}:focus-visible,[data-dark] .autospark-foldable>.${$}:focus-visible{outline-color:var(--autospark-foldable-trigger-focus,rgba(250,250,250,0.55));}
/* 面板出口（中继挂入时打类）：折叠子元素垂直堆叠 + 引擎兜底 gap（内置 popover shell
   不预设内容布局；CSS 变量 --autospark-foldable-panel-gap 定制）。双类自并提权压过
   用户 shell 类的同轴样式。边框/箭头/z-index 归 shell（默认内置 autospark.popover） */
.${Kn}.${Kn}{
  display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;
  gap:var(--autospark-foldable-panel-gap,4px);
}
/* x-resizable 组合适配：本容器 overflow:hidden 会裁掉外伸半边的调节手柄（x-resizable
   全局样式手柄跨边缘 -thickness/2），交互热区残缺——容器内重置为全内贴边（e/w 横向、
   n/s 纵向对称；优先级同源后注入胜出） */
.autospark-foldable>[data-autospark-resize-handle="e"]{right:0;}
.autospark-foldable>[data-autospark-resize-handle="w"]{left:0;}
.autospark-foldable>[data-autospark-resize-handle="n"]{top:0;}
.autospark-foldable>[data-autospark-resize-handle="s"]{bottom:0;}
`;function Xn(){gn(Yn,{id:Jn})}function Zn(e){class t extends e{constructor(...e){super(...e),this._dir=`row`,this._trigger=null,this._shellName=``,this._stash=[],this._anchors=new Map,this._cache=new Map,this._ro=null,this._mo=null,this._onWinResize=()=>this._reconcile(),this._reconciling=!1,this._destroyed=!1,this._minWritten=``,this._inst=null,this._unsubOpen=null,this._unsubClose=null}static{this.priority=0}static{this.singleton=!0}static{this.kind=Wn().Hybrid}static initialize(e){Xn(),e.registerComponent(`<div x-define="${qn}" style="display:contents"></div>`,{name:qn})}created(){this.attr?this.warn(`x-foldable:${this.attr}: 不支持的参数形态（x-foldable 为无参容器指令，轴由值声明 row|column），本标记已忽略`):this._setupAxis()}compile(e,t){let n=this.el;n.classList.add(Gn),n.dataset.direction=this._dir,this._resolveShellName(),this._buildTrigger()}mounted(){this._destroyed||(this._trigger=Array.from(this.el.children).find(e=>e instanceof HTMLElement&&e.classList.contains($))??null,this._dir=this.el.dataset.direction===`column`?`column`:`row`,this._setupPanelRelay(),this._startObserving(),this._reconcile())}unmounted(){this._teardown()}destroy(){this._destroyed=!0,this._teardown()}_teardown(){this._ro?.disconnect(),this._ro=null,this._mo?.disconnect(),this._mo=null,window.removeEventListener(`resize`,this._onWinResize),this._inst&&!this._inst.destroyed&&this._inst.visible&&this._inst.requestClose(`consumer-destroyed`),this._unsubOpen?.(),this._unsubOpen=null,this._unsubClose?.(),this._unsubClose=null,this._stash=[],this._anchors.clear(),this._cache.clear(),this._trigger=null,this._inst=null}_setupAxis(){let e=String(this.value??``).trim();if(e===`row`||e===`column`){this._applyDir(e);return}let t=e||`'row'`,n=this.binding.watch(t,({value:e})=>{this._applyDir(e===`column`?`column`:`row`)});this._applyDir(n===`column`?`column`:`row`)}_applyDir(e){(e!==this._dir||this.el?.dataset.direction!==e)&&(this._dir=e,this.el&&(this.el.dataset.direction=e),this._syncTriggerPlacement())}_syncTriggerPlacement(){let e=this._trigger;if(!e)return;let t=this.engine.findScopeByEl(e)?.directives.find(e=>e.info.name===`popover`);t&&(t.options.at={placement:this._placement()})}_placement(){return this._dir===`column`?`right-end`:`bottom-end`}_resolveShellName(){let e=this.getOption(`shell`);e!=null&&e!==``&&typeof e==`string`&&e.trim()!==``&&(this._shellName=e.trim())}_buildTrigger(){let e=document.createElement(`button`);e.type=`button`,e.className=$,e.setAttribute(`aria-label`,`更多`),e.setAttribute(`aria-haspopup`,`true`),e.setAttribute(`x-popover:${qn}`,``);let t={at:{placement:this._placement()}};this._shellName&&(t.shell=this._shellName);let n=this.getOption(`popover`);n!=null&&(typeof n==`object`&&!Array.isArray(n)?Object.assign(t,n):this.warn(`x-foldable: x-foldable-options.popover 须为对象（整包透传合并进触发按钮的 x-popover-options），当前形态已忽略`)),e.setAttribute(`x-popover-options`,JSON.stringify(t));let r=document.createElementNS(`http://www.w3.org/2000/svg`,`svg`);r.setAttribute(`aria-hidden`,`true`);let i=document.createElementNS(`http://www.w3.org/2000/svg`,`use`);i.setAttribute(`href`,`#as-more`),r.appendChild(i),e.appendChild(r),e.addEventListener(`keydown`,e=>this._onTriggerKeydown(e));let a=document.createElement(`div`);a.appendChild(e);let o=this.engine.compiler.compileSubtree(this.el,a,this.binding).find(e=>e instanceof HTMLElement&&e.classList.contains($));if(!o)return;let s=this.engine.findScopeByEl(o);s&&this.binding.addChild(s),this._trigger=o,this.el.appendChild(o)}_onTriggerKeydown(e){(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),this._trigger?.dispatchEvent(new MouseEvent(this._trigger.dataset.panelOpen===`1`?`mouseleave`:`mouseenter`)))}_childItems(){return Array.from(this.el.children).filter(e=>e instanceof HTMLElement&&!e.classList.contains($)&&!e.hasAttribute(`data-autospark-resize-handle`))}_startObserving(){typeof ResizeObserver<`u`&&(this._ro=new ResizeObserver(()=>this._reconcile()),this._ro.observe(this.el),this._syncChildRO()),window.addEventListener(`resize`,this._onWinResize),typeof MutationObserver<`u`&&(this._mo=new MutationObserver(e=>{e.some(e=>e.type===`childList`||e.type===`attributes`&&e.attributeName===`data-direction`)&&setTimeout(()=>{this._destroyed||(this._syncAxisFromDom(),this._syncChildRO(),this._reconcile())},0)}),this._mo.observe(this.el,{childList:!0,subtree:!0,attributes:!0,attributeFilter:[`data-direction`]}))}_syncAxisFromDom(){let e=this.el.dataset.direction===`column`?`column`:`row`;e!==this._dir&&(this._dir=e,this._stash.length>0&&this._restoreAll(),this._reconcile())}_syncChildRO(){if(this._ro)for(let e of this._childItems())this._ro.observe(e)}get _contentMain(){let e=[];for(let t of this._childItems())this._hidden(t)||e.push(t);this._trigger&&this._trigger.style.display===`inline-flex`&&e.push(this._trigger);let t=this._mainGap(),n=0;for(let t of e)n+=this._sizeOf(t);return n+t*Math.max(0,e.length-1)}get _clientMain(){let e=getComputedStyle(this.el),t=e=>{let t=Number.parseFloat(e);return Number.isFinite(t)?t:0},n=this._dir===`column`?t(e.paddingTop)+t(e.paddingBottom):t(e.paddingLeft)+t(e.paddingRight);return(this._dir===`column`?this.el.clientHeight:this.el.clientWidth)-n}_sizeOf(e){return this._dir===`column`?e.offsetHeight:e.offsetWidth}_mainGap(){let e=getComputedStyle(this.el),t=this._dir===`column`?e.rowGap:e.columnGap,n=Number.parseFloat(t);return Number.isFinite(n)?n:0}_hidden(e){let t=getComputedStyle(e).display;return t===``?e.style.display===`none`:t===`none`}_reconcile(){if(!(this._destroyed||this._reconciling)){this._reconciling=!0;try{let e=this._childItems().length+2;for(let t=0;t<e;t++)if(this._contentMain>this._clientMain){if(!this._foldOne())break}else if(this._stash.length>0){if(!this._restoreOne())break}else break}finally{this._reconciling=!1}}}_foldOne(){let e=this._childItems();for(let t=e.length-1;t>=0;t--){let n=e[t];if(!this._hidden(n))return this._cache.set(n,this._sizeOf(n)),this._anchors.set(n,n.nextSibling),n.remove(),this._stash.push(n),this._showTrigger(!0),this._writeMinSize(),!0}return!1}_restoreOne(){for(let e=this._stash.length-1;e>=0;e--){let t=this._stash[e];if((!t.isConnected||this.el.contains(t))&&!this._hidden(t))return this._stash.splice(e,1),this._insertBack(t),this._contentMain>this._clientMain?(this._cache.set(t,this._sizeOf(t)),this._anchors.set(t,t.nextSibling),t.remove(),this._stash.push(t),!1):(this._stash.length===0&&this._showTrigger(!1),!0)}return!1}_insertBack(e){let t=this._anchors.get(e)??null;t&&t.parentNode===this.el?this.el.insertBefore(e,t):this.el.appendChild(e),this._anchors.delete(e),this._cache.delete(e)}_restoreAll(){for(;this._stash.length>0;)this._insertBack(this._stash.pop());this._showTrigger(!1)}_showTrigger(e){this._trigger&&(this._trigger.style.display=e?`inline-flex`:``)}_writeMinSize(){if(!this._trigger)return;let e=getComputedStyle(this.el),t=e=>{let t=Number.parseFloat(e);return Number.isFinite(t)?t:0},n=this._dir===`column`?t(e.paddingTop)+t(e.paddingBottom)+t(e.borderTopWidth)+t(e.borderBottomWidth):t(e.paddingLeft)+t(e.paddingRight)+t(e.borderLeftWidth)+t(e.borderRightWidth),r=`${this._sizeOf(this._trigger)+n}px`,i=`${this._dir}:${r}`;i!==this._minWritten&&(this._minWritten=i,this._dir===`column`?this.el.style.minHeight=r:this.el.style.minWidth=r)}_setupPanelRelay(){let e=e=>typeof e==`function`?e:()=>e.off();this._unsubOpen=e(this.engine.on(`overlay:open`,e=>{let t=(e?.payload??e)?.instance;if(!t||this._destroyed||t.config?.at?.selector!==this._trigger||this._stash.length===0)return;this._inst=t,this._trigger&&(this._trigger.dataset.panelOpen=`1`);let n=t.panel;n&&this.engine.scheduler.schedule(()=>{if(this._destroyed||this._inst!==t)return;let e=n.querySelector(`[data-slot="default"]`)??n;e.classList.add(Kn);for(let t of[...this._stash].reverse())e.appendChild(t)})})),this._unsubClose=e(this.engine.on(`overlay:close`,e=>{let t=e?.payload??e;t?.instance&&t.instance===this._inst&&this._onPanelClosed()}))}_onPanelClosed(){for(let e of this._stash)e.remove();this._inst=null,this._trigger&&delete this._trigger.dataset.panelOpen}}return t}function Qn(){In(e=>{e.directive(`foldable`,Zn(e.AutoSparkDirectiveBase))})}Qn();};
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

//# sourceMappingURL=autospark.overlay.js.map
