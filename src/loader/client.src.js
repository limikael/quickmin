export default "var q,a,ve,Xe,R,fe,me,ne,ye,T={},ge=[],et=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,z=Array.isArray;function U(e,t){for(var n in t)e[n]=t[n];return e}function be(e){var t=e.parentNode;t&&t.removeChild(e)}function m(e,t,n){var r,i,o,u={};for(o in t)o==\"key\"?r=t[o]:o==\"ref\"?i=t[o]:u[o]=t[o];if(arguments.length>2&&(u.children=arguments.length>3?q.call(arguments,2):n),typeof e==\"function\"&&e.defaultProps!=null)for(o in e.defaultProps)u[o]===void 0&&(u[o]=e.defaultProps[o]);return B(e,u,r,i,null)}function B(e,t,n,r,i){var o={type:e,props:t,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__d:void 0,__c:null,__h:null,constructor:void 0,__v:i??++ve};return i==null&&a.vnode!=null&&a.vnode(o),o}function b(e){return e.children}function P(e,t){this.props=e,this.context=t}function F(e,t){if(t==null)return e.__?F(e.__,e.__.__k.indexOf(e)+1):null;for(var n;t<e.__k.length;t++)if((n=e.__k[t])!=null&&n.__e!=null)return n.__e;return typeof e.type==\"function\"?F(e):null}function xe(e){var t,n;if((e=e.__)!=null&&e.__c!=null){for(e.__e=e.__c.base=null,t=0;t<e.__k.length;t++)if((n=e.__k[t])!=null&&n.__e!=null){e.__e=e.__c.base=n.__e;break}return xe(e)}}function re(e){(!e.__d&&(e.__d=!0)&&R.push(e)&&!$.__r++||fe!==a.debounceRendering)&&((fe=a.debounceRendering)||me)($)}function $(){var e,t,n,r,i,o,u,l,s;for(R.sort(ne);e=R.shift();)e.__d&&(t=R.length,r=void 0,i=void 0,o=void 0,l=(u=(n=e).__v).__e,(s=n.__P)&&(r=[],i=[],(o=U({},u)).__v=u.__v+1,_e(s,u,o,n.__n,s.ownerSVGElement!==void 0,u.__h!=null?[l]:null,r,l??F(u),u.__h,i),Se(r,u,i),u.__e!=l&&xe(u)),R.length>t&&R.sort(ne));$.__r=0}function Ce(e,t,n,r,i,o,u,l,s,y,d){var _,h,f,c,p,H,v,x,N,S=0,C=r&&r.__k||ge,O=C.length,I=O,D=t.length;for(n.__k=[],_=0;_<D;_++)(c=n.__k[_]=(c=t[_])==null||typeof c==\"boolean\"||typeof c==\"function\"?null:typeof c==\"string\"||typeof c==\"number\"||typeof c==\"bigint\"?B(null,c,null,null,c):z(c)?B(b,{children:c},null,null,null):c.__b>0?B(c.type,c.props,c.key,c.ref?c.ref:null,c.__v):c)!=null?(c.__=n,c.__b=n.__b+1,(x=tt(c,C,v=_+S,I))===-1?f=T:(f=C[x]||T,C[x]=void 0,I--),_e(e,c,f,i,o,u,l,s,y,d),p=c.__e,(h=c.ref)&&f.ref!=h&&(f.ref&&ie(f.ref,null,c),d.push(h,c.__c||p,c)),p!=null&&(H==null&&(H=p),(N=f===T||f.__v===null)?x==-1&&S--:x!==v&&(x===v+1?S++:x>v?I>D-v?S+=x-v:S--:S=x<v&&x==v-1?x-v:0),v=_+S,typeof c.type!=\"function\"||x===v&&f.__k!==c.__k?typeof c.type==\"function\"||x===v&&!N?c.__d!==void 0?(s=c.__d,c.__d=void 0):s=p.nextSibling:s=Ee(e,p,s):s=ke(c,s,e),typeof n.type==\"function\"&&(n.__d=s))):(f=C[_])&&f.key==null&&f.__e&&(f.__e==s&&(s=F(f)),oe(f,f,!1),C[_]=null);for(n.__e=H,_=O;_--;)C[_]!=null&&(typeof n.type==\"function\"&&C[_].__e!=null&&C[_].__e==n.__d&&(n.__d=C[_].__e.nextSibling),oe(C[_],C[_]))}function ke(e,t,n){for(var r,i=e.__k,o=0;i&&o<i.length;o++)(r=i[o])&&(r.__=e,t=typeof r.type==\"function\"?ke(r,t,n):Ee(n,r.__e,t));return t}function M(e,t){return t=t||[],e==null||typeof e==\"boolean\"||(z(e)?e.some(function(n){M(n,t)}):t.push(e)),t}function Ee(e,t,n){return n==null||n.parentNode!==e?e.insertBefore(t,null):t==n&&t.parentNode!=null||e.insertBefore(t,n),t.nextSibling}function tt(e,t,n,r){var i=e.key,o=e.type,u=n-1,l=n+1,s=t[n];if(s===null||s&&i==s.key&&o===s.type)return n;if(r>(s!=null?1:0))for(;u>=0||l<t.length;){if(u>=0){if((s=t[u])&&i==s.key&&o===s.type)return u;u--}if(l<t.length){if((s=t[l])&&i==s.key&&o===s.type)return l;l++}}return-1}function nt(e,t,n,r,i){var o;for(o in n)o===\"children\"||o===\"key\"||o in t||j(e,o,null,n[o],r);for(o in t)i&&typeof t[o]!=\"function\"||o===\"children\"||o===\"key\"||o===\"value\"||o===\"checked\"||n[o]===t[o]||j(e,o,t[o],n[o],r)}function pe(e,t,n){t[0]===\"-\"?e.setProperty(t,n??\"\"):e[t]=n==null?\"\":typeof n!=\"number\"||et.test(t)?n:n+\"px\"}function j(e,t,n,r,i){var o;e:if(t===\"style\")if(typeof n==\"string\")e.style.cssText=n;else{if(typeof r==\"string\"&&(e.style.cssText=r=\"\"),r)for(t in r)n&&t in n||pe(e.style,t,\"\");if(n)for(t in n)r&&n[t]===r[t]||pe(e.style,t,n[t])}else if(t[0]===\"o\"&&t[1]===\"n\")o=t!==(t=t.replace(/(PointerCapture)$|Capture$/,\"$1\")),t=t.toLowerCase()in e?t.toLowerCase().slice(2):t.slice(2),e.l||(e.l={}),e.l[t+o]=n,n?r||e.addEventListener(t,o?he:de,o):e.removeEventListener(t,o?he:de,o);else if(t!==\"dangerouslySetInnerHTML\"){if(i)t=t.replace(/xlink(H|:h)/,\"h\").replace(/sName$/,\"s\");else if(t!==\"width\"&&t!==\"height\"&&t!==\"href\"&&t!==\"list\"&&t!==\"form\"&&t!==\"tabIndex\"&&t!==\"download\"&&t!==\"rowSpan\"&&t!==\"colSpan\"&&t in e)try{e[t]=n??\"\";break e}catch{}typeof n==\"function\"||(n==null||n===!1&&t[4]!==\"-\"?e.removeAttribute(t):e.setAttribute(t,n))}}function de(e){return this.l[e.type+!1](a.event?a.event(e):e)}function he(e){return this.l[e.type+!0](a.event?a.event(e):e)}function _e(e,t,n,r,i,o,u,l,s,y){var d,_,h,f,c,p,H,v,x,N,S,C,O,I,D,w=t.type;if(t.constructor!==void 0)return null;n.__h!=null&&(s=n.__h,l=t.__e=n.__e,t.__h=null,o=[l]),(d=a.__b)&&d(t);e:if(typeof w==\"function\")try{if(v=t.props,x=(d=w.contextType)&&r[d.__c],N=d?x?x.props.value:d.__:r,n.__c?H=(_=t.__c=n.__c).__=_.__E:(\"prototype\"in w&&w.prototype.render?t.__c=_=new w(v,N):(t.__c=_=new P(v,N),_.constructor=w,_.render=ot),x&&x.sub(_),_.props=v,_.state||(_.state={}),_.context=N,_.__n=r,h=_.__d=!0,_.__h=[],_._sb=[]),_.__s==null&&(_.__s=_.state),w.getDerivedStateFromProps!=null&&(_.__s==_.state&&(_.__s=U({},_.__s)),U(_.__s,w.getDerivedStateFromProps(v,_.__s))),f=_.props,c=_.state,_.__v=t,h)w.getDerivedStateFromProps==null&&_.componentWillMount!=null&&_.componentWillMount(),_.componentDidMount!=null&&_.__h.push(_.componentDidMount);else{if(w.getDerivedStateFromProps==null&&v!==f&&_.componentWillReceiveProps!=null&&_.componentWillReceiveProps(v,N),!_.__e&&(_.shouldComponentUpdate!=null&&_.shouldComponentUpdate(v,_.__s,N)===!1||t.__v===n.__v)){for(t.__v!==n.__v&&(_.props=v,_.state=_.__s,_.__d=!1),t.__e=n.__e,t.__k=n.__k,t.__k.forEach(function(W){W&&(W.__=t)}),S=0;S<_._sb.length;S++)_.__h.push(_._sb[S]);_._sb=[],_.__h.length&&u.push(_);break e}_.componentWillUpdate!=null&&_.componentWillUpdate(v,_.__s,N),_.componentDidUpdate!=null&&_.__h.push(function(){_.componentDidUpdate(f,c,p)})}if(_.context=N,_.props=v,_.__P=e,_.__e=!1,C=a.__r,O=0,\"prototype\"in w&&w.prototype.render){for(_.state=_.__s,_.__d=!1,C&&C(t),d=_.render(_.props,_.state,_.context),I=0;I<_._sb.length;I++)_.__h.push(_._sb[I]);_._sb=[]}else do _.__d=!1,C&&C(t),d=_.render(_.props,_.state,_.context),_.state=_.__s;while(_.__d&&++O<25);_.state=_.__s,_.getChildContext!=null&&(r=U(U({},r),_.getChildContext())),h||_.getSnapshotBeforeUpdate==null||(p=_.getSnapshotBeforeUpdate(f,c)),Ce(e,z(D=d!=null&&d.type===b&&d.key==null?d.props.children:d)?D:[D],t,n,r,i,o,u,l,s,y),_.base=t.__e,t.__h=null,_.__h.length&&u.push(_),H&&(_.__E=_.__=null)}catch(W){t.__v=null,(s||o!=null)&&(t.__e=l,t.__h=!!s,o[o.indexOf(l)]=null),a.__e(W,t,n)}else o==null&&t.__v===n.__v?(t.__k=n.__k,t.__e=n.__e):t.__e=rt(n.__e,t,n,r,i,o,u,s,y);(d=a.diffed)&&d(t)}function Se(e,t,n){for(var r=0;r<n.length;r++)ie(n[r],n[++r],n[++r]);a.__c&&a.__c(t,e),e.some(function(i){try{e=i.__h,i.__h=[],e.some(function(o){o.call(i)})}catch(o){a.__e(o,i.__v)}})}function rt(e,t,n,r,i,o,u,l,s){var y,d,_,h=n.props,f=t.props,c=t.type,p=0;if(c===\"svg\"&&(i=!0),o!=null){for(;p<o.length;p++)if((y=o[p])&&\"setAttribute\"in y==!!c&&(c?y.localName===c:y.nodeType===3)){e=y,o[p]=null;break}}if(e==null){if(c===null)return document.createTextNode(f);e=i?document.createElementNS(\"http://www.w3.org/2000/svg\",c):document.createElement(c,f.is&&f),o=null,l=!1}if(c===null)h===f||l&&e.data===f||(e.data=f);else{if(o=o&&q.call(e.childNodes),d=(h=n.props||T).dangerouslySetInnerHTML,_=f.dangerouslySetInnerHTML,!l){if(o!=null)for(h={},p=0;p<e.attributes.length;p++)h[e.attributes[p].name]=e.attributes[p].value;(_||d)&&(_&&(d&&_.__html==d.__html||_.__html===e.innerHTML)||(e.innerHTML=_&&_.__html||\"\"))}if(nt(e,f,h,i,l),_)t.__k=[];else if(Ce(e,z(p=t.props.children)?p:[p],t,n,r,i&&c!==\"foreignObject\",o,u,o?o[0]:n.__k&&F(n,0),l,s),o!=null)for(p=o.length;p--;)o[p]!=null&&be(o[p]);l||(\"value\"in f&&(p=f.value)!==void 0&&(p!==e.value||c===\"progress\"&&!p||c===\"option\"&&p!==h.value)&&j(e,\"value\",p,h.value,!1),\"checked\"in f&&(p=f.checked)!==void 0&&p!==e.checked&&j(e,\"checked\",p,h.checked,!1))}return e}function ie(e,t,n){try{typeof e==\"function\"?e(t):e.current=t}catch(r){a.__e(r,n)}}function oe(e,t,n){var r,i;if(a.unmount&&a.unmount(e),(r=e.ref)&&(r.current&&r.current!==e.__e||ie(r,null,t)),(r=e.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(o){a.__e(o,t)}r.base=r.__P=null,e.__c=void 0}if(r=e.__k)for(i=0;i<r.length;i++)r[i]&&oe(r[i],t,n||typeof e.type!=\"function\");n||e.__e==null||be(e.__e),e.__=e.__e=e.__d=void 0}function ot(e,t,n){return this.constructor(e,n)}function E(e,t,n){var r,i,o,u;a.__&&a.__(e,t),i=(r=typeof n==\"function\")?null:n&&n.__k||t.__k,o=[],u=[],_e(t,e=(!r&&n||t).__k=m(b,null,[e]),i||T,T,t.ownerSVGElement!==void 0,!r&&n?[n]:i?null:t.firstChild?q.call(t.childNodes):null,o,!r&&n?n:i?i.__e:t.firstChild,r,u),Se(o,e,u)}function k(e,t){E(e,t,k)}function G(e,t){var n={__c:t=\"__cC\"+ye++,__:e,Consumer:function(r,i){return r.children(i)},Provider:function(r){var i,o;return this.getChildContext||(i=[],(o={})[t]=this,this.getChildContext=function(){return o},this.shouldComponentUpdate=function(u){this.props.value!==u.value&&i.some(function(l){l.__e=!0,re(l)})},this.sub=function(u){i.push(u);var l=u.componentWillUnmount;u.componentWillUnmount=function(){i.splice(i.indexOf(u),1),l&&l.call(u)}}),r.children}};return n.Provider.__=n.Consumer.contextType=n}q=ge.slice,a={__e:function(e,t,n,r){for(var i,o,u;t=t.__;)if((i=t.__c)&&!i.__)try{if((o=i.constructor)&&o.getDerivedStateFromError!=null&&(i.setState(o.getDerivedStateFromError(e)),u=i.__d),i.componentDidCatch!=null&&(i.componentDidCatch(e,r||{}),u=i.__d),u)return i.__E=i}catch(l){e=l}throw e}},ve=0,Xe=function(e){return e!=null&&e.constructor===void 0},P.prototype.setState=function(e,t){var n;n=this.__s!=null&&this.__s!==this.state?this.__s:this.__s=U({},this.state),typeof e==\"function\"&&(e=e(U({},n),this.props)),e&&U(n,e),e!=null&&this.__v&&(t&&this._sb.push(t),re(this))},P.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),re(this))},P.prototype.render=b,R=[],me=typeof Promise==\"function\"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,ne=function(e,t){return e.__v.__b-t.__v.__b},$.__r=0,ye=0;var A,g,ue,we,Z=0,De=[],Q=[],Ne=a.__b,Pe=a.__r,Ie=a.diffed,Ue=a.__c,Re=a.unmount;function J(e,t){a.__h&&a.__h(g,e,Z||t),Z=0;var n=g.__H||(g.__H={__:[],__h:[]});return e>=n.__.length&&n.__.push({__V:Q}),n.__[e]}function K(e){return Z=1,Te(Oe,e)}function Te(e,t,n){var r=J(A++,2);if(r.t=e,!r.__c&&(r.__=[n?n(t):Oe(void 0,t),function(l){var s=r.__N?r.__N[0]:r.__[0],y=r.t(s,l);s!==y&&(r.__N=[y,r.__[1]],r.__c.setState({}))}],r.__c=g,!g.u)){var i=function(l,s,y){if(!r.__c.__H)return!0;var d=r.__c.__H.__.filter(function(h){return h.__c});if(d.every(function(h){return!h.__N}))return!o||o.call(this,l,s,y);var _=!1;return d.forEach(function(h){if(h.__N){var f=h.__[0];h.__=h.__N,h.__N=void 0,f!==h.__[0]&&(_=!0)}}),!(!_&&r.__c.props===l)&&(!o||o.call(this,l,s,y))};g.u=!0;var o=g.shouldComponentUpdate,u=g.componentWillUpdate;g.componentWillUpdate=function(l,s,y){if(this.__e){var d=o;o=void 0,i(l,s,y),o=d}u&&u.call(this,l,s,y)},g.shouldComponentUpdate=i}return r.__N||r.__}function X(e,t){var n=J(A++,3);!a.__s&&Le(n.__H,t)&&(n.__=e,n.i=t,g.__H.__h.push(n))}function ee(e){return Z=5,Ae(function(){return{current:e}},[])}function Ae(e,t){var n=J(A++,7);return Le(n.__H,t)?(n.__V=e(),n.i=t,n.__h=e,n.__V):n.__}function le(e){var t=g.context[e.__c],n=J(A++,9);return n.c=e,t?(n.__==null&&(n.__=!0,t.sub(g)),t.props.value):e.__}function _t(){for(var e;e=De.shift();)if(e.__P&&e.__H)try{e.__H.__h.forEach(Y),e.__H.__h.forEach(ae),e.__H.__h=[]}catch(t){e.__H.__h=[],a.__e(t,e.__v)}}a.__b=function(e){g=null,Ne&&Ne(e)},a.__r=function(e){Pe&&Pe(e),A=0;var t=(g=e.__c).__H;t&&(ue===g?(t.__h=[],g.__h=[],t.__.forEach(function(n){n.__N&&(n.__=n.__N),n.__V=Q,n.__N=n.i=void 0})):(t.__h.forEach(Y),t.__h.forEach(ae),t.__h=[],A=0)),ue=g},a.diffed=function(e){Ie&&Ie(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(De.push(t)!==1&&we===a.requestAnimationFrame||((we=a.requestAnimationFrame)||it)(_t)),t.__H.__.forEach(function(n){n.i&&(n.__H=n.i),n.__V!==Q&&(n.__=n.__V),n.i=void 0,n.__V=Q})),ue=g=null},a.__c=function(e,t){t.some(function(n){try{n.__h.forEach(Y),n.__h=n.__h.filter(function(r){return!r.__||ae(r)})}catch(r){t.some(function(i){i.__h&&(i.__h=[])}),t=[],a.__e(r,n.__v)}}),Ue&&Ue(e,t)},a.unmount=function(e){Re&&Re(e);var t,n=e.__c;n&&n.__H&&(n.__H.__.forEach(function(r){try{Y(r)}catch(i){t=i}}),n.__H=void 0,t&&a.__e(t,n.__v))};var He=typeof requestAnimationFrame==\"function\";function it(e){var t,n=function(){clearTimeout(r),He&&cancelAnimationFrame(t),setTimeout(e)},r=setTimeout(n,100);He&&(t=requestAnimationFrame(n))}function Y(e){var t=g,n=e.__c;typeof n==\"function\"&&(e.__c=void 0,n()),g=t}function ae(e){var t=g;e.__c=e.__(),g=t}function Le(e,t){return!e||e.length!==t.length||t.some(function(n,r){return n!==e[r]})}function Oe(e,t){return typeof t==\"function\"?t(e):t}function lt(e,t){for(var n in t)e[n]=t[n];return e}function Fe(e,t){for(var n in e)if(n!==\"__source\"&&!(n in t))return!0;for(var r in t)if(r!==\"__source\"&&e[r]!==t[r])return!0;return!1}function Me(e){this.props=e}(Me.prototype=new P).isPureReactComponent=!0,Me.prototype.shouldComponentUpdate=function(e,t){return Fe(this.props,e)||Fe(this.state,t)};var Ve=a.__b;a.__b=function(e){e.type&&e.type.__f&&e.ref&&(e.props.ref=e.ref,e.ref=null),Ve&&Ve(e)};var Mt=typeof Symbol<\"u\"&&Symbol.for&&Symbol.for(\"react.forward_ref\")||3911;var st=a.__e;a.__e=function(e,t,n,r){if(e.then){for(var i,o=t;o=o.__;)if((i=o.__c)&&i.__c)return t.__e==null&&(t.__e=n.__e,t.__k=n.__k),i.__c(e,t)}st(e,t,n,r)};var We=a.unmount;function Ge(e,t,n){return e&&(e.__c&&e.__c.__H&&(e.__c.__H.__.forEach(function(r){typeof r.__c==\"function\"&&r.__c()}),e.__c.__H=null),(e=lt({},e)).__c!=null&&(e.__c.__P===n&&(e.__c.__P=t),e.__c=null),e.__k=e.__k&&e.__k.map(function(r){return Ge(r,t,n)})),e}function Qe(e,t,n){return e&&(e.__v=null,e.__k=e.__k&&e.__k.map(function(r){return Qe(r,t,n)}),e.__c&&e.__c.__P===t&&(e.__e&&n.insertBefore(e.__e,e.__d),e.__c.__e=!0,e.__c.__P=n)),e}function se(){this.__u=0,this.t=null,this.__b=null}function Ye(e){var t=e.__.__c;return t&&t.__a&&t.__a(e)}function te(){this.u=null,this.o=null}a.unmount=function(e){var t=e.__c;t&&t.__R&&t.__R(),t&&e.__h===!0&&(e.type=null),We&&We(e)},(se.prototype=new P).__c=function(e,t){var n=t.__c,r=this;r.t==null&&(r.t=[]),r.t.push(n);var i=Ye(r.__v),o=!1,u=function(){o||(o=!0,n.__R=null,i?i(l):l())};n.__R=u;var l=function(){if(!--r.__u){if(r.state.__a){var y=r.state.__a;r.__v.__k[0]=Qe(y,y.__c.__P,y.__c.__O)}var d;for(r.setState({__a:r.__b=null});d=r.t.pop();)d.forceUpdate()}},s=t.__h===!0;r.__u++||s||r.setState({__a:r.__b=r.__v.__k[0]}),e.then(u,u)},se.prototype.componentWillUnmount=function(){this.t=[]},se.prototype.render=function(e,t){if(this.__b){if(this.__v.__k){var n=document.createElement(\"div\"),r=this.__v.__k[0].__c;this.__v.__k[0]=Ge(this.__b,n,r.__O=r.__P)}this.__b=null}var i=t.__a&&m(b,null,e.fallback);return i&&(i.__h=null),[m(b,null,t.__a?null:e.children),i]};var Be=function(e,t,n){if(++n[1]===n[0]&&e.o.delete(t),e.props.revealOrder&&(e.props.revealOrder[0]!==\"t\"||!e.o.size))for(n=e.u;n;){for(;n.length>3;)n.pop()();if(n[1]<n[0])break;e.u=n=n[2]}};(te.prototype=new P).__a=function(e){var t=this,n=Ye(t.__v),r=t.o.get(e);return r[0]++,function(i){var o=function(){t.props.revealOrder?(r.push(i),Be(t,e,r)):i()};n?n(o):o()}},te.prototype.render=function(e){this.u=null,this.o=new Map;var t=M(e.children);e.revealOrder&&e.revealOrder[0]===\"b\"&&t.reverse();for(var n=t.length;n--;)this.o.set(t[n],this.u=[1,0,this.u]);return e.children},te.prototype.componentDidUpdate=te.prototype.componentDidMount=function(){var e=this;this.o.forEach(function(t,n){Be(e,n,t)})};var ct=typeof Symbol<\"u\"&&Symbol.for&&Symbol.for(\"react.element\")||60103,ft=/^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/,pt=/^on(Ani|Tra|Tou|BeforeInp|Compo)/,dt=/[A-Z0-9]/g,ht=typeof document<\"u\",vt=function(e){return(typeof Symbol<\"u\"&&typeof Symbol()==\"symbol\"?/fil|che|rad/:/fil|che|ra/).test(e)};P.prototype.isReactComponent={},[\"componentWillMount\",\"componentWillReceiveProps\",\"componentWillUpdate\"].forEach(function(e){Object.defineProperty(P.prototype,e,{configurable:!0,get:function(){return this[\"UNSAFE_\"+e]},set:function(t){Object.defineProperty(this,e,{configurable:!0,writable:!0,value:t})}})});var $e=a.event;function mt(){}function yt(){return this.cancelBubble}function gt(){return this.defaultPrevented}a.event=function(e){return $e&&(e=$e(e)),e.persist=mt,e.isPropagationStopped=yt,e.isDefaultPrevented=gt,e.nativeEvent=e};var Ze,bt={enumerable:!1,configurable:!0,get:function(){return this.class}},je=a.vnode;a.vnode=function(e){typeof e.type==\"string\"&&function(t){var n=t.props,r=t.type,i={};for(var o in n){var u=n[o];if(!(o===\"value\"&&\"defaultValue\"in n&&u==null||ht&&o===\"children\"&&r===\"noscript\"||o===\"class\"||o===\"className\")){var l=o.toLowerCase();o===\"defaultValue\"&&\"value\"in n&&n.value==null?o=\"value\":o===\"download\"&&u===!0?u=\"\":l===\"ondoubleclick\"?o=\"ondblclick\":l!==\"onchange\"||r!==\"input\"&&r!==\"textarea\"||vt(n.type)?l===\"onfocus\"?o=\"onfocusin\":l===\"onblur\"?o=\"onfocusout\":pt.test(o)?o=l:r.indexOf(\"-\")===-1&&ft.test(o)?o=o.replace(dt,\"-$&\").toLowerCase():u===null&&(u=void 0):l=o=\"oninput\",l===\"oninput\"&&i[o=l]&&(o=\"oninputCapture\"),i[o]=u}}r==\"select\"&&i.multiple&&Array.isArray(i.value)&&(i.value=M(n.children).forEach(function(s){s.props.selected=i.value.indexOf(s.props.value)!=-1})),r==\"select\"&&i.defaultValue!=null&&(i.value=M(n.children).forEach(function(s){s.props.selected=i.multiple?i.defaultValue.indexOf(s.props.value)!=-1:i.defaultValue==s.props.value})),n.class&&!n.className?(i.class=n.class,Object.defineProperty(i,\"className\",bt)):(n.className&&!n.class||n.class&&n.className)&&(i.class=i.className=n.className),t.props=i}(e),e.$$typeof=ct,je&&je(e)};var qe=a.__r;a.__r=function(e){qe&&qe(e),Ze=e.__c};var ze=a.diffed;a.diffed=function(e){ze&&ze(e);var t=e.props,n=e.__e;n!=null&&e.type===\"textarea\"&&\"value\"in t&&t.value!==n.value&&(n.value=t.value==null?\"\":t.value),Ze=null};var Je=G();function L(){return le(Je)}var Ke=Je;function Ct(){let[e,t]=K(0),n=ee(0);X(()=>{let o=setInterval(()=>{n.current+=1,t(n.current)},200);return()=>{clearInterval(o)}},[]);let r=e%6,i=(r>=0&&r<=2?\".\":\"\\xA0\")+(r>=1&&r<=3?\".\":\"\\xA0\")+(r>=2&&r<=4?\".\":\"\\xA0\");return m(b,null,m(\"div\",null,m(\"div\",{style:{width:\"100vw\",height:\"100vh\",position:\"fixed\",display:\"flex\",alignItems:\"center\",justifyContent:\"center\"}},m(\"div\",{style:{width:\"200px\",height:\"200px\",fontSize:\"100px\",textAlign:\"center\",fontFamily:\"monospace\",color:\"#2196F3\",cursor:\"default\"}},m(\"b\",null,i)))))}function ce(e){let[t,n]=K(),r=L(),i=ee();return X(()=>{r.isSsr()||(async()=>{let o=await import(e.quickminBundleUrl);e={...e,onload:()=>n(!0)},o.renderQuickminAdmin(e,i.current)})()},[]),m(b,null,m(\"div\",{ref:i}),!t&&m(Ct,null))}var V=class{constructor(t){this.data=t,this.req=new Request(window.location)}isSsr(){return!1}getData(t){return this.data[t]}getUrl(){return window.location}fetch=async(t,n={})=>(t.startsWith(\"/\")&&(t=new URL(this.req.url).origin+t),await fetch(t,n))};var kt=new V(window.__isoData),Et=m(Ke.Provider,{value:kt},m(ce,{...window.__isoProps}));k(Et,document.getElementById(\"isoq\"));\n";