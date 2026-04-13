(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,72036,(e,t,r)=>{"use strict";let{entries:n,setPrototypeOf:o,isFrozen:a,getPrototypeOf:i,getOwnPropertyDescriptor:s}=Object,{freeze:l,seal:c,create:u}=Object,{apply:f,construct:p}="u">typeof Reflect&&Reflect;l||(l=function(e){return e}),c||(c=function(e){return e}),f||(f=function(e,t){for(var r=arguments.length,n=Array(r>2?r-2:0),o=2;o<r;o++)n[o-2]=arguments[o];return e.apply(t,n)}),p||(p=function(e){for(var t=arguments.length,r=Array(t>1?t-1:0),n=1;n<t;n++)r[n-1]=arguments[n];return new e(...r)});let d=C(Array.prototype.forEach),h=C(Array.prototype.lastIndexOf),m=C(Array.prototype.pop),g=C(Array.prototype.push),y=C(Array.prototype.splice),b=C(String.prototype.toLowerCase),v=C(String.prototype.toString),w=C(String.prototype.match),x=C(String.prototype.replace),_=C(String.prototype.indexOf),S=C(String.prototype.trim),E=C(Object.prototype.hasOwnProperty),$=C(RegExp.prototype.test),k=(J=TypeError,function(){for(var e=arguments.length,t=Array(e),r=0;r<e;r++)t[r]=arguments[r];return p(J,t)});function C(e){return function(t){t instanceof RegExp&&(t.lastIndex=0);for(var r=arguments.length,n=Array(r>1?r-1:0),o=1;o<r;o++)n[o-1]=arguments[o];return f(e,t,n)}}function T(e,t){let r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:b;o&&o(e,null);let n=t.length;for(;n--;){let o=t[n];if("string"==typeof o){let e=r(o);e!==o&&(a(t)||(t[n]=e),o=e)}e[o]=!0}return e}function A(e){let t=u(null);for(let[r,o]of n(e))E(e,r)&&(Array.isArray(o)?t[r]=function(e){for(let t=0;t<e.length;t++)E(e,t)||(e[t]=null);return e}(o):o&&"object"==typeof o&&o.constructor===Object?t[r]=A(o):t[r]=o);return t}function O(e,t){for(;null!==e;){let r=s(e,t);if(r){if(r.get)return C(r.get);if("function"==typeof r.value)return C(r.value)}e=i(e)}return function(){return null}}let R=l(["a","abbr","acronym","address","area","article","aside","audio","b","bdi","bdo","big","blink","blockquote","body","br","button","canvas","caption","center","cite","code","col","colgroup","content","data","datalist","dd","decorator","del","details","dfn","dialog","dir","div","dl","dt","element","em","fieldset","figcaption","figure","font","footer","form","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","img","input","ins","kbd","label","legend","li","main","map","mark","marquee","menu","menuitem","meter","nav","nobr","ol","optgroup","option","output","p","picture","pre","progress","q","rp","rt","ruby","s","samp","search","section","select","shadow","slot","small","source","spacer","span","strike","strong","style","sub","summary","sup","table","tbody","td","template","textarea","tfoot","th","thead","time","tr","track","tt","u","ul","var","video","wbr"]),N=l(["svg","a","altglyph","altglyphdef","altglyphitem","animatecolor","animatemotion","animatetransform","circle","clippath","defs","desc","ellipse","enterkeyhint","exportparts","filter","font","g","glyph","glyphref","hkern","image","inputmode","line","lineargradient","marker","mask","metadata","mpath","part","path","pattern","polygon","polyline","radialgradient","rect","stop","style","switch","symbol","text","textpath","title","tref","tspan","view","vkern"]),P=l(["feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence"]),D=l(["animate","color-profile","cursor","discard","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","foreignobject","hatch","hatchpath","mesh","meshgradient","meshpatch","meshrow","missing-glyph","script","set","solidcolor","unknown","use"]),I=l(["math","menclose","merror","mfenced","mfrac","mglyph","mi","mlabeledtr","mmultiscripts","mn","mo","mover","mpadded","mphantom","mroot","mrow","ms","mspace","msqrt","mstyle","msub","msup","msubsup","mtable","mtd","mtext","mtr","munder","munderover","mprescripts"]),M=l(["maction","maligngroup","malignmark","mlongdiv","mscarries","mscarry","msgroup","mstack","msline","msrow","semantics","annotation","annotation-xml","mprescripts","none"]),L=l(["#text"]),j=l(["accept","action","align","alt","autocapitalize","autocomplete","autopictureinpicture","autoplay","background","bgcolor","border","capture","cellpadding","cellspacing","checked","cite","class","clear","color","cols","colspan","controls","controlslist","coords","crossorigin","datetime","decoding","default","dir","disabled","disablepictureinpicture","disableremoteplayback","download","draggable","enctype","enterkeyhint","exportparts","face","for","headers","height","hidden","high","href","hreflang","id","inert","inputmode","integrity","ismap","kind","label","lang","list","loading","loop","low","max","maxlength","media","method","min","minlength","multiple","muted","name","nonce","noshade","novalidate","nowrap","open","optimum","part","pattern","placeholder","playsinline","popover","popovertarget","popovertargetaction","poster","preload","pubdate","radiogroup","readonly","rel","required","rev","reversed","role","rows","rowspan","spellcheck","scope","selected","shape","size","sizes","slot","span","srclang","start","src","srcset","step","style","summary","tabindex","title","translate","type","usemap","valign","value","width","wrap","xmlns","slot"]),z=l(["accent-height","accumulate","additive","alignment-baseline","amplitude","ascent","attributename","attributetype","azimuth","basefrequency","baseline-shift","begin","bias","by","class","clip","clippathunits","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","cx","cy","d","dx","dy","diffuseconstant","direction","display","divisor","dur","edgemode","elevation","end","exponent","fill","fill-opacity","fill-rule","filter","filterunits","flood-color","flood-opacity","font-family","font-size","font-size-adjust","font-stretch","font-style","font-variant","font-weight","fx","fy","g1","g2","glyph-name","glyphref","gradientunits","gradienttransform","height","href","id","image-rendering","in","in2","intercept","k","k1","k2","k3","k4","kerning","keypoints","keysplines","keytimes","lang","lengthadjust","letter-spacing","kernelmatrix","kernelunitlength","lighting-color","local","marker-end","marker-mid","marker-start","markerheight","markerunits","markerwidth","maskcontentunits","maskunits","max","mask","mask-type","media","method","mode","min","name","numoctaves","offset","operator","opacity","order","orient","orientation","origin","overflow","paint-order","path","pathlength","patterncontentunits","patterntransform","patternunits","points","preservealpha","preserveaspectratio","primitiveunits","r","rx","ry","radius","refx","refy","repeatcount","repeatdur","restart","result","rotate","scale","seed","shape-rendering","slope","specularconstant","specularexponent","spreadmethod","startoffset","stddeviation","stitchtiles","stop-color","stop-opacity","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke","stroke-width","style","surfacescale","systemlanguage","tabindex","tablevalues","targetx","targety","transform","transform-origin","text-anchor","text-decoration","text-rendering","textlength","type","u1","u2","unicode","values","viewbox","visibility","version","vert-adv-y","vert-origin-x","vert-origin-y","width","word-spacing","wrap","writing-mode","xchannelselector","ychannelselector","x","x1","x2","xmlns","y","y1","y2","z","zoomandpan"]),F=l(["accent","accentunder","align","bevelled","close","columnsalign","columnlines","columnspan","denomalign","depth","dir","display","displaystyle","encoding","fence","frame","height","href","id","largeop","length","linethickness","lspace","lquote","mathbackground","mathcolor","mathsize","mathvariant","maxsize","minsize","movablelimits","notation","numalign","open","rowalign","rowlines","rowspacing","rowspan","rspace","rquote","scriptlevel","scriptminsize","scriptsizemultiplier","selection","separator","separators","stretchy","subscriptshift","supscriptshift","symmetric","voffset","width","xmlns"]),U=l(["xlink:href","xml:id","xlink:title","xml:space","xmlns:xlink"]),B=c(/\{\{[\w\W]*|[\w\W]*\}\}/gm),H=c(/<%[\w\W]*|[\w\W]*%>/gm),G=c(/\$\{[\w\W]*/gm),W=c(/^data-[\-\w.\u00B7-\uFFFF]+$/),q=c(/^aria-[\-\w]+$/),Y=c(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i),V=c(/^(?:\w+script|data):/i),X=c(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g),K=c(/^html$/i);var J,Z=Object.freeze({__proto__:null,ARIA_ATTR:q,ATTR_WHITESPACE:X,CUSTOM_ELEMENT:c(/^[a-z][.\w]*(-[.\w]+)+$/i),DATA_ATTR:W,DOCTYPE_NAME:K,ERB_EXPR:H,IS_ALLOWED_URI:Y,IS_SCRIPT_OR_DATA:V,MUSTACHE_EXPR:B,TMPLIT_EXPR:G});let Q=function(e,t){if("object"!=typeof e||"function"!=typeof e.createPolicy)return null;let r=null,n="data-tt-policy-suffix";t&&t.hasAttribute(n)&&(r=t.getAttribute(n));let o="dompurify"+(r?"#"+r:"");try{return e.createPolicy(o,{createHTML:e=>e,createScriptURL:e=>e})}catch(e){return console.warn("TrustedTypes policy "+o+" could not be created."),null}},ee=function(){return{afterSanitizeAttributes:[],afterSanitizeElements:[],afterSanitizeShadowDOM:[],beforeSanitizeAttributes:[],beforeSanitizeElements:[],beforeSanitizeShadowDOM:[],uponSanitizeAttribute:[],uponSanitizeElement:[],uponSanitizeShadowNode:[]}};t.exports=function e(){let t,r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"u"<typeof window?null:window,o=t=>e(t);if(o.version="3.3.1",o.removed=[],!r||!r.document||9!==r.document.nodeType||!r.Element)return o.isSupported=!1,o;let{document:a}=r,i=a,s=i.currentScript,{DocumentFragment:c,HTMLTemplateElement:f,Node:p,Element:C,NodeFilter:B,NamedNodeMap:H=r.NamedNodeMap||r.MozNamedAttrMap,HTMLFormElement:G,DOMParser:W,trustedTypes:q}=r,V=C.prototype,X=O(V,"cloneNode"),J=O(V,"remove"),et=O(V,"nextSibling"),er=O(V,"childNodes"),en=O(V,"parentNode");if("function"==typeof f){let e=a.createElement("template");e.content&&e.content.ownerDocument&&(a=e.content.ownerDocument)}let eo="",{implementation:ea,createNodeIterator:ei,createDocumentFragment:es,getElementsByTagName:el}=a,{importNode:ec}=i,eu=ee();o.isSupported="function"==typeof n&&"function"==typeof en&&ea&&void 0!==ea.createHTMLDocument;let{MUSTACHE_EXPR:ef,ERB_EXPR:ep,TMPLIT_EXPR:ed,DATA_ATTR:eh,ARIA_ATTR:em,IS_SCRIPT_OR_DATA:eg,ATTR_WHITESPACE:ey,CUSTOM_ELEMENT:eb}=Z,{IS_ALLOWED_URI:ev}=Z,ew=null,ex=T({},[...R,...N,...P,...I,...L]),e_=null,eS=T({},[...j,...z,...F,...U]),eE=Object.seal(u(null,{tagNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},allowCustomizedBuiltInElements:{writable:!0,configurable:!1,enumerable:!0,value:!1}})),e$=null,ek=null,eC=Object.seal(u(null,{tagCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeCheck:{writable:!0,configurable:!1,enumerable:!0,value:null}})),eT=!0,eA=!0,eO=!1,eR=!0,eN=!1,eP=!0,eD=!1,eI=!1,eM=!1,eL=!1,ej=!1,ez=!1,eF=!0,eU=!1,eB=!0,eH=!1,eG={},eW=null,eq=T({},["annotation-xml","audio","colgroup","desc","foreignobject","head","iframe","math","mi","mn","mo","ms","mtext","noembed","noframes","noscript","plaintext","script","style","svg","template","thead","title","video","xmp"]),eY=null,eV=T({},["audio","video","img","source","image","track"]),eX=null,eK=T({},["alt","class","for","id","label","name","pattern","placeholder","role","summary","title","value","style","xmlns"]),eJ="http://www.w3.org/1998/Math/MathML",eZ="http://www.w3.org/2000/svg",eQ="http://www.w3.org/1999/xhtml",e0=eQ,e1=!1,e2=null,e5=T({},[eJ,eZ,eQ],v),e3=T({},["mi","mo","mn","ms","mtext"]),e4=T({},["annotation-xml"]),e7=T({},["title","style","font","a","script"]),e8=null,e9=["application/xhtml+xml","text/html"],e6=null,te=null,tt=a.createElement("form"),tr=function(e){return e instanceof RegExp||e instanceof Function},tn=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};if(!te||te!==e){if(e&&"object"==typeof e||(e={}),e=A(e),e6="application/xhtml+xml"===(e8=-1===e9.indexOf(e.PARSER_MEDIA_TYPE)?"text/html":e.PARSER_MEDIA_TYPE)?v:b,ew=E(e,"ALLOWED_TAGS")?T({},e.ALLOWED_TAGS,e6):ex,e_=E(e,"ALLOWED_ATTR")?T({},e.ALLOWED_ATTR,e6):eS,e2=E(e,"ALLOWED_NAMESPACES")?T({},e.ALLOWED_NAMESPACES,v):e5,eX=E(e,"ADD_URI_SAFE_ATTR")?T(A(eK),e.ADD_URI_SAFE_ATTR,e6):eK,eY=E(e,"ADD_DATA_URI_TAGS")?T(A(eV),e.ADD_DATA_URI_TAGS,e6):eV,eW=E(e,"FORBID_CONTENTS")?T({},e.FORBID_CONTENTS,e6):eq,e$=E(e,"FORBID_TAGS")?T({},e.FORBID_TAGS,e6):A({}),ek=E(e,"FORBID_ATTR")?T({},e.FORBID_ATTR,e6):A({}),eG=!!E(e,"USE_PROFILES")&&e.USE_PROFILES,eT=!1!==e.ALLOW_ARIA_ATTR,eA=!1!==e.ALLOW_DATA_ATTR,eO=e.ALLOW_UNKNOWN_PROTOCOLS||!1,eR=!1!==e.ALLOW_SELF_CLOSE_IN_ATTR,eN=e.SAFE_FOR_TEMPLATES||!1,eP=!1!==e.SAFE_FOR_XML,eD=e.WHOLE_DOCUMENT||!1,eL=e.RETURN_DOM||!1,ej=e.RETURN_DOM_FRAGMENT||!1,ez=e.RETURN_TRUSTED_TYPE||!1,eM=e.FORCE_BODY||!1,eF=!1!==e.SANITIZE_DOM,eU=e.SANITIZE_NAMED_PROPS||!1,eB=!1!==e.KEEP_CONTENT,eH=e.IN_PLACE||!1,ev=e.ALLOWED_URI_REGEXP||Y,e0=e.NAMESPACE||eQ,e3=e.MATHML_TEXT_INTEGRATION_POINTS||e3,e4=e.HTML_INTEGRATION_POINTS||e4,eE=e.CUSTOM_ELEMENT_HANDLING||{},e.CUSTOM_ELEMENT_HANDLING&&tr(e.CUSTOM_ELEMENT_HANDLING.tagNameCheck)&&(eE.tagNameCheck=e.CUSTOM_ELEMENT_HANDLING.tagNameCheck),e.CUSTOM_ELEMENT_HANDLING&&tr(e.CUSTOM_ELEMENT_HANDLING.attributeNameCheck)&&(eE.attributeNameCheck=e.CUSTOM_ELEMENT_HANDLING.attributeNameCheck),e.CUSTOM_ELEMENT_HANDLING&&"boolean"==typeof e.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements&&(eE.allowCustomizedBuiltInElements=e.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements),eN&&(eA=!1),ej&&(eL=!0),eG&&(ew=T({},L),e_=[],!0===eG.html&&(T(ew,R),T(e_,j)),!0===eG.svg&&(T(ew,N),T(e_,z),T(e_,U)),!0===eG.svgFilters&&(T(ew,P),T(e_,z),T(e_,U)),!0===eG.mathMl&&(T(ew,I),T(e_,F),T(e_,U))),e.ADD_TAGS&&("function"==typeof e.ADD_TAGS?eC.tagCheck=e.ADD_TAGS:(ew===ex&&(ew=A(ew)),T(ew,e.ADD_TAGS,e6))),e.ADD_ATTR&&("function"==typeof e.ADD_ATTR?eC.attributeCheck=e.ADD_ATTR:(e_===eS&&(e_=A(e_)),T(e_,e.ADD_ATTR,e6))),e.ADD_URI_SAFE_ATTR&&T(eX,e.ADD_URI_SAFE_ATTR,e6),e.FORBID_CONTENTS&&(eW===eq&&(eW=A(eW)),T(eW,e.FORBID_CONTENTS,e6)),e.ADD_FORBID_CONTENTS&&(eW===eq&&(eW=A(eW)),T(eW,e.ADD_FORBID_CONTENTS,e6)),eB&&(ew["#text"]=!0),eD&&T(ew,["html","head","body"]),ew.table&&(T(ew,["tbody"]),delete e$.tbody),e.TRUSTED_TYPES_POLICY){if("function"!=typeof e.TRUSTED_TYPES_POLICY.createHTML)throw k('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');if("function"!=typeof e.TRUSTED_TYPES_POLICY.createScriptURL)throw k('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');eo=(t=e.TRUSTED_TYPES_POLICY).createHTML("")}else void 0===t&&(t=Q(q,s)),null!==t&&"string"==typeof eo&&(eo=t.createHTML(""));l&&l(e),te=e}},to=T({},[...N,...P,...D]),ta=T({},[...I,...M]),ti=function(e){let t=en(e);t&&t.tagName||(t={namespaceURI:e0,tagName:"template"});let r=b(e.tagName),n=b(t.tagName);return!!e2[e.namespaceURI]&&(e.namespaceURI===eZ?t.namespaceURI===eQ?"svg"===r:t.namespaceURI===eJ?"svg"===r&&("annotation-xml"===n||e3[n]):!!to[r]:e.namespaceURI===eJ?t.namespaceURI===eQ?"math"===r:t.namespaceURI===eZ?"math"===r&&e4[n]:!!ta[r]:e.namespaceURI===eQ?(t.namespaceURI!==eZ||!!e4[n])&&(t.namespaceURI!==eJ||!!e3[n])&&!ta[r]&&(e7[r]||!to[r]):"application/xhtml+xml"===e8&&!!e2[e.namespaceURI])},ts=function(e){g(o.removed,{element:e});try{en(e).removeChild(e)}catch(t){J(e)}},tl=function(e,t){try{g(o.removed,{attribute:t.getAttributeNode(e),from:t})}catch(e){g(o.removed,{attribute:null,from:t})}if(t.removeAttribute(e),"is"===e)if(eL||ej)try{ts(t)}catch(e){}else try{t.setAttribute(e,"")}catch(e){}},tc=function(e){let r=null,n=null;if(eM)e="<remove></remove>"+e;else{let t=w(e,/^[\r\n\t ]+/);n=t&&t[0]}"application/xhtml+xml"===e8&&e0===eQ&&(e='<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>'+e+"</body></html>");let o=t?t.createHTML(e):e;if(e0===eQ)try{r=new W().parseFromString(o,e8)}catch(e){}if(!r||!r.documentElement){r=ea.createDocument(e0,"template",null);try{r.documentElement.innerHTML=e1?eo:o}catch(e){}}let i=r.body||r.documentElement;return(e&&n&&i.insertBefore(a.createTextNode(n),i.childNodes[0]||null),e0===eQ)?el.call(r,eD?"html":"body")[0]:eD?r.documentElement:i},tu=function(e){return ei.call(e.ownerDocument||e,e,B.SHOW_ELEMENT|B.SHOW_COMMENT|B.SHOW_TEXT|B.SHOW_PROCESSING_INSTRUCTION|B.SHOW_CDATA_SECTION,null)},tf=function(e){return e instanceof G&&("string"!=typeof e.nodeName||"string"!=typeof e.textContent||"function"!=typeof e.removeChild||!(e.attributes instanceof H)||"function"!=typeof e.removeAttribute||"function"!=typeof e.setAttribute||"string"!=typeof e.namespaceURI||"function"!=typeof e.insertBefore||"function"!=typeof e.hasChildNodes)},tp=function(e){return"function"==typeof p&&e instanceof p};function td(e,t,r){d(e,e=>{e.call(o,t,r,te)})}let th=function(e){let t=null;if(td(eu.beforeSanitizeElements,e,null),tf(e))return ts(e),!0;let r=e6(e.nodeName);if(td(eu.uponSanitizeElement,e,{tagName:r,allowedTags:ew}),eP&&e.hasChildNodes()&&!tp(e.firstElementChild)&&$(/<[/\w!]/g,e.innerHTML)&&$(/<[/\w!]/g,e.textContent)||7===e.nodeType||eP&&8===e.nodeType&&$(/<[/\w]/g,e.data))return ts(e),!0;if(!(eC.tagCheck instanceof Function&&eC.tagCheck(r))&&(!ew[r]||e$[r])){if(!e$[r]&&tg(r)&&(eE.tagNameCheck instanceof RegExp&&$(eE.tagNameCheck,r)||eE.tagNameCheck instanceof Function&&eE.tagNameCheck(r)))return!1;if(eB&&!eW[r]){let t=en(e)||e.parentNode,r=er(e)||e.childNodes;if(r&&t){let n=r.length;for(let o=n-1;o>=0;--o){let n=X(r[o],!0);n.__removalCount=(e.__removalCount||0)+1,t.insertBefore(n,et(e))}}}return ts(e),!0}return e instanceof C&&!ti(e)||("noscript"===r||"noembed"===r||"noframes"===r)&&$(/<\/no(script|embed|frames)/i,e.innerHTML)?(ts(e),!0):(eN&&3===e.nodeType&&(t=e.textContent,d([ef,ep,ed],e=>{t=x(t,e," ")}),e.textContent!==t&&(g(o.removed,{element:e.cloneNode()}),e.textContent=t)),td(eu.afterSanitizeElements,e,null),!1)},tm=function(e,t,r){if(eF&&("id"===t||"name"===t)&&(r in a||r in tt))return!1;if(eA&&!ek[t]&&$(eh,t));else if(eT&&$(em,t));else if(eC.attributeCheck instanceof Function&&eC.attributeCheck(t,e));else if(!e_[t]||ek[t]){if(!(tg(e)&&(eE.tagNameCheck instanceof RegExp&&$(eE.tagNameCheck,e)||eE.tagNameCheck instanceof Function&&eE.tagNameCheck(e))&&(eE.attributeNameCheck instanceof RegExp&&$(eE.attributeNameCheck,t)||eE.attributeNameCheck instanceof Function&&eE.attributeNameCheck(t,e))||"is"===t&&eE.allowCustomizedBuiltInElements&&(eE.tagNameCheck instanceof RegExp&&$(eE.tagNameCheck,r)||eE.tagNameCheck instanceof Function&&eE.tagNameCheck(r))))return!1}else if(eX[t]);else if($(ev,x(r,ey,"")));else if(("src"===t||"xlink:href"===t||"href"===t)&&"script"!==e&&0===_(r,"data:")&&eY[e]);else if(eO&&!$(eg,x(r,ey,"")));else if(r)return!1;return!0},tg=function(e){return"annotation-xml"!==e&&w(e,eb)},ty=function(e){td(eu.beforeSanitizeAttributes,e,null);let{attributes:r}=e;if(!r||tf(e))return;let n={attrName:"",attrValue:"",keepAttr:!0,allowedAttributes:e_,forceKeepAttr:void 0},a=r.length;for(;a--;){let{name:i,namespaceURI:s,value:l}=r[a],c=e6(i),u="value"===i?l:S(l);if(n.attrName=c,n.attrValue=u,n.keepAttr=!0,n.forceKeepAttr=void 0,td(eu.uponSanitizeAttribute,e,n),u=n.attrValue,eU&&("id"===c||"name"===c)&&(tl(i,e),u="user-content-"+u),eP&&$(/((--!?|])>)|<\/(style|title|textarea)/i,u)||"attributename"===c&&w(u,"href")){tl(i,e);continue}if(n.forceKeepAttr)continue;if(!n.keepAttr||!eR&&$(/\/>/i,u)){tl(i,e);continue}eN&&d([ef,ep,ed],e=>{u=x(u,e," ")});let f=e6(e.nodeName);if(!tm(f,c,u)){tl(i,e);continue}if(t&&"object"==typeof q&&"function"==typeof q.getAttributeType)if(s);else switch(q.getAttributeType(f,c)){case"TrustedHTML":u=t.createHTML(u);break;case"TrustedScriptURL":u=t.createScriptURL(u)}if(u!==l)try{s?e.setAttributeNS(s,i,u):e.setAttribute(i,u),tf(e)?ts(e):m(o.removed)}catch(t){tl(i,e)}}td(eu.afterSanitizeAttributes,e,null)},tb=function e(t){let r=null,n=tu(t);for(td(eu.beforeSanitizeShadowDOM,t,null);r=n.nextNode();)td(eu.uponSanitizeShadowNode,r,null),th(r),ty(r),r.content instanceof c&&e(r.content);td(eu.afterSanitizeShadowDOM,t,null)};return o.sanitize=function(e){let r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},n=null,a=null,s=null,l=null;if((e1=!e)&&(e="<!-->"),"string"!=typeof e&&!tp(e))if("function"==typeof e.toString){if("string"!=typeof(e=e.toString()))throw k("dirty is not a string, aborting")}else throw k("toString is not a function");if(!o.isSupported)return e;if(eI||tn(r),o.removed=[],"string"==typeof e&&(eH=!1),eH){if(e.nodeName){let t=e6(e.nodeName);if(!ew[t]||e$[t])throw k("root node is forbidden and cannot be sanitized in-place")}}else if(e instanceof p)1===(a=(n=tc("<!---->")).ownerDocument.importNode(e,!0)).nodeType&&"BODY"===a.nodeName||"HTML"===a.nodeName?n=a:n.appendChild(a);else{if(!eL&&!eN&&!eD&&-1===e.indexOf("<"))return t&&ez?t.createHTML(e):e;if(!(n=tc(e)))return eL?null:ez?eo:""}n&&eM&&ts(n.firstChild);let u=tu(eH?e:n);for(;s=u.nextNode();)th(s),ty(s),s.content instanceof c&&tb(s.content);if(eH)return e;if(eL){if(ej)for(l=es.call(n.ownerDocument);n.firstChild;)l.appendChild(n.firstChild);else l=n;return(e_.shadowroot||e_.shadowrootmode)&&(l=ec.call(i,l,!0)),l}let f=eD?n.outerHTML:n.innerHTML;return eD&&ew["!doctype"]&&n.ownerDocument&&n.ownerDocument.doctype&&n.ownerDocument.doctype.name&&$(K,n.ownerDocument.doctype.name)&&(f="<!DOCTYPE "+n.ownerDocument.doctype.name+">\n"+f),eN&&d([ef,ep,ed],e=>{f=x(f,e," ")}),t&&ez?t.createHTML(f):f},o.setConfig=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};tn(e),eI=!0},o.clearConfig=function(){te=null,eI=!1},o.isValidAttribute=function(e,t,r){return te||tn({}),tm(e6(e),e6(t),r)},o.addHook=function(e,t){"function"==typeof t&&g(eu[e],t)},o.removeHook=function(e,t){if(void 0!==t){let r=h(eu[e],t);return -1===r?void 0:y(eu[e],r,1)[0]}return m(eu[e])},o.removeHooks=function(e){eu[e]=[]},o.removeAllHooks=function(){eu=ee()},o}()},97301,(e,t,r)=>{t.exports=window.DOMPurify||(window.DOMPurify=e.r(72036).default||e.r(72036))},12028,e=>{"use strict";let t;function r(){return(r=Object.assign.bind()).apply(null,arguments)}function n(e){return(n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function o(e,t,r){var o;return(o=function(e,t){if("object"!=n(e)||!e)return e;var r=e[Symbol.toPrimitive];if(void 0!==r){var o=r.call(e,t||"default");if("object"!=n(o))return o;throw TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)}(t,"string"),(t="symbol"==n(o)?o:o+"")in e)?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function a(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r={};for(var n in e)if(({}).hasOwnProperty.call(e,n)){if(-1!==t.indexOf(n))continue;r[n]=e[n]}return r}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)r=a[n],-1===t.indexOf(r)&&({}).propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}var i,s,l,c,u,f,p,d,h,m,g,y,b,v,w,x,_=e.i(71645),S=e.i(47167),E=e.i(90571);Object.create(null);var $={animationIterationCount:1,aspectRatio:1,borderImageOutset:1,borderImageSlice:1,borderImageWidth:1,boxFlex:1,boxFlexGroup:1,boxOrdinalGroup:1,columnCount:1,columns:1,flex:1,flexGrow:1,flexPositive:1,flexShrink:1,flexNegative:1,flexOrder:1,gridRow:1,gridRowEnd:1,gridRowSpan:1,gridRowStart:1,gridColumn:1,gridColumnEnd:1,gridColumnSpan:1,gridColumnStart:1,msGridRow:1,msGridRowSpan:1,msGridColumn:1,msGridColumnSpan:1,fontWeight:1,lineHeight:1,opacity:1,order:1,orphans:1,scale:1,tabSize:1,widows:1,zIndex:1,zoom:1,WebkitLineClamp:1,fillOpacity:1,floodOpacity:1,stopOpacity:1,strokeDasharray:1,strokeDashoffset:1,strokeMiterlimit:1,strokeOpacity:1,strokeWidth:1},k="-ms-",C="-moz-",T="-webkit-",A="comm",O="rule",R="decl",N="@keyframes",P=Math.abs,D=String.fromCharCode,I=Object.assign;function M(e,t){return(e=t.exec(e))?e[0]:e}function L(e,t,r){return e.replace(t,r)}function j(e,t,r){return e.indexOf(t,r)}function z(e,t){return 0|e.charCodeAt(t)}function F(e,t,r){return e.slice(t,r)}function U(e){return e.length}function B(e,t){return t.push(e),e}function H(e,t){return e.filter(function(e){return!M(e,t)})}var G=1,W=1,q=0,Y=0,V=0,X="";function K(e,t,r,n,o,a,i,s){return{value:e,root:t,parent:r,type:n,props:o,children:a,line:G,column:W,length:i,return:"",siblings:s}}function J(e,t){return I(K("",null,null,"",null,null,0,e.siblings),e,{length:-e.length},t)}function Z(e){for(;e.root;)e=J(e.root,{children:[e]});B(e,e.siblings)}function Q(){return V=Y<q?z(X,Y++):0,W++,10===V&&(W=1,G++),V}function ee(){return z(X,Y)}function et(e){switch(e){case 0:case 9:case 10:case 13:case 32:return 5;case 33:case 43:case 44:case 47:case 62:case 64:case 126:case 59:case 123:case 125:return 4;case 58:return 3;case 34:case 39:case 40:case 91:return 2;case 41:case 93:return 1}return 0}function er(e){var t,r;return(t=Y-1,r=function e(t){for(;Q();)switch(V){case t:return Y;case 34:case 39:34!==t&&39!==t&&e(V);break;case 40:41===t&&e(t);break;case 92:Q()}return Y}(91===e?e+2:40===e?e+1:e),F(X,t,r)).trim()}function en(e,t){for(var r="",n=0;n<e.length;n++)r+=t(e[n],n,e,t)||"";return r}function eo(e,t,r,n){switch(e.type){case"@layer":if(e.children.length)break;case"@import":case"@namespace":case R:return e.return=e.return||e.value;case A:return"";case N:return e.return=e.value+"{"+en(e.children,n)+"}";case O:if(!U(e.value=e.props.join(",")))return""}return U(r=en(e.children,n))?e.return=e.value+"{"+r+"}":""}function ea(e,t,r,n){if(e.length>-1&&!e.return)switch(e.type){case R:e.return=function e(t,r,n){var o;switch(o=r,45^z(t,0)?(((o<<2^z(t,0))<<2^z(t,1))<<2^z(t,2))<<2^z(t,3):0){case 5103:return T+"print-"+t+t;case 5737:case 4201:case 3177:case 3433:case 1641:case 4457:case 2921:case 5572:case 6356:case 5844:case 3191:case 6645:case 3005:case 4215:case 6389:case 5109:case 5365:case 5621:case 3829:case 6391:case 5879:case 5623:case 6135:case 4599:return T+t+t;case 4855:return T+t.replace("add","source-over").replace("substract","source-out").replace("intersect","source-in").replace("exclude","xor")+t;case 4789:return C+t+t;case 5349:case 4246:case 4810:case 6968:case 2756:return T+t+C+t+k+t+t;case 5936:switch(z(t,r+11)){case 114:return T+t+k+L(t,/[svh]\w+-[tblr]{2}/,"tb")+t;case 108:return T+t+k+L(t,/[svh]\w+-[tblr]{2}/,"tb-rl")+t;case 45:return T+t+k+L(t,/[svh]\w+-[tblr]{2}/,"lr")+t}case 6828:case 4268:case 2903:return T+t+k+t+t;case 6165:return T+t+k+"flex-"+t+t;case 5187:return T+t+L(t,/(\w+).+(:[^]+)/,T+"box-$1$2"+k+"flex-$1$2")+t;case 5443:return T+t+k+"flex-item-"+L(t,/flex-|-self/g,"")+(M(t,/flex-|baseline/)?"":k+"grid-row-"+L(t,/flex-|-self/g,""))+t;case 4675:return T+t+k+"flex-line-pack"+L(t,/align-content|flex-|-self/g,"")+t;case 5548:return T+t+k+L(t,"shrink","negative")+t;case 5292:return T+t+k+L(t,"basis","preferred-size")+t;case 6060:return T+"box-"+L(t,"-grow","")+T+t+k+L(t,"grow","positive")+t;case 4554:return T+L(t,/([^-])(transform)/g,"$1"+T+"$2")+t;case 6187:return L(L(L(t,/(zoom-|grab)/,T+"$1"),/(image-set)/,T+"$1"),t,"")+t;case 5495:case 3959:return L(t,/(image-set\([^]*)/,T+"$1$`$1");case 4968:return L(L(t,/(.+:)(flex-)?(.*)/,T+"box-pack:$3"+k+"flex-pack:$3"),/space-between/,"justify")+T+t+t;case 4200:if(!M(t,/flex-|baseline/))return k+"grid-column-align"+F(t,r)+t;break;case 2592:case 3360:return k+L(t,"template-","")+t;case 4384:case 3616:if(n&&n.some(function(e,t){return r=t,M(e.props,/grid-\w+-end/)}))return~j(t+(n=n[r].value),"span",0)?t:k+L(t,"-start","")+t+k+"grid-row-span:"+(~j(n,"span",0)?M(n,/\d+/):M(n,/\d+/)-M(t,/\d+/))+";";return k+L(t,"-start","")+t;case 4896:case 4128:return n&&n.some(function(e){return M(e.props,/grid-\w+-start/)})?t:k+L(L(t,"-end","-span"),"span ","")+t;case 4095:case 3583:case 4068:case 2532:return L(t,/(.+)-inline(.+)/,T+"$1$2")+t;case 8116:case 7059:case 5753:case 5535:case 5445:case 5701:case 4933:case 4677:case 5533:case 5789:case 5021:case 4765:if(U(t)-1-r>6)switch(z(t,r+1)){case 109:if(45!==z(t,r+4))break;case 102:return L(t,/(.+:)(.+)-([^]+)/,"$1"+T+"$2-$3$1"+C+(108==z(t,r+3)?"$3":"$2-$3"))+t;case 115:return~j(t,"stretch",0)?e(L(t,"stretch","fill-available"),r,n)+t:t}break;case 5152:case 5920:return L(t,/(.+?):(\d+)(\s*\/\s*(span)?\s*(\d+))?(.*)/,function(e,r,n,o,a,i,s){return k+r+":"+n+s+(o?k+r+"-span:"+(a?i:i-n)+s:"")+t});case 4949:if(121===z(t,r+6))return L(t,":",":"+T)+t;break;case 6444:switch(z(t,45===z(t,14)?18:11)){case 120:return L(t,/(.+:)([^;\s!]+)(;|(\s+)?!.+)?/,"$1"+T+(45===z(t,14)?"inline-":"")+"box$3$1"+T+"$2$3$1"+k+"$2box$3")+t;case 100:return L(t,":",":"+k)+t}break;case 5719:case 2647:case 2135:case 3927:case 2391:return L(t,"scroll-","scroll-snap-")+t}return t}(e.value,e.length,r);return;case N:return en([J(e,{value:L(e.value,"@","@"+T)})],n);case O:if(e.length){var o,a;return o=r=e.props,a=function(t){switch(M(t,n=/(::plac\w+|:read-\w+)/)){case":read-only":case":read-write":Z(J(e,{props:[L(t,/:(read-\w+)/,":"+C+"$1")]})),Z(J(e,{props:[t]})),I(e,{props:H(r,n)});break;case"::placeholder":Z(J(e,{props:[L(t,/:(plac\w+)/,":"+T+"input-$1")]})),Z(J(e,{props:[L(t,/:(plac\w+)/,":"+C+"$1")]})),Z(J(e,{props:[L(t,/:(plac\w+)/,k+"input-$1")]})),Z(J(e,{props:[t]})),I(e,{props:H(r,n)})}return""},o.map(a).join("")}}}function ei(e,t,r,n,o,a,i,s,l,c,u,f){for(var p=o-1,d=0===o?a:[""],h=d.length,m=0,g=0,y=0;m<n;++m)for(var b=0,v=F(e,p+1,p=P(g=i[m])),w=e;b<h;++b)(w=(g>0?d[b]+" "+v:L(v,/&\f/g,d[b])).trim())&&(l[y++]=w);return K(e,t,r,0===o?O:s,l,c,u,f)}function es(e,t,r,n,o){return K(e,t,r,R,F(e,0,n),F(e,n+1,-1),n,o)}var el=void 0!==S.default&&void 0!==S.default.env&&(S.default.env.REACT_APP_SC_ATTR||S.default.env.SC_ATTR)||"data-styled",ec="active",eu="data-styled-version",ef="6.3.12",ep="/*!sc*/\n",ed="u">typeof window&&"u">typeof document,eh=!!("boolean"==typeof SC_DISABLE_SPEEDY?SC_DISABLE_SPEEDY:void 0!==S.default&&void 0!==S.default.env&&void 0!==S.default.env.REACT_APP_SC_DISABLE_SPEEDY&&""!==S.default.env.REACT_APP_SC_DISABLE_SPEEDY?"false"!==S.default.env.REACT_APP_SC_DISABLE_SPEEDY&&S.default.env.REACT_APP_SC_DISABLE_SPEEDY:void 0!==S.default&&void 0!==S.default.env&&void 0!==S.default.env.SC_DISABLE_SPEEDY&&""!==S.default.env.SC_DISABLE_SPEEDY&&"false"!==S.default.env.SC_DISABLE_SPEEDY&&S.default.env.SC_DISABLE_SPEEDY);function em(e){for(var t=[],r=1;r<arguments.length;r++)t[r-1]=arguments[r];return Error("An error occurred. See https://github.com/styled-components/styled-components/blob/main/packages/styled-components/src/utils/errors.md#".concat(e," for more information.").concat(t.length>0?" Args: ".concat(t.join(", ")):""))}var eg=new Map,ey=new Map,eb=1,ev=function(e){if(eg.has(e))return eg.get(e);for(;ey.has(eb);)eb++;var t=eb++;return eg.set(e,t),ey.set(t,e),t},ew=function(e,t){eb=t+1,eg.set(e,t),ey.set(t,e)},ex=Object.freeze([]),e_=Object.freeze({}),eS=new Set(["a","abbr","address","area","article","aside","audio","b","bdi","bdo","blockquote","body","button","br","canvas","caption","cite","code","col","colgroup","data","datalist","dd","del","details","dfn","dialog","div","dl","dt","em","embed","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","hr","html","i","iframe","img","input","ins","kbd","label","legend","li","main","map","mark","menu","meter","nav","object","ol","optgroup","option","output","p","picture","pre","progress","q","rp","rt","ruby","s","samp","search","section","select","slot","small","span","strong","sub","summary","sup","table","tbody","td","template","textarea","tfoot","th","thead","time","tr","u","ul","var","video","wbr","circle","clipPath","defs","ellipse","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","filter","foreignObject","g","image","line","linearGradient","marker","mask","path","pattern","polygon","polyline","radialGradient","rect","stop","svg","switch","symbol","text","textPath","tspan","use"]),eE=/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~-]+/g,e$=/(^-|-$)/g;function ek(e){return e.replace(eE,"-").replace(e$,"")}var eC=/(a)(d)/gi,eT=function(e){return String.fromCharCode(e+(e>25?39:97))};function eA(e){var t,r="";for(t=Math.abs(e);t>52;t=t/52|0)r=eT(t%52)+r;return(eT(t%52)+r).replace(eC,"$1-$2")}var eO,eR=function(e,t){for(var r=t.length;r;)e=33*e^t.charCodeAt(--r);return e},eN=function(e){return eR(5381,e)};function eP(e){return"string"==typeof e}var eD="function"==typeof Symbol&&Symbol.for,eI=eD?Symbol.for("react.memo"):60115,eM=eD?Symbol.for("react.forward_ref"):60112,eL={childContextTypes:!0,contextType:!0,contextTypes:!0,defaultProps:!0,displayName:!0,getDefaultProps:!0,getDerivedStateFromError:!0,getDerivedStateFromProps:!0,mixins:!0,propTypes:!0,type:!0},ej={name:!0,length:!0,prototype:!0,caller:!0,callee:!0,arguments:!0,arity:!0},ez={$$typeof:!0,compare:!0,defaultProps:!0,displayName:!0,propTypes:!0,type:!0},eF=((eO={})[eM]={$$typeof:!0,render:!0,defaultProps:!0,displayName:!0,propTypes:!0},eO[eI]=ez,eO);function eU(e){return("type"in e&&e.type.$$typeof)===eI?ez:"$$typeof"in e?eF[e.$$typeof]:eL}var eB=Object.defineProperty,eH=Object.getOwnPropertyNames,eG=Object.getOwnPropertySymbols,eW=Object.getOwnPropertyDescriptor,eq=Object.getPrototypeOf,eY=Object.prototype;function eV(e){return"function"==typeof e}function eX(e){return"object"==typeof e&&"styledComponentId"in e}function eK(e,t){return e&&t?"".concat(e," ").concat(t):e||t||""}function eJ(e,t){return e.join(t||"")}function eZ(e){return null!==e&&"object"==typeof e&&e.constructor.name===Object.name&&!("props"in e&&e.$$typeof)}function eQ(e,t){Object.defineProperty(e,"toString",{value:t})}var e0=function(){function e(e){this.groupSizes=new Uint32Array(512),this.length=512,this.tag=e,this._cGroup=0,this._cIndex=0}return e.prototype.indexOfGroup=function(e){if(e===this._cGroup)return this._cIndex;var t=this._cIndex;if(e>this._cGroup)for(var r=this._cGroup;r<e;r++)t+=this.groupSizes[r];else for(r=this._cGroup-1;r>=e;r--)t-=this.groupSizes[r];return this._cGroup=e,this._cIndex=t,t},e.prototype.insertRules=function(e,t){if(e>=this.groupSizes.length){for(var r=this.groupSizes,n=r.length,o=n;e>=o;)if((o<<=1)<0)throw em(16,"".concat(e));this.groupSizes=new Uint32Array(o),this.groupSizes.set(r),this.length=o;for(var a=n;a<o;a++)this.groupSizes[a]=0}for(var i=this.indexOfGroup(e+1),s=0,l=(a=0,t.length);a<l;a++)this.tag.insertRule(i,t[a])&&(this.groupSizes[e]++,i++,s++);s>0&&this._cGroup>e&&(this._cIndex+=s)},e.prototype.clearGroup=function(e){if(e<this.length){var t=this.groupSizes[e],r=this.indexOfGroup(e),n=r+t;this.groupSizes[e]=0;for(var o=r;o<n;o++)this.tag.deleteRule(r);t>0&&this._cGroup>e&&(this._cIndex-=t)}},e.prototype.getGroup=function(e){var t="";if(e>=this.length||0===this.groupSizes[e])return t;for(var r=this.groupSizes[e],n=this.indexOfGroup(e),o=n+r,a=n;a<o;a++)t+=this.tag.getRule(a)+ep;return t},e}(),e1="style[".concat(el,"][").concat(eu,'="').concat(ef,'"]'),e2=new RegExp("^".concat(el,'\\.g(\\d+)\\[id="([\\w\\d-]+)"\\].*?"([^"]*)')),e5=function(e){return"u">typeof ShadowRoot&&e instanceof ShadowRoot||"host"in e&&11===e.nodeType},e3=function(e){if(!e)return document;if(e5(e))return e;if("getRootNode"in e){var t=e.getRootNode();if(e5(t))return t}return document},e4=function(e,t,r){for(var n,o=r.split(","),a=0,i=o.length;a<i;a++)(n=o[a])&&e.registerName(t,n)},e7=function(e,t){for(var r,n=(null!=(r=t.textContent)?r:"").split(ep),o=[],a=0,i=n.length;a<i;a++){var s=n[a].trim();if(s){var l=s.match(e2);if(l){var c=0|parseInt(l[1],10),u=l[2];0!==c&&(ew(u,c),e4(e,u,l[3]),e.getTag().insertRules(c,o)),o.length=0}else o.push(s)}}},e8=function(e){for(var t=e3(e.options.target).querySelectorAll(e1),r=0,n=t.length;r<n;r++){var o=t[r];o&&o.getAttribute(el)!==ec&&(e7(e,o),o.parentNode&&o.parentNode.removeChild(o))}};function e9(){return"u">typeof __webpack_nonce__?__webpack_nonce__:null}var e6=function(e){var t,r=document.head,n=e||r,o=document.createElement("style"),a=(t=Array.from(n.querySelectorAll("style[".concat(el,"]"))))[t.length-1],i=void 0!==a?a.nextSibling:null;o.setAttribute(el,ec),o.setAttribute(eu,ef);var s=e9();return s&&o.setAttribute("nonce",s),n.insertBefore(o,i),o},te=function(){function e(e){this.element=e6(e),this.element.appendChild(document.createTextNode("")),this.sheet=function(e){var t;if(e.sheet)return e.sheet;for(var r=null!=(t=e.getRootNode().styleSheets)?t:document.styleSheets,n=0,o=r.length;n<o;n++){var a=r[n];if(a.ownerNode===e)return a}throw em(17)}(this.element),this.length=0}return e.prototype.insertRule=function(e,t){try{return this.sheet.insertRule(t,e),this.length++,!0}catch(e){return!1}},e.prototype.deleteRule=function(e){this.sheet.deleteRule(e),this.length--},e.prototype.getRule=function(e){var t=this.sheet.cssRules[e];return t&&t.cssText?t.cssText:""},e}(),tt=function(){function e(e){this.element=e6(e),this.nodes=this.element.childNodes,this.length=0}return e.prototype.insertRule=function(e,t){if(e<=this.length&&e>=0){var r=document.createTextNode(t);return this.element.insertBefore(r,this.nodes[e]||null),this.length++,!0}return!1},e.prototype.deleteRule=function(e){this.element.removeChild(this.nodes[e]),this.length--},e.prototype.getRule=function(e){return e<this.length?this.nodes[e].textContent:""},e}(),tr=function(){function e(e){this.rules=[],this.length=0}return e.prototype.insertRule=function(e,t){return e<=this.length&&(e===this.length?this.rules.push(t):this.rules.splice(e,0,t),this.length++,!0)},e.prototype.deleteRule=function(e){this.rules.splice(e,1),this.length--},e.prototype.getRule=function(e){return e<this.length?this.rules[e]:""},e}(),tn=ed,to={isServer:!ed,useCSSOMInjection:!eh},ta=function(){function e(e,t,r){void 0===e&&(e=e_),void 0===t&&(t={});var n=this;this.options=(0,E.__assign)((0,E.__assign)({},to),e),this.gs=t,this.names=new Map(r),this.server=!!e.isServer,!this.server&&ed&&tn&&(tn=!1,e8(this)),eQ(this,function(){for(var e=n.getTag(),t=e.length,r="",o=0;o<t;o++)!function(t){var o=ey.get(t);if(void 0===o)return;var a=n.names.get(o);if(void 0===a||!a.size)return;var i=e.getGroup(t);if(0!==i.length){var s=el+".g"+t+'[id="'+o+'"]',l="";a.forEach(function(e){e.length>0&&(l+=e+",")}),r+=i+s+'{content:"'+l+'"}'+ep}}(o);return r})}return e.registerId=function(e){return ev(e)},e.prototype.rehydrate=function(){!this.server&&ed&&e8(this)},e.prototype.reconstructWithOptions=function(t,r){void 0===r&&(r=!0);var n=new e((0,E.__assign)((0,E.__assign)({},this.options),t),this.gs,r&&this.names||void 0);return!this.server&&ed&&t.target!==this.options.target&&e3(this.options.target)!==e3(t.target)&&e8(n),n},e.prototype.allocateGSInstance=function(e){return this.gs[e]=(this.gs[e]||0)+1},e.prototype.getTag=function(){var e,t,r;return this.tag||(this.tag=(t=(e=this.options).useCSSOMInjection,r=e.target,new e0(e.isServer?new tr(r):t?new te(r):new tt(r))))},e.prototype.hasNameForId=function(e,t){var r,n;return null!=(n=null==(r=this.names.get(e))?void 0:r.has(t))&&n},e.prototype.registerName=function(e,t){ev(e);var r=this.names.get(e);r?r.add(t):this.names.set(e,new Set([t]))},e.prototype.insertRules=function(e,t,r){this.registerName(e,t),this.getTag().insertRules(ev(e),r)},e.prototype.clearNames=function(e){this.names.has(e)&&this.names.get(e).clear()},e.prototype.clearRules=function(e){this.getTag().clearGroup(ev(e)),this.clearNames(e)},e.prototype.clearTag=function(){this.tag=void 0},e}();function ti(e){for(var t="",r=0;r<e.length;r++){var n=e[r];if(1===r&&"-"===n&&"-"===e[0])return e;n>="A"&&n<="Z"?t+="-"+n.toLowerCase():t+=n}return t.startsWith("ms-")?"-"+t:t}var ts=Symbol.for("sc-keyframes"),tl=function(e){return null==e||!1===e||""===e},tc=function(e){var t=[];for(var r in e){var n=e[r];e.hasOwnProperty(r)&&!tl(n)&&(Array.isArray(n)&&n.isCss||eV(n)?t.push("".concat(ti(r),":"),n,";"):eZ(n)?t.push.apply(t,(0,E.__spreadArray)((0,E.__spreadArray)(["".concat(r," {")],tc(n),!1),["}"],!1)):t.push("".concat(ti(r),": ").concat(null==n||"boolean"==typeof n||""===n?"":"number"!=typeof n||0===n||r in $||r.startsWith("--")?String(n).trim():"".concat(n,"px"),";")))}return t};function tu(e,t,r,n,o){if(void 0===o&&(o=[]),"string"==typeof e)return e&&o.push(e),o;if(tl(e))return o;if(eX(e))return o.push(".".concat(e.styledComponentId)),o;if(eV(e))return!eV(e)||e.prototype&&e.prototype.isReactComponent||!t?(o.push(e),o):tu(e(t),t,r,n,o);if("object"==typeof e&&null!==e&&ts in e)return r?(e.inject(r,n),o.push(e.getName(n))):o.push(e),o;if(eZ(e)){for(var a=tc(e),i=0;i<a.length;i++)o.push(a[i]);return o}if(!Array.isArray(e))return o.push(e.toString()),o;for(i=0;i<e.length;i++)tu(e[i],t,r,n,o);return o}function tf(e){for(var t=0;t<e.length;t+=1){var r=e[t];if(eV(r)&&!eX(r))return!1}return!0}var tp=eN(ef),td=function(){function e(e,t,r){this.rules=e,this.staticRulesId="",this.isStatic=(void 0===r||r.isStatic)&&tf(e),this.componentId=t,this.baseHash=eR(tp,t),this.baseStyle=r,ta.registerId(t)}return e.prototype.generateAndInjectStyles=function(e,t,r){var n=this.baseStyle?this.baseStyle.generateAndInjectStyles(e,t,r).className:"";if(this.isStatic&&!r.hash)if(this.staticRulesId&&t.hasNameForId(this.componentId,this.staticRulesId))n=eK(n,this.staticRulesId);else{var o=eJ(tu(this.rules,e,t,r)),a=eA(eR(this.baseHash,o)>>>0);if(!t.hasNameForId(this.componentId,a)){var i=r(o,".".concat(a),void 0,this.componentId);t.insertRules(this.componentId,a,i)}n=eK(n,a),this.staticRulesId=a}else{for(var s=eR(this.baseHash,r.hash),l="",c=0;c<this.rules.length;c++){var u=this.rules[c];if("string"==typeof u)l+=u;else if(u){var f=eJ(tu(u,e,t,r));s=eR(eR(s,String(c)),f),l+=f}}if(l){var p=eA(s>>>0);if(!t.hasNameForId(this.componentId,p)){var d=r(l,".".concat(p),void 0,this.componentId);t.insertRules(this.componentId,p,d)}n=eK(n,p)}}return{className:n,css:"u"<typeof window?t.getTag().getGroup(ev(this.componentId)):""}},e}(),th=/&/g;function tm(e){if(-1===e.indexOf("}"))return!1;for(var t=e.length,r=0,n=0,o=!1,a=0;a<t;a++){var i=e.charCodeAt(a);if(0!==n||o||47!==i||42!==e.charCodeAt(a+1))if(o)42===i&&47===e.charCodeAt(a+1)&&(o=!1,a++);else if(34!==i&&39!==i||0!==a&&92===e.charCodeAt(a-1)){if(0===n){if(123===i)r++;else if(125===i&&--r<0)return!0}}else 0===n?n=i:n===i&&(n=0);else o=!0,a++}return 0!==r||0!==n}function tg(e){var t,r,n,o,a,i,s=void 0===e?e_:e,l=s.options,c=void 0===l?e_:l,u=s.plugins,f=void 0===u?ex:u,p=function(e,t,r){return r.startsWith(a)&&r.endsWith(a)&&r.replaceAll(a,"").length>0?".".concat(o):e},d=f.slice();d.push(function(e){e.type===O&&e.value.includes("&")&&(i||(i=RegExp("\\".concat(a,"\\b"),"g")),e.props[0]=e.props[0].replace(th,a).replace(i,p))}),c.prefix&&d.push(ea),d.push(eo);var h=[],m=(r=(t=d.concat((n=function(e){return h.push(e)},function(e){!e.root&&(e=e.return)&&n(e)}))).length,function(e,n,o,a){for(var i="",s=0;s<r;s++)i+=t[s](e,n,o,a)||"";return i}),g=function(e,t,r,n){void 0===t&&(t=""),void 0===r&&(r=""),void 0===n&&(n="&"),o=n,a=t,i=void 0;var s,l,u,f=function(e){if(!tm(e))return e;for(var t=e.length,r="",n=0,o=0,a=0,i=!1,s=0;s<t;s++){var l=e.charCodeAt(s);if(0!==a||i||47!==l||42!==e.charCodeAt(s+1))if(i)42===l&&47===e.charCodeAt(s+1)&&(i=!1,s++);else if(34!==l&&39!==l||0!==s&&92===e.charCodeAt(s-1)){if(0===a)if(123===l)o++;else if(125===l){if(--o<0){for(var c=s+1;c<t;){var u=e.charCodeAt(c);if(59===u||10===u)break;c++}c<t&&59===e.charCodeAt(c)&&c++,o=0,s=c-1,n=c;continue}0===o&&(r+=e.substring(n,s+1),n=s+1)}else 59===l&&0===o&&(r+=e.substring(n,s+1),n=s+1)}else 0===a?a=l:a===l&&(a=0);else i=!0,s++}if(n<t){var f=e.substring(n);tm(f)||(r+=f)}return r}(function(e){if(-1===e.indexOf("//"))return e;for(var t=e.length,r=[],n=0,o=0,a=0,i=0;o<t;){var s=e.charCodeAt(o);if(34!==s&&39!==s||0!==o&&92===e.charCodeAt(o-1))if(0===a)if(47===s&&o+1<t&&42===e.charCodeAt(o+1)){for(o+=2;o+1<t&&(42!==e.charCodeAt(o)||47!==e.charCodeAt(o+1));)o++;o+=2}else if(40===s&&o>=3&&108==(32|e.charCodeAt(o-1))&&114==(32|e.charCodeAt(o-2))&&117==(32|e.charCodeAt(o-3)))i=1,o++;else if(i>0)41===s?i--:40===s&&i++,o++;else if(42===s&&o+1<t&&47===e.charCodeAt(o+1))o>n&&r.push(e.substring(n,o)),n=o+=2;else if(47===s&&o+1<t&&47===e.charCodeAt(o+1)){for(o>n&&r.push(e.substring(n,o));o<t&&10!==e.charCodeAt(o);)o++;n=o}else o++;else o++;else 0===a?a=s:a===s&&(a=0),o++}return 0===n?e:(n<t&&r.push(e.substring(n)),r.join(""))}(e)),p=(u=function e(t,r,n,o,a,i,s,l,c){for(var u,f,p,d,h=0,m=0,g=s,y=0,b=0,v=0,w=1,x=1,_=1,S=0,E="",$=a,k=i,C=o,T=E;x;)switch(v=S,S=Q()){case 40:if(108!=v&&58==z(T,g-1)){-1!=j(T+=L(er(S),"&","&\f"),"&\f",P(h?l[h-1]:0))&&(_=-1);break}case 34:case 39:case 91:T+=er(S);break;case 9:case 10:case 13:case 32:T+=function(e){for(;V=ee();)if(V<33)Q();else break;return et(e)>2||et(V)>3?"":" "}(v);break;case 92:T+=function(e,t){for(var r;--t&&Q()&&!(V<48)&&!(V>102)&&(!(V>57)||!(V<65))&&(!(V>70)||!(V<97)););return r=Y+(t<6&&32==ee()&&32==Q()),F(X,e,r)}(Y-1,7);continue;case 47:switch(ee()){case 42:case 47:B((u=function(e,t){for(;Q();)if(e+V===57)break;else if(e+V===84&&47===ee())break;return"/*"+F(X,t,Y-1)+"*"+D(47===e?e:Q())}(Q(),Y),f=r,p=n,d=c,K(u,f,p,A,D(V),F(u,2,-2),0,d)),c),(5==et(v||1)||5==et(ee()||1))&&U(T)&&" "!==F(T,-1,void 0)&&(T+=" ");break;default:T+="/"}break;case 123*w:l[h++]=U(T)*_;case 125*w:case 59:case 0:switch(S){case 0:case 125:x=0;case 59+m:-1==_&&(T=L(T,/\f/g,"")),b>0&&(U(T)-g||0===w&&47===v)&&B(b>32?es(T+";",o,n,g-1,c):es(L(T," ","")+";",o,n,g-2,c),c);break;case 59:T+=";";default:if(B(C=ei(T,r,n,h,m,a,l,E,$=[],k=[],g,i),i),123===S)if(0===m)e(T,r,C,C,$,i,g,l,k);else{switch(y){case 99:if(110===z(T,3))break;case 108:if(97===z(T,2))break;default:m=0;case 100:case 109:case 115:}m?e(t,C,C,o&&B(ei(t,C,C,0,0,a,l,E,a,$=[],g,k),k),a,k,g,l,o?$:k):e(T,C,C,C,[""],k,0,l,k)}}h=m=b=0,w=_=1,E=T="",g=s;break;case 58:g=1+U(T),b=v;default:if(w<1){if(123==S)--w;else if(125==S&&0==w++&&125==(V=Y>0?z(X,--Y):0,W--,10===V&&(W=1,G--),V))continue}switch(T+=D(S),S*w){case 38:_=m>0?1:(T+="\f",-1);break;case 44:l[h++]=(U(T)-1)*_,_=1;break;case 64:45===ee()&&(T+=er(Q())),y=ee(),m=g=U(E=T+=function(e){for(;!et(ee());)Q();return F(X,e,Y)}(Y)),S++;break;case 45:45===v&&2==U(T)&&(w=0)}}return i}("",null,null,null,[""],(l=s=r||t?"".concat(r," ").concat(t," { ").concat(f," }"):f,G=W=1,q=U(X=l),Y=0,s=[]),0,[0],s),X="",u);return c.namespace&&(p=function e(t,r){return t.map(function(t){return"rule"===t.type&&(t.value="".concat(r," ").concat(t.value),t.value=t.value.replaceAll(",",",".concat(r," ")),t.props=t.props.map(function(e){return"".concat(r," ").concat(e)})),Array.isArray(t.children)&&"@keyframes"!==t.type&&(t.children=e(t.children,r)),t})}(p,c.namespace)),h=[],en(p,m),h};return g.hash=f.length?f.reduce(function(e,t){return t.name||em(15),eR(e,t.name)},5381).toString():"",g}var ty=new ta,tb=tg(),tv=_.default.createContext({shouldForwardProp:void 0,styleSheet:ty,stylis:tb}),tw=(tv.Consumer,_.default.createContext(void 0));function tx(){return _.default.useContext(tv)}function t_(e){if(!_.default.useMemo)return e.children;var t=tx().styleSheet,r=_.default.useMemo(function(){var r=t;return e.sheet?r=e.sheet:e.target&&(r=r.reconstructWithOptions({target:e.target},!1)),e.disableCSSOMInjection&&(r=r.reconstructWithOptions({useCSSOMInjection:!1})),r},[e.disableCSSOMInjection,e.sheet,e.target,t]),n=_.default.useMemo(function(){return tg({options:{namespace:e.namespace,prefix:e.enableVendorPrefixes},plugins:e.stylisPlugins})},[e.enableVendorPrefixes,e.namespace,e.stylisPlugins]),o=_.default.useMemo(function(){return{shouldForwardProp:e.shouldForwardProp,styleSheet:r,stylis:n}},[e.shouldForwardProp,r,n]);return _.default.createElement(tv.Provider,{value:o},_.default.createElement(tw.Provider,{value:n},e.children))}var tS=_.default.createContext(void 0);tS.Consumer;var tE={};function t$(e,t,r){var n,o,a,i,s=eX(e),l=!eP(e),c=t.attrs,u=void 0===c?ex:c,f=t.componentId,p=void 0===f?(n=t.displayName,o=t.parentComponentId,tE[a="string"!=typeof n?"sc":ek(n)]=(tE[a]||0)+1,i="".concat(a,"-").concat(eA(eN(ef+a+tE[a])>>>0)),o?"".concat(o,"-").concat(i):i):f,d=t.displayName,h=void 0===d?eP(e)?"styled.".concat(e):"Styled(".concat(e.displayName||e.name||"Component",")"):d,m=t.displayName&&t.componentId?"".concat(ek(t.displayName),"-").concat(t.componentId):t.componentId||p,g=s&&e.attrs?e.attrs.concat(u).filter(Boolean):u,y=t.shouldForwardProp;if(s&&e.shouldForwardProp){var b=e.shouldForwardProp;if(t.shouldForwardProp){var v=t.shouldForwardProp;y=function(e,t){return b(e,t)&&v(e,t)}}else y=b}var w=new td(r,m,s?e.componentStyle:void 0);function x(e,t){return function(e,t,r){var n,o,a=e.attrs,i=e.componentStyle,s=e.defaultProps,l=e.foldedComponentIds,c=e.styledComponentId,u=e.target,f=_.default.useContext(tS),p=tx(),d=e.shouldForwardProp||p.shouldForwardProp,h=(void 0===(n=s)&&(n=e_),t.theme!==n.theme&&t.theme||f||n.theme||e_),m=function(e,t,r){for(var n,o=(0,E.__assign)((0,E.__assign)({},t),{className:void 0,theme:r}),a=0;a<e.length;a+=1){var i=eV(n=e[a])?n(o):n;for(var s in i)"className"===s?o.className=eK(o.className,i[s]):"style"===s?o.style=(0,E.__assign)((0,E.__assign)({},o.style),i[s]):s in t&&void 0===t[s]||(o[s]=i[s])}return"className"in t&&"string"==typeof t.className&&(o.className=eK(o.className,t.className)),o}(a,t,h),g=m.as||u,y={};for(var b in m)void 0===m[b]||"$"===b[0]||"as"===b||"theme"===b&&m.theme===h||("forwardedAs"===b?y.as=m.forwardedAs:d&&!d(b,g)||(y[b]=m[b]));var v=(o=tx(),i.generateAndInjectStyles(m,o.styleSheet,o.stylis)).className,w=eK(l,c);return v&&(w+=" "+v),m.className&&(w+=" "+m.className),y[eP(g)&&!eS.has(g)?"class":"className"]=w,r&&(y.ref=r),(0,_.createElement)(g,y)}(S,e,t)}x.displayName=h;var S=_.default.forwardRef(x);return S.attrs=g,S.componentStyle=w,S.displayName=h,S.shouldForwardProp=y,S.foldedComponentIds=s?eK(e.foldedComponentIds,e.styledComponentId):"",S.styledComponentId=m,S.target=s?e.target:e,Object.defineProperty(S,"defaultProps",{get:function(){return this._foldedDefaultProps},set:function(t){this._foldedDefaultProps=s?function(e){for(var t=[],r=1;r<arguments.length;r++)t[r-1]=arguments[r];for(var n=0;n<t.length;n++)!function e(t,r,n){if(void 0===n&&(n=!1),!n&&!eZ(t)&&!Array.isArray(t))return r;if(Array.isArray(r))for(var o=0;o<r.length;o++)t[o]=e(t[o],r[o]);else if(eZ(r))for(var o in r)t[o]=e(t[o],r[o]);return t}(e,t[n],!0);return e}({},e.defaultProps,t):t}}),eQ(S,function(){return".".concat(S.styledComponentId)}),l&&function e(t,r,n){if("string"!=typeof r){if(eY){var o=eq(r);o&&o!==eY&&e(t,o,n)}var a=eH(r);eG&&(a=a.concat(eG(r)));for(var i=eU(t),s=eU(r),l=0;l<a.length;++l){var c=a[l];if(!(c in ej||n&&n[c]||s&&c in s||i&&c in i)){var u=eW(r,c);try{eB(t,c,u)}catch(e){}}}}return t}(S,e,{attrs:!0,componentStyle:!0,displayName:!0,foldedComponentIds:!0,shouldForwardProp:!0,styledComponentId:!0,target:!0}),S}function tk(e,t){for(var r=[e[0]],n=0,o=t.length;n<o;n+=1)r.push(t[n],e[n+1]);return r}var tC=function(e){return Object.assign(e,{isCss:!0})};function tT(e){for(var t=[],r=1;r<arguments.length;r++)t[r-1]=arguments[r];return eV(e)||eZ(e)?tC(tu(tk(ex,(0,E.__spreadArray)([e],t,!0)))):0===t.length&&1===e.length&&"string"==typeof e[0]?tu(e):tC(tu(tk(e,t)))}var tA=function(e){return function e(t,r,n){if(void 0===n&&(n=e_),!r)throw em(1,r);var o=function(e){for(var o=[],a=1;a<arguments.length;a++)o[a-1]=arguments[a];return t(r,n,tT.apply(void 0,(0,E.__spreadArray)([e],o,!1)))};return o.attrs=function(o){return e(t,r,(0,E.__assign)((0,E.__assign)({},n),{attrs:Array.prototype.concat(n.attrs,o).filter(Boolean)}))},o.withConfig=function(o){return e(t,r,(0,E.__assign)((0,E.__assign)({},n),o))},o}(t$,e)};eS.forEach(function(e){tA[e]=tA(e)}),function(){function e(e,t){this.rules=e,this.componentId=t,this.isStatic=tf(e),ta.registerId(this.componentId+1)}e.prototype.createStyles=function(e,t,r,n){var o=n(eJ(tu(this.rules,t,r,n)),""),a=this.componentId+e;r.insertRules(a,a,o)},e.prototype.removeStyles=function(e,t){t.clearRules(this.componentId+e)},e.prototype.renderStyles=function(e,t,r,n){e>2&&ta.registerId(this.componentId+e);var o=this.componentId+e;this.isStatic?r.hasNameForId(o,o)||this.createStyles(e,t,r,n):(this.removeStyles(e,r),this.createStyles(e,t,r,n))}}();var tO=function(){function e(e,t){var r=this;this[i]=!0,this.inject=function(e,t){void 0===t&&(t=tb);var n=r.name+t.hash;e.hasNameForId(r.id,n)||e.insertRules(r.id,n,t(r.rules,n,"@keyframes"))},this.name=e,this.id="sc-keyframes-".concat(e),this.rules=t,eQ(this,function(){throw em(12,String(r.name))})}return e.prototype.getName=function(e){return void 0===e&&(e=tb),this.name+e.hash},e}();function tR(e){for(var t=[],r=1;r<arguments.length;r++)t[r-1]=arguments[r];var n=eJ(tT.apply(void 0,(0,E.__spreadArray)([e],t,!1)));return new tO(eA(eN(n)>>>0),n)}function tN(){var e=this;this._emitSheetCSS=function(){var t=e.instance.toString();if(!t)return"";var r=e9(),n=eJ([r&&'nonce="'.concat(r,'"'),"".concat(el,'="true"'),"".concat(eu,'="').concat(ef,'"')].filter(Boolean)," ");return"<style ".concat(n,">").concat(t,"</style>")},this.getStyleTags=function(){if(e.sealed)throw em(2);return e._emitSheetCSS()},this.getStyleElement=function(){if(e.sealed)throw em(2);var t,r=e.instance.toString();if(!r)return[];var n=((t={})[el]="",t[eu]=ef,t.dangerouslySetInnerHTML={__html:r},t),o=e9();return o&&(n.nonce=o),[_.default.createElement("style",(0,E.__assign)({},n,{key:"sc-0-0"}))]},this.seal=function(){e.sealed=!0},this.instance=new ta({isServer:!0}),this.sealed=!1}i=ts,tN.prototype.collectStyles=function(e){if(this.sealed)throw em(2);return _.default.createElement(t_,{sheet:this.instance},e)},tN.prototype.interleaveWithNodeStream=function(e){throw em(3)};var tP={exports:{}},tD={};tD.flattie=function(e,t,r){var n={};return"object"==typeof e&&function e(t,r,n,o,a){var i,s=a?a+n:a;if(null==o)r&&(t[a]=o);else if("object"!=typeof o)t[a]=o;else if(Array.isArray(o))for(i=0;i<o.length;i++)e(t,r,n,o[i],s+i);else for(i in o)e(t,r,n,o[i],s+i)}(n,!!r,t||".",e,""),n};class tI extends Error{response;request;options;constructor(e,t,r){const n=e.status||0===e.status?e.status:"",o=e.statusText||"",a=`${n} ${o}`.trim();super(`Request failed with ${a?`status code ${a}`:"an unknown error"}: ${t.method} ${t.url}`),this.name="HTTPError",this.response=e,this.request=t,this.options=r}}class tM extends Error{request;constructor(e){super(`Request timed out: ${e.method} ${e.url}`),this.name="TimeoutError",this.request=e}}let tL=e=>null!==e&&"object"==typeof e,tj=(...e)=>{for(let t of e)if((!tL(t)||Array.isArray(t))&&void 0!==t)throw TypeError("The `options` argument must be an object");return tB({},...e)},tz=(e={},t={})=>{let r=new globalThis.Headers(e),n=t instanceof globalThis.Headers;for(let[e,o]of new globalThis.Headers(t).entries())n&&"undefined"===o||void 0===o?r.delete(e):r.set(e,o);return r};function tF(e,t,r){return Object.hasOwn(t,r)&&void 0===t[r]?[]:tB(e[r]??[],t[r]??[])}let tU=(e={},t={})=>({beforeRequest:tF(e,t,"beforeRequest"),beforeRetry:tF(e,t,"beforeRetry"),afterResponse:tF(e,t,"afterResponse"),beforeError:tF(e,t,"beforeError")}),tB=(...e)=>{let t={},r={},n={};for(let o of e)if(Array.isArray(o))Array.isArray(t)||(t=[]),t=[...t,...o];else if(tL(o)){for(let[e,r]of Object.entries(o))tL(r)&&e in t&&(r=tB(t[e],r)),t={...t,[e]:r};tL(o.hooks)&&(n=tU(n,o.hooks),t.hooks=n),tL(o.headers)&&(r=tz(r,o.headers),t.headers=r)}return t},tH=(()=>{let e=!1,t=!1,r="function"==typeof globalThis.Request;if("function"==typeof globalThis.ReadableStream&&r)try{t=new globalThis.Request("https://empty.invalid",{body:new globalThis.ReadableStream,method:"POST",get duplex(){return e=!0,"half"}}).headers.has("Content-Type")}catch(e){if(e instanceof Error&&"unsupported BodyInit type"===e.message)return!1;throw e}return e&&!t})(),tG="function"==typeof globalThis.AbortController,tW="function"==typeof globalThis.ReadableStream,tq="function"==typeof globalThis.FormData,tY=["get","post","put","patch","head","delete"],tV={json:"application/json",text:"text/*",formData:"multipart/form-data",arrayBuffer:"*/*",blob:"*/*"},tX=Symbol("stop"),tK={json:!0,parseJson:!0,stringifyJson:!0,searchParams:!0,prefixUrl:!0,retry:!0,timeout:!0,hooks:!0,throwHttpErrors:!0,onDownloadProgress:!0,fetch:!0},tJ={method:!0,headers:!0,body:!0,mode:!0,credentials:!0,cache:!0,redirect:!0,referrer:!0,referrerPolicy:!0,integrity:!0,keepalive:!0,signal:!0,window:!0,dispatcher:!0,duplex:!0,priority:!0},tZ={limit:2,methods:["get","put","head","delete","options","trace"],statusCodes:[408,413,429,500,502,503,504],afterStatusCodes:[413,429,503],maxRetryAfter:1/0,backoffLimit:1/0,delay:e=>.3*2**(e-1)*1e3};async function tQ(e,t,r,n){return new Promise((o,a)=>{let i=setTimeout(()=>{r&&r.abort(),a(new tM(e))},n.timeout);n.fetch(e,t).then(o).catch(a).then(()=>{clearTimeout(i)})})}async function t0(e,{signal:t}){return new Promise((r,n)=>{function o(){clearTimeout(a),n(t.reason)}t&&(t.throwIfAborted(),t.addEventListener("abort",o,{once:!0}));let a=setTimeout(()=>{t?.removeEventListener("abort",o),r()},e)})}class t1{static create(e,t){let r=new t1(e,t),n=async()=>{if("number"==typeof r._options.timeout&&r._options.timeout>0x7fffffff)throw RangeError("The `timeout` option cannot be greater than 2147483647");await Promise.resolve();let e=await r._fetch();for(let t of r._options.hooks.afterResponse){let n=await t(r.request,r._options,r._decorateResponse(e.clone()));n instanceof globalThis.Response&&(e=n)}if(r._decorateResponse(e),!e.ok&&r._options.throwHttpErrors){let t=new tI(e,r.request,r._options);for(let e of r._options.hooks.beforeError)t=await e(t);throw t}if(r._options.onDownloadProgress){if("function"!=typeof r._options.onDownloadProgress)throw TypeError("The `onDownloadProgress` option must be a function");if(!tW)throw Error("Streams are not supported in your environment. `ReadableStream` is missing.");return r._stream(e.clone(),r._options.onDownloadProgress)}return e},o=r._options.retry.methods.includes(r.request.method.toLowerCase())?r._retry(n):n();for(let[e,n]of Object.entries(tV))o[e]=async()=>{r.request.headers.set("accept",r.request.headers.get("accept")||n);let a=(await o).clone();if("json"===e){if(204===a.status||0===(await a.clone().arrayBuffer()).byteLength)return"";if(t.parseJson)return t.parseJson(await a.text())}return a[e]()};return o}request;abortController;_retryCount=0;_input;_options;constructor(e,t={}){if(this._input=e,this._options={...t,headers:tz(this._input.headers,t.headers),hooks:tU({beforeRequest:[],beforeRetry:[],beforeError:[],afterResponse:[]},t.hooks),method:(e=>tY.includes(e)?e.toUpperCase():e)(t.method??this._input.method),prefixUrl:String(t.prefixUrl||""),retry:((e={})=>{if("number"==typeof e)return{...tZ,limit:e};if(e.methods&&!Array.isArray(e.methods))throw Error("retry.methods must be an array");if(e.statusCodes&&!Array.isArray(e.statusCodes))throw Error("retry.statusCodes must be an array");return{...tZ,...e}})(t.retry),throwHttpErrors:!1!==t.throwHttpErrors,timeout:t.timeout??1e4,fetch:t.fetch??globalThis.fetch.bind(globalThis)},"string"!=typeof this._input&&!(this._input instanceof URL||this._input instanceof globalThis.Request))throw TypeError("`input` must be a string, URL, or Request");if(this._options.prefixUrl&&"string"==typeof this._input){if(this._input.startsWith("/"))throw Error("`input` must not begin with a slash when using `prefixUrl`");this._options.prefixUrl.endsWith("/")||(this._options.prefixUrl+="/"),this._input=this._options.prefixUrl+this._input}if(tG){this.abortController=new globalThis.AbortController;const e=this._options.signal??this._input.signal;e?.addEventListener("abort",()=>{this.abortController.abort(e.reason)}),this._options.signal=this.abortController.signal}if(tH&&(this._options.duplex="half"),void 0!==this._options.json&&(this._options.body=this._options.stringifyJson?.(this._options.json)??JSON.stringify(this._options.json),this._options.headers.set("content-type",this._options.headers.get("content-type")??"application/json")),this.request=new globalThis.Request(this._input,this._options),this._options.searchParams){const e="string"==typeof this._options.searchParams?this._options.searchParams.replace(/^\?/,""):new URLSearchParams(this._options.searchParams).toString(),t=this.request.url.replace(/(?:\?.*?)?(?=#|$)/,"?"+e);(tq&&this._options.body instanceof globalThis.FormData||this._options.body instanceof URLSearchParams)&&!(this._options.headers&&this._options.headers["content-type"])&&this.request.headers.delete("content-type"),this.request=new globalThis.Request(new globalThis.Request(t,{...this.request}),this._options)}}_calculateRetryDelay(e){if(this._retryCount++,this._retryCount>this._options.retry.limit||e instanceof tM)throw e;if(e instanceof tI){if(!this._options.retry.statusCodes.includes(e.response.status))throw e;let t=e.response.headers.get("Retry-After")??e.response.headers.get("RateLimit-Reset")??e.response.headers.get("X-RateLimit-Reset")??e.response.headers.get("X-Rate-Limit-Reset");if(t&&this._options.retry.afterStatusCodes.includes(e.response.status)){let e=1e3*Number(t);Number.isNaN(e)?e=Date.parse(t)-Date.now():e>=Date.parse("2024-01-01")&&(e-=Date.now());let r=this._options.retry.maxRetryAfter??e;return e<r?e:r}if(413===e.response.status)throw e}let t=this._options.retry.delay(this._retryCount);return Math.min(this._options.retry.backoffLimit,t)}_decorateResponse(e){return this._options.parseJson&&(e.json=async()=>this._options.parseJson(await e.text())),e}async _retry(e){try{return await e()}catch(r){let t=Math.min(this._calculateRetryDelay(r),0x7fffffff);if(this._retryCount<1)throw r;for(let e of(await t0(t,{signal:this._options.signal}),this._options.hooks.beforeRetry))if(await e({request:this.request,options:this._options,error:r,retryCount:this._retryCount})===tX)return;return this._retry(e)}}async _fetch(){for(let e of this._options.hooks.beforeRequest){let t=await e(this.request,this._options);if(t instanceof Request){this.request=t;break}if(t instanceof Response)return t}let e=((e,t)=>{let r={};for(let n in t)n in tJ||n in tK||n in e||(r[n]=t[n]);return r})(this.request,this._options),t=this.request;return(this.request=t.clone(),!1===this._options.timeout)?this._options.fetch(t,e):tQ(t,e,this.abortController,this._options)}_stream(e,t){let r=Number(e.headers.get("content-length"))||0,n=0;return 204===e.status?(t&&t({percent:1,totalBytes:r,transferredBytes:n},new Uint8Array),new globalThis.Response(null,{status:e.status,statusText:e.statusText,headers:e.headers})):new globalThis.Response(new globalThis.ReadableStream({async start(o){let a=e.body.getReader();async function i(){let{done:e,value:s}=await a.read();e?o.close():(t&&(n+=s.byteLength,t({percent:0===r?0:n/r,transferredBytes:n,totalBytes:r},s)),o.enqueue(s),await i())}t&&t({percent:0,transferredBytes:0,totalBytes:r},new Uint8Array),await i()}}),{status:e.status,statusText:e.statusText,headers:e.headers})}}let t2=e=>{let t=(t,r)=>t1.create(t,tj(e,r));for(let r of tY)t[r]=(t,n)=>t1.create(t,tj(e,n,{method:r}));return t.create=e=>t2(tj(e)),t.extend=t=>("function"==typeof t&&(t=t(e??{})),t2(tj(e,t))),t.stop=tX,t};var t5=function(e){if(e.__esModule)return e;var t=e.default;if("function"==typeof t){var r=function e(){return this instanceof e?Reflect.construct(t,arguments,this.constructor):t.apply(this,arguments)};r.prototype=t.prototype}else r={};return Object.defineProperty(r,"__esModule",{value:!0}),Object.keys(e).forEach(function(t){var n=Object.getOwnPropertyDescriptor(e,t);Object.defineProperty(r,t,n.get?n:{enumerable:!0,get:function(){return e[t]}})}),r}(Object.freeze({__proto__:null,HTTPError:tI,TimeoutError:tM,default:t2()}));let t3={FREE:"https://api.microlink.io/",PRO:"https://pro.microlink.io/"},t4=e=>null!==e&&"object"==typeof e,{flattie:t7}=tD,{default:t8}=t5,t9=(t="arrayBuffer",({VERSION:e,MicrolinkError:r,got:n,flatten:o})=>{let a=e=>{if(!t4(e))return;let t=o(e);return Object.keys(t).reduce((e,r)=>(e[`data.${r}`]=t[r].toString(),e),{})},i=async(e,o={})=>{try{let r=await n(e,o);return o.responseType===t?r:{...r.body,response:r}}catch(c){let{response:t={}}=c,{statusCode:n,body:o,headers:a={},url:i=e}=t,s=null!=o&&null!=o.constructor&&"function"==typeof o.constructor.isBuffer&&o.constructor.isBuffer(o),l=t4(o)&&!s?o:((e,t,r)=>{try{return JSON.parse(e)}catch(o){let n=e||t.message;return{status:"error",data:{url:n},more:"https://microlink.io/efatalclient",code:"EFATALCLIENT",message:n,url:r}}})(s?o.toString():o,c,i);throw new r({...l,message:l.message,url:i,statusCode:n,headers:a})}},s=(e,{data:r,apiKey:n,endpoint:i,retry:s,cache:l,...c}={},{responseType:u="json",headers:f,...p}={})=>{let d=!!n,h=i||t3[d?"PRO":"FREE"],m=`${h}?${new URLSearchParams({url:e,...a(r),...o(c)}).toString()}`,g=d?{...f,"x-api-key":n}:{...f};return c.stream&&(u=t),[m,{...p,responseType:u,cache:l,retry:s,headers:g}]},l=e=>async(t,n,o)=>{((e="")=>{if(!(e=>{try{return/^https?:\/\//i.test(new URL(e).href)}catch(e){return!1}})(e)){let t=`The \`url\` as \`${e}\` is not valid. Ensure it has protocol (http or https) and hostname.`;throw new r({status:"fail",data:{url:t},more:"https://microlink.io/einvalurlclient",code:"EINVALURLCLIENT",message:t,url:e})}})(t);let[a,l]=s(t,n,{...e,...o});return i(a,l)},c=l();return c.extend=l,c.MicrolinkError=r,c.getApiUrl=s,c.fetchFromApi=i,c.mapRules=a,c.version=e,c.stream=n.stream,c}),t6=async(e,{responseType:t,...r})=>{try{void 0===r.timeout&&(r.timeout=!1);let n=await t8(e,r),o=await n[t](),{headers:a,status:i}=n;return{url:n.url,body:o,headers:a,statusCode:i}}catch(e){if(e.response){let{response:t}=e;e.response={...t,headers:Array.from(t.headers.entries()).reduce((e,[t,r])=>(e[t]=r,e),{}),statusCode:t.status,body:await t.text()}}throw e}};t6.stream=(...e)=>t8(...e).then(e=>e.body);let re=t9({MicrolinkError:class extends Error{constructor(e){super(),this.name="MicrolinkError",Object.assign(this,e),this.description=this.message,this.message=this.code?`${this.code}, ${this.description}`:this.description}},got:t6,flatten:t7,VERSION:"0.13.20"});tP.exports=re,tP.exports.arrayBuffer=re.extend({responseType:"arrayBuffer"}),tP.exports.extend=re.extend;var rt=tP.exports.fetchFromApi=re.fetchFromApi,rr=tP.exports.getApiUrl=re.getApiUrl;tP.exports.mapRules=re.mapRules,tP.exports.MicrolinkError=re.MicrolinkError,tP.exports.version=re.version,tP.exports;let rn=["accessibility","debounce","ellipsis","is","lines","text"];function ro(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),r.push.apply(r,n)}return r}function ra(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?ro(Object(r),!0).forEach(function(t){o(e,t,r[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):ro(Object(r)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))})}return e}let ri=e=>{let{accessibility:t=!0,debounce:r=300,ellipsis:n="…",is:o="div",lines:i=3,text:s}=e,l=a(e,rn),c=(0,_.useRef)(null),u=(0,_.useRef)("."),f=ra(ra({ref:c},t?{title:s}:{}),l),p=(0,_.useMemo)(()=>"string"==typeof s&&s.length>0,[s]),d=(0,_.useCallback)(()=>{if(!p)return;let e=e=>{u.current=e,null!=c.current&&(c.current.textContent=e)},t=()=>{var e,t;return null!=(t=null==(e=c.current)?void 0:e.clientHeight)?t:0};e(".");let r=(t()+1)*i+1;if(e(s),t()<=r)return;let o=0,a=0,l=s.length;for(;o<=l;)a=Math.floor((o+l)/2),e(s.slice(0,a).trim()+n),t()<=r?o=a+1:l=a-1;e(s.slice(0,a-1).trim()+n)},[n,p,i,s]);return(0,_.useLayoutEffect)(()=>{let e,t;if(d(),null==c.current)return;let n=new ResizeObserver((t=()=>{e=void 0,d()},()=>{let n=null==e;clearTimeout(e),e=setTimeout(t,r),n&&d()}));return n.observe(c.current),()=>n.disconnect()},[d,r]),p?(0,_.createElement)(o,f,u.current):null};var rs={exports:{}},rl={exports:{}},rc=(s=f?u:(f=1,u=e=>(function(){if(l)return rs.exports;l=1;let e=RegExp(`^(${[/^(:{2}f{4}:)?10(?:\.\d{1,3}){3}$/,/^(:{2}f{4}:)?127(?:\.\d{1,3}){3}$/,/^(::f{4}:)?169\.254\.([1-9]|1?\d\d|2[0-4]\d|25[0-4])\.\d{1,3}$/,/^(:{2}f{4}:)?(172\.1[6-9]|172\.2\d|172\.3[01])(?:\.\d{1,3}){2}$/,/^(:{2}f{4}:)?192\.168(?:\.\d{1,3}){2}$/,/^f[cd][\da-f]{2}(::1$|:[\da-f]{1,4}){1,7}$/,/^fe[89ab][\da-f](::1$|:[\da-f]{1,4}){1,7}$/,/^localhost$|^0\.0\.0\.0$/].map(e=>e.source).join("|")})$`);return rs.exports=e.test.bind(e),rs.exports.regex=e,rs.exports})()(e)||(function(){if(c)return rl.exports;c=1;let e=RegExp(`^(${[/^\[(::1|::)\]$/].map(e=>e.source).join("|")})$`);return rl.exports=e.test.bind(e),rl.exports.regex=e,rl.exports})()(e)))&&s.__esModule&&Object.prototype.hasOwnProperty.call(s,"default")?s.default:s;let ru="u"<typeof window,rf=e=>null==e,rp=e=>"object"==typeof e?e.url:e,rd=function(){return tT`
    @media (max-width: 48em) {
      ${tT(...arguments)};
    }
  `},rh=e=>rc(new URL(e).hostname)?e:`https://images.weserv.nl/?${new URLSearchParams({url:e,default:e,l:9,af:"",il:"",n:-1}).toString()}`,rm=!ru&&"IntersectionObserver"in window,rg=e=>{let t=parseInt(e,10);return[Math.floor(t/3600),Math.floor(t/60)%60,t%60].filter((e,t)=>e>0||t>0).map(e=>e>=10?e:`0${e}`).join(":")},ry=(e,t,r)=>{switch(!0){case e<=t:return t;case e>=r:return r;default:return e}},rb="microlink_card",rv=`${rb}__content`,rw=`${rb}__media`,rx=`${rw}__controls`,r_={main:rb,content:rv,title:`${rv}_title`,description:`${rv}_description`,url:`${rv}_url`,mediaWrapper:`${rw}_wrapper`,media:rw,image:`${rw}_image`,videoWrapper:`${rw}_video_wrapper`,video:`${rw}_video`,audioWrapper:`${rw}_audio_wrapper`,audio:`${rw}_audio`,mediaControls:rx,playbackControl:`${rx}_playback`,volumeControl:`${rx}_volume`,rwControl:`${rx}_rewind`,ffwControl:`${rx}_fast_forward`,rateControl:`${rx}_rate`,progressBar:`${rx}_progress_bar`,progressTime:`${rx}_progress_time`,spinner:`${rx}_spinner`,iframe:`${rb}__iframe`},rS=["$useNanoClamp","children"];function rE(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),r.push.apply(r,n)}return r}function r$(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?rE(Object(r),!0).forEach(function(t){o(e,t,r[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):rE(Object(r)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))})}return e}let rk=tA(e=>{let{children:t,className:r,lines:n}=e;return rf(t)?null:_.default.createElement(ri,{className:r,lines:n,text:t,is:"p"})})`
  &&& {
    text-align: inherit;
    font-weight: inherit;
    font-family: inherit;
    color: inherit;
    margin: 0;

    ${e=>{let{$useNanoClamp:t}=e;return!t&&tT`
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      `}}
  }
`,rC=e=>{let{$useNanoClamp:t=!0,children:n}=e,o=a(e,rS),i=t?o:r$(r$({},o),{},{as:"p",title:n});return _.default.createElement(rk,r({$useNanoClamp:t},i),n)},rT={short:"100ms",medium:"150ms",long:"300ms"},rA={short:"cubic-bezier(.25,.8,.25,1)",medium:"cubic-bezier(.25,.8,.25,1)",long:"cubic-bezier(.4, 0, .2, 1)"},rO=(e,t)=>{let r=`${rT[t]} ${rA[t]}`;return e.map(e=>`${e} ${r}`).join(", ")},rR=function(){for(var e=arguments.length,t=Array(e),r=0;r<e;r++)t[r]=arguments[r];return rO(t,"short")},rN=function(){for(var e=arguments.length,t=Array(e),r=0;r<e;r++)t[r]=arguments[r];return rO(t,"medium")},rP=function(){for(var e=arguments.length,t=Array(e),r=0;r<e;r++)t[r]=arguments[r];return rO(t,"long")},rD="'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace",rI=["autoPlay","children","controls","loop","mediaRef","muted","playsInline","size"];function rM(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),r.push.apply(r,n)}return r}function rL(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?rM(Object(r),!0).forEach(function(t){o(e,t,r[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):rM(Object(r)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))})}return e}let rj={},rz=_.default.createContext(rj),rF=e=>{let{autoPlay:t,children:r,controls:n,loop:o,mediaRef:i,muted:s,playsInline:l,size:c}=e,u=a(e,rI),[f,p]=(0,_.useState)(rj),d=(0,_.useCallback)(e=>p(t=>rL(rL({},t),e)),[]),h=(0,_.useMemo)(()=>({autoPlay:t,controls:n,loop:o,mediaRef:i,muted:s,playsInline:l,size:c}),[t,n,o,i,s,l,c]),m=(0,_.useMemo)(()=>({props:h,state:f,updateState:d}),[h,f,d]);return _.default.createElement(rz.Provider,{value:m},r(u))},rU=/^www\./,rB="16px",rH=tT`
  ${rd`
    > p {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `};
`,rG=tA("div").attrs({className:r_.content})`
  display: flex;
  padding: 10px 15px;
  min-width: 0;
  box-sizing: border-box;
  ${e=>{let{$cardSize:t}=e;return tT`
    flex: ${"large"!==t?1:"0 0 125px"};
    justify-content: ${"small"!==t?"space-around":"space-between"};
    flex-direction: ${"small"!==t?"column":"row"};
    align-items: ${"small"!==t?"stretch":"center"};
  `}};
`,rW=tA("header").attrs({className:r_.title})`
  text-align: left;
  font-weight: bold;
  margin: 0;
  width: 100%;
  ${e=>{let{$cardSize:t}=e;return tT`
    flex-grow: ${"small"!==t?1.2:.8};
    font-size: ${"small"!==t?"16px":"15px"};

    ${"small"===t&&tT`
      min-width: 0;
      padding-right: 14px;
    `}
  `}}
`,rq=tA("div").attrs({className:r_.description})`
  text-align: left;
  font-size: 14px;
  flex-grow: 2;
  margin: auto 0;
  line-height: 18px;
  font-weight: normal;
  ${e=>{let{$cardSize:t}=e;return"large"!==t&&rH}};
`,rY=tA("footer").attrs({className:r_.url})`
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  margin: 0;
  flex-grow: 0;
  font-weight: normal;
  ${e=>{let{$cardSize:t}=e;return tT`
    font-size: ${"small"!==t?"12px":"10px"};
    ${"small"!==t&&"width: 100%;"}
  `}};
`,rV=tA(rC)`
  opacity: 0.75;
  transition: ${rN("opacity")};
  will-change: opacity;

  .${r_.main}:hover & {
    opacity: 1;
  }
`,rX=tA("span").attrs({title:"microlink.io"})`
  background: url('https://cdn.microlink.io/logo/logo.svg') no-repeat center
    center;
  display: block;
  margin-left: 15px;
  transition: ${rN("filter","opacity")};
  will-change: filter, opacity;
  &:not(:hover) {
    filter: grayscale(100%);
    opacity: 0.75;
  }

  min-width: ${rB};
  width: ${rB};
  background-size: ${rB};
  height: ${"12px"};
`,rK=()=>{let{state:{description:e,title:t,url:r},props:{size:n}}=(0,_.useContext)(rz),o="small"===n,a=(0,_.useMemo)(()=>(e=>{if(rf(e))return"";let{hostname:t}=new URL(e);return t.replace(rU,"")})(r),[r]),i=(0,_.useCallback)(e=>{e.preventDefault(),window.open("https://www.microlink.io","_blank")},[]);return _.default.createElement(rG,{$cardSize:n},_.default.createElement(rW,{$cardSize:n},_.default.createElement(rC,{$useNanoClamp:!1},t)),!o&&_.default.createElement(rq,{$cardSize:n},_.default.createElement(rC,{lines:2},e)),_.default.createElement(rY,{$cardSize:n},_.default.createElement(rV,{$useNanoClamp:!1},a),_.default.createElement(rX,{onClick:i})))},rJ=tR`
  0% {
    background: #e1e8ed;
  }
  70% {
    background: #cdd4d8;
  }
  100% {
    background: #e1e8ed;
  }
`,rZ=tR`
  0% {
    background: #e1e8ed;
  }
  70% {
    background: #dce3e8;
  }
  100% {
    background: #e1e8ed;
  }
`,rQ=tT`
  animation: ${rJ} .75s linear infinite;
`,r0=tT`
  animation: ${rZ} 1.25s linear infinite;
`,r1=tA("img")`
  height: 1px;
  width: 1px;
  position: absolute;
  z-index: -1;
`,r2=tT`
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background: #e1e8ed;
    z-index: 1;
    transition: ${rN("opacity","visibility")};
    will-change: opacity;

    ${e=>{let{$isLoading:t}=e;return tT`
      opacity: ${+!!t};
      visibility: ${t?"$visible":"hidden"};
    `}};
  }
`,r5={small:tT`
    flex: 0 0 48px;
  `,normal:tT`
    flex: 0 0 125px;

    ${rd`
      flex: 0 0 92px;
    `}
  `,large:tT`
    flex: 1;

    &::before {
      padding-bottom: 0;
    }
  `},r3=tA("div")`
  background: transparent no-repeat center center / cover;
  display: block;
  overflow: hidden;
  height: auto;
  position: relative;

  &::before {
    content: '';
    padding-bottom: 100%;
    display: block;
  }

  ${e=>{let{$cardSize:t}=e;return r5[t]}};

  ${r2};
`,r4=e=>{let{props:{size:t}}=(0,_.useContext)(rz);return _.default.createElement(r3,r({$cardSize:t},e))},r7=tA(r4).attrs({className:`${r_.media} ${r_.image}`})`
  background-image: ${e=>{let{$url:t}=e;return t?`url('${rh(t)}')`:""}};
`,r8=e=>{let{state:{imageUrl:t}}=(0,_.useContext)(rz);return _.default.createElement(r7,r({$url:t},e))},r9=tA(r8)`
  ${r0};
`,r6=tA("span")`
  opacity: 0.8;
  height: 16px;
  width: ${e=>{let{$cardSize:t}=e;return"small"===t?"75%":"60%"}};
  display: block;
  background: #e1e8ed;
  margin: ${e=>{let{$cardSize:t}=e;return"small"===t?"0 20px 0 0":"2px 0 8px"}};
  ${rQ};

  ${e=>{let{$cardSize:t}=e;return"large"!==t&&`
    height: 15px;
  `}};
`,ne=tA("span")`
  opacity: 0.8;
  height: 14px;
  width: 95%;
  display: block;
  position: relative;
  ${rQ};
  animation-delay: 0.125s;
`,nt=tA("span")`
  opacity: 0.8;
  height: 12px;
  width: 30%;
  display: block;
  ${rQ} animation-delay: .25s;

  ${e=>{let{$cardSize:t}=e;return"large"!==t&&`
    height: 10px;
  `}};
`,nr=()=>{let{props:{size:e}}=(0,_.useContext)(rz),t="small"===e;return _.default.createElement(_.default.Fragment,null,_.default.createElement(r9,{$cardSize:e}),_.default.createElement(rG,{$cardSize:e},_.default.createElement(r6,{$cardSize:e}),t?null:_.default.createElement(_.default.Fragment,null,_.default.createElement(ne,{$cardSize:e}),_.default.createElement(ne,{$cardSize:e,style:{marginBottom:"12px"}})),p||(p=_.default.createElement(nt,null))))},nn=tA("div")`
  backface-visibility: hidden;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: ${rR("transform")};
  will-change: transform;

  > svg {
    display: block;
  }

  &:active:not(:focus) {
    transform: scale(0.9);
  }
`,no=e=>_.default.createElement("svg",r({xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 14 14"},e),d||(d=_.default.createElement("path",{fill:"#FFF",fillRule:"evenodd",stroke:"none",strokeWidth:"1",d:"M15.5 6.205l-.705-.705L13 7.295 11.205 5.5l-.705.705L12.295 8 10.5 9.795l.705.705L13 8.705l1.795 1.795.705-.705L13.705 8 15.5 6.205zM9 15a.5.5 0 01-.355-.15L4.835 11H1.5a.5.5 0 01-.5-.5v-5a.5.5 0 01.5-.5h3.335l3.81-3.85a.5.5 0 01.705 0 .5.5 0 01.15.35v13a.5.5 0 01-.5.5z",transform:"translate(-1 -1)"}))),na=e=>_.default.createElement("svg",r({xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 14 14"},e),h||(h=_.default.createElement("path",{fill:"#FFF",fillRule:"evenodd",stroke:"none",strokeWidth:"1",d:"M13.58 4.04l-.765.645a5 5 0 01-.145 6.615l.735.7a6 6 0 00.175-7.94v-.02zM10.79 6a3 3 0 01-.09 3.97l.735.68a4 4 0 00.115-5.295L10.79 6zM9 15a.5.5 0 01-.355-.15L4.835 11H1.5a.5.5 0 01-.5-.5v-5a.5.5 0 01.5-.5h3.335l3.81-3.85a.5.5 0 01.705 0 .5.5 0 01.15.35v13a.5.5 0 01-.5.5z",transform:"translate(-1 -1)"}))),ni=tA("div")`
  z-index: 2;
  position: absolute;
  bottom: ${e=>{let{$cardSize:t}=e;return"large"===t?18:14}}px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: ${rN("opacity")};
  will-change: opacity;
`,ns=tA("svg")`
  stroke: #fff;
`,nl=tA(nn).attrs({className:r_.volumeControl})`
  ${ns} {
    width: ${e=>{let{$cardSize:t}=e;return"large"===t?16:14}}px;
    height: ${e=>{let{$cardSize:t}=e;return"large"===t?16:14}}px;

    ${e=>{let{$cardSize:t}=e;return"large"!==t&&rd`
      width: 12px;
      height: 12px;
    `}}
  }
`,nc=tA(nn).attrs({className:r_.rateControl})`
  font-size: ${e=>{let{$cardSize:t}=e;return"large"===t?12:10}}px;
  min-width: ${e=>{let{$cardSize:t}=e;return"large"===t?33:28}}px;
  line-height: 1;
  font-weight: bold;
  border: 1.5px solid #fff;
  border-radius: 9999px;
  padding: 1px 5px;
  text-align: center;
  color: #fff;
  margin-left: 10px;

  ${e=>{let{$cardSize:t}=e;return"large"!==t&&rd`
    font-size: 8px;
    margin-left: 8px;
    min-width: 23px;
  `}}
`,nu=tA("span").attrs({className:r_.progressTime})`
  margin: ${e=>{let{$right:t}=e;return t?"0 0 0 auto":"0 auto 0 0"}};
  font-family: ${rD};
  font-size: 12px;
  padding: 0 16px;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`,nf=e=>{let{$cardSize:t,currentTime:r,endTime:n,isMuted:o,onMuteClick:a,onPlaybackRateClick:i,playbackRate:s}=e,l=(0,_.useMemo)(()=>o?no:na,[o]),c=(0,_.useMemo)(()=>"large"===t,[t]);return _.default.createElement(ni,{$cardSize:t},c&&_.default.createElement(nu,null,r),_.default.createElement(nl,{title:o?"Unmute":"Mute",$cardSize:t,onClick:a},_.default.createElement(ns,{as:l})),_.default.createElement(nc,{title:"Playback Rate",$cardSize:t,onClick:i},_.default.createElement("span",null,s,"x")),c&&_.default.createElement(nu,{$right:!0},n))},np=["$isPlaying"],nd=e=>_.default.createElement("svg",r({xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 16 20"},e),m||(m=_.default.createElement("path",{fill:"#FFF",fillRule:"evenodd",stroke:"none",strokeWidth:"1",d:"M12 6h-2a2 2 0 00-2 2v16a2 2 0 002 2h2a2 2 0 002-2V8a2 2 0 00-2-2zm10 0h-2a2 2 0 00-2 2v16a2 2 0 002 2h2a2 2 0 002-2V8a2 2 0 00-2-2z",transform:"translate(-8 -6)"}))),nh=e=>_.default.createElement("svg",r({xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 21 24"},e),g||(g=_.default.createElement("path",{fill:"#FFF",fillRule:"evenodd",stroke:"none",strokeWidth:"1",d:"M7 28a1 1 0 01-1-1V5a1 1 0 011.501-.865l19 11a1 1 0 010 1.73l-19 11A.998.998 0 017 28z",transform:"translate(-6 -4)"}))),nm={large:"50px",normal:"35px",small:"20px"},ng=tA("svg")`
  stroke: #fff;
`,ny=tA(nn).attrs({className:r_.playbackControl})`
  ${ng} {
    ${e=>{let{$cardSize:t}=e;return tT`
      width: ${nm[t]};
      height: ${nm[t]};
      padding: ${"large"===t?0:"8px"};

      ${"large"!==t&&"small"!==t&&rd`
        width: calc(${nm.small} * 1.2);
        height: calc(${nm.small} * 1.2);
      `}
    `}}
  }
`,nb=e=>{let{$isPlaying:t}=e,n=a(e,np),o=(0,_.useMemo)(()=>t?nd:nh,[t]);return _.default.createElement(ny,r({title:t?"Pause":"Play"},n),_.default.createElement(ng,{as:o}))},nv={normal:.8,small:.9},nw=tA("div").attrs(e=>{let{$isVisible:t,$positionX:r}=e;return{style:{left:r,transform:`scale(${t?1:.5}) translate(-50%, -50%)`,opacity:+!!t,visibility:t?"$visible":"hidden"}}})`
  position: absolute;
  top: 50%;
  background: #ffffff;
  border-radius: 50%;
  transform-origin: center center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  transition: ${rR("transform","opacity","visibility")};
  will-change: left, transform, opacity, visibility;
  backface-visibility: hidden;
  z-index: 3;

  ${e=>{let{$cardSize:t}=e,r=Math.floor(12*(nv[t]||1));return tT`
      height: ${r}px;
      width: ${r}px;
    `}}
`,nx=["$isDragging","$isVisible","label","$positionX","size"],n_={normal:.8},nS=tA("span").attrs(e=>{let{$position:t,$isDragging:r,$visible:n}=e;return{style:{left:`${t}px`,top:n?"-4px":"0px",visibility:n?"$visible":"hidden",opacity:+!!n,transform:`translate(-50%, ${!r?-100:-110}%)`}}})`
  position: absolute;
  background: rgba(24, 25, 25, 0.75);
  color: #fff;
  text-shadow: 0 1px 2px rgba(24, 25, 25, 0.15);
  padding: 2px 3px;
  border-radius: 4px;
  font-family: ${rD};
  font-size: ${e=>{let{$cardSize:t}=e;return 11*(n_[t]||1)}}px;
  line-height: 1;
  transition: ${rN("opacity","visibility","transform")},
    ${rP("top")};
  will-change: top, left, visibility, opacity, transform;
  backface-visibility: hidden;
`,nE=(0,_.forwardRef)((e,t)=>{let{$isDragging:n,$isVisible:o,label:i,$positionX:s,size:l}=e,c=a(e,nx);return _.default.createElement(_.default.Fragment,null,_.default.createElement(nS,r({$visible:o,$position:s,$cardSize:l,ref:t,$isDragging:n},c),i))});nE.displayName="Tooltip";let n$=["key"],nk={normal:.7,small:.6},nC={small:.9,large:1.4},nT=e=>Math.floor(6*(nC[e]||1)),nA=tA("div").attrs(()=>({className:r_.progressBar}))`
  position: relative;
  padding: ${6}px ${3}px ${3}px;
  z-index: 2;
  backface-visibility: hidden;
`,nO=tA("div").attrs(e=>{let{$cardSize:t,$isDragging:r}=e;if(r){let e=nT(t);return{style:{height:`${e}px`}}}return{}})`
  background: transparent;
  border-radius: 9999px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  background: rgba(255, 255, 255, 0.15);
  transition: ${rR("height")};
  will-change: height;
  pointer-events: none;
  position: relative;

  ${e=>{let{$cardSize:t}=e,r=Math.floor(6*(nk[t]||1)),n=nT(t);return tT`
      height: ${r}px;

      ${nA}:hover & {
        height: ${n}px;
      }
    `}}
`,nR=tA("div")`
  border-radius: inherit;
  height: 100%;
  position: relative;
  overflow: hidden;
`,nN=tA("div").attrs(e=>{let{$maskScale:t}=e;return{style:{transform:`scaleX(${t})`}}})`
  position: absolute;
  left: 0;
  top: -50%;
  height: 200%;
  width: 100%;
  background: #ffffff;
  transform-origin: left center;
  will-change: transform;
`,nP=tA("div").attrs(e=>{let{$cursorRatio:t,$isHovering:r,$progressPercent:n}=e;return{style:{left:n,transform:`scaleX(${t})`,opacity:+!!r,visibility:r?"$visible":"hidden"}}})`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.4);
  transform-origin: left center;
  transition: ${rR("opacity","visibility")};
  will-change: left, transform, opacity, $visible;
`,nD=tA("div").attrs(e=>{let{start:t,end:r}=e;return{style:{left:`${t}px`,right:`${r}px`}}})`
  background: rgba(255, 255, 255, 0.35);
  position: absolute;
  top: 0;
  bottom: 0;
`,nI=e=>{let{bufferedMedia:t,cursorX:n,duration:o,hoveredTime:i,$isDragging:s,$isHovering:l,onClick:c,onMouseDown:u,onMouseOver:f,progress:p,showTooltip:d}=e,{props:{size:h}}=(0,_.useContext)(rz),m=(0,_.useRef)(),g=(0,_.useRef)(),y=(0,_.useMemo)(()=>"small"===h,[h]),b=(0,_.useCallback)(()=>m.current?m.current.getBoundingClientRect().width-6:0,[]),v=(0,_.useMemo)(()=>ry(p/o,0,1),[o,p]),w=(0,_.useMemo)(()=>`${ry(100*v,1,99)}%`,[v]),x=(0,_.useMemo)(()=>{if(m.current){let e=b(),t=v*e,r=n-t;if(r>0)return ry((r/(e-t)).toFixed(3),0,.99)}return 0},[n,b,v]),S=(0,_.useMemo)(()=>{let e=b();return t.map((t,r)=>({key:r,start:t.start*e,end:e-t.end*e}))},[t,b]),E=(0,_.useMemo)(()=>rg(i),[i]),$=(0,_.useMemo)(()=>{if(m.current&&g.current){let e=b(),t=g.current.getBoundingClientRect().width/2;return ry(n,t,e-t)}return 0},[n,b]),k=(0,_.useMemo)(()=>({onClick:c,onMouseDown:u,onMouseOver:f}),[c,u,f]),C=(0,_.useMemo)(()=>s||l,[s,l]);return _.default.createElement(nA,r({$cardSize:h,ref:m},k),_.default.createElement(nO,{$cardSize:h,$isDragging:s},_.default.createElement(nR,null,_.default.createElement(nP,{$cursorRatio:x,$isHovering:l,$progressPercent:w}),S.map(e=>{let{key:t}=e,n=a(e,n$);return _.default.createElement(nD,r({key:t},n))}),_.default.createElement(nN,{$maskScale:v})),_.default.createElement(nw,{$cardSize:h,$isVisible:C,$positionX:w}),!y&&_.default.createElement(nE,{$isDragging:s,$isVisible:C,label:E,$positionX:$,ref:g,size:h})))},nM=["$cardSize"],nL=["$cardSize"],nj=["type","$cardSize"],nz=e=>{let{$cardSize:t}=e,n=a(e,nM);return _.default.createElement("svg",r({xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 29"},n),y||(y=_.default.createElement("path",{fill:"#FFF",fillRule:"evenodd",stroke:"none",strokeWidth:"1",d:"M4 18c0 6.627 5.373 12 12 12s12-5.373 12-12S22.627 6 16 6h-4V1L6 7l6 6V8h4c5.523 0 10 4.477 10 10s-4.477 10-10 10S6 23.523 6 18H4zm15.63 4.13a2.84 2.84 0 01-1.28-.27 2.44 2.44 0 01-.89-.77 3.57 3.57 0 01-.52-1.25 7.69 7.69 0 01-.17-1.68 7.83 7.83 0 01.17-1.68c.094-.445.27-.87.52-1.25.23-.325.535-.59.89-.77.4-.188.838-.28 1.28-.27a2.44 2.44 0 012.16 1 5.23 5.23 0 01.7 2.93 5.23 5.23 0 01-.7 2.93 2.44 2.44 0 01-2.16 1.08zm0-1.22c.411.025.8-.19 1-.55a3.38 3.38 0 00.37-1.51v-1.38a3.31 3.31 0 00-.29-1.5 1.23 1.23 0 00-2.06 0 3.31 3.31 0 00-.29 1.5v1.38a3.38 3.38 0 00.29 1.51c.195.356.575.57.98.55zm-9 1.09v-1.18h2v-5.19l-1.86 1-.55-1.06 2.32-1.3H14v6.5h1.78V22h-5.15z",transform:"translate(-4 -1)"})))},nF=e=>{let{$cardSize:t}=e,n=a(e,nL);return _.default.createElement("svg",r({xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 29"},n),b||(b=_.default.createElement("path",{fill:"#FFF",fillRule:"evenodd",stroke:"none",strokeWidth:"1",d:"M26 18c0 5.523-4.477 10-10 10S6 23.523 6 18 10.477 8 16 8h4v5l6-6-6-6v5h-4C9.373 6 4 11.373 4 18s5.373 12 12 12 12-5.373 12-12h-2zm-6.36 4.13a2.81 2.81 0 01-1.28-.27 2.36 2.36 0 01-.89-.77 3.39 3.39 0 01-.47-1.25 7.12 7.12 0 01-.17-1.68 7.24 7.24 0 01.17-1.68 3.46 3.46 0 01.52-1.25 2.36 2.36 0 01.89-.77c.4-.19.838-.282 1.28-.27a2.44 2.44 0 012.16 1 5.31 5.31 0 01.7 2.93 5.31 5.31 0 01-.7 2.93 2.44 2.44 0 01-2.21 1.08zm0-1.22a1 1 0 001-.55c.22-.472.323-.99.3-1.51v-1.38a3.17 3.17 0 00-.3-1.5 1.22 1.22 0 00-2.05 0 3.18 3.18 0 00-.29 1.5v1.38a3.25 3.25 0 00.29 1.51 1 1 0 001.05.55zm-7.02-3.49c.355.035.71-.06 1-.27a.84.84 0 00.31-.68v-.08a.94.94 0 00-.3-.74 1.2 1.2 0 00-.83-.27 1.65 1.65 0 00-.89.24 2.1 2.1 0 00-.68.68l-.93-.83a5.37 5.37 0 01.44-.51 2.7 2.7 0 01.54-.4 2.55 2.55 0 01.7-.27 3.25 3.25 0 01.87-.1 3.94 3.94 0 011.06.14c.297.078.576.214.82.4.224.168.408.383.54.63.123.26.184.543.18.83a2 2 0 01-.11.67 1.82 1.82 0 01-.32.52 1.79 1.79 0 01-.47.36 2.27 2.27 0 01-.57.2V18c.219.04.431.11.63.21a1.7 1.7 0 01.85.93c.084.234.124.481.12.73a2 2 0 01-.2.92 2 2 0 01-.58.72 2.66 2.66 0 01-.89.45 3.76 3.76 0 01-1.15.16 4.1 4.1 0 01-1-.11 3.1 3.1 0 01-.76-.31 2.76 2.76 0 01-.56-.45 4.22 4.22 0 01-.44-.55l1.07-.81c.082.147.175.288.28.42.105.128.226.243.36.34.137.097.29.171.45.22a2 2 0 00.57.07 1.45 1.45 0 001-.3 1.12 1.12 0 00.34-.85v-.08a1 1 0 00-.37-.8 1.78 1.78 0 00-1.06-.28h-.76v-1.21h.74z",transform:"translate(-4 -1)"})))},nU=tA("svg")`
  stroke: #fff;
  width: ${e=>{let{$cardSize:t}=e;return"large"===t?30:24}}px;
  height: ${e=>{let{$cardSize:t}=e;return"large"===t?30:24}}px;

  ${e=>{let{$cardSize:t}=e;return"large"!==t&&rd`
    width: 0;
    height: 0;
  `}}
`,nB=tA(nn)`
  margin: 0 ${e=>{let{$cardSize:t}=e;return"large"===t?"28px":"3px"}};
`,nH=e=>{let{type:t="rewind",$cardSize:n}=e,o=a(e,nj),i=(0,_.useMemo)(()=>"rewind"===t?nz:nF,[t]);return _.default.createElement(nB,r({title:"rewind"===t?"Rewind":"Forward",$cardSize:n},o),_.default.createElement(nU,{as:i,$cardSize:n}))},nG={normal:.8,small:.6},nW={normal:.9,small:.8},nq=tR`
  100% {
    transform: rotate(360deg);
  }
`,nY=tR`
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
`,nV=tA(nn).attrs(e=>{let{$isVisible:t}=e;return{style:{opacity:+!!t,visibility:t?"$visible":"hidden"}}})(e=>{let{$cardSize:t}=e,r=`${Math.floor(12*(nW[t]||1))}px`,n=`${Math.floor(6*(nG[t]||1))}px`;return tT`
    position: absolute;
    width: ${r};
    right: ${n};
    top: ${n};
    transition: ${rN("opacity","visibility")};
    will-change: opacity, visibility;
    pointer-events: none;
  `}),nX=tA("svg")`
  width: 100%;
  animation: ${nq} 2s linear infinite;
  will-change: transform;
`,nK=tA("circle")`
  stroke: #fff;
  stroke-linecap: round;
  stroke-width: 7;
  fill: none;
  animation: ${nY} 1.5s ease-in-out infinite;
  will-change: stroke-dasharray, stroke-dashoffset;
`,nJ=e=>{let{size:t,$isVisible:r}=e;return _.default.createElement(nV,{$cardSize:t,className:r_.spinner,$isVisible:r},v||(v=_.default.createElement(nX,{viewBox:"0 0 50 50"},_.default.createElement(nK,{cx:"25",cy:"25",r:"20"}))))},nZ=tA("div").attrs({className:r_.mediaControls})`
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  transition: ${rP("background")}, ${rN("opacity")};
  will-change: background;
  display: flex;
  flex-direction: column;
  pointer-events: auto;

  ${e=>{let{$hasInteracted:t,$isDragging:r,$isPlaying:n}=e,o="rgba(0, 0, 0, 0.35)",a=t&&!n;return tT`
      .${r_.main}:hover & {
        background: ${!r?o:"rgba(0, 0, 0, 0.2)"};
      }

      .${r_.main}:not(:hover) & {
        opacity: ${!t||a?1:0};
        ${a&&`background: ${o}`};
      }
    `}}
`,nQ=tA("div")`
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
`,n0=tA("div")`
  flex: 1;

  ${e=>{let{$isVisible:t}=e;return!t&&tT`
      *[class*='${r_.mediaControls}']:not(.${r_.progressTime}) {
        transition: ${rN("opacity","visibility")};
        opacity: 0;
        visibility: hidden;
      }
    `}}
`,n1=e=>{let{MediaComponent:t,mediaProps:n}=e,{props:{autoPlay:o,controls:a,mediaRef:i,muted:s,loop:l,size:c}}=(0,_.useContext)(rz),[u,f]=(0,_.useState)(0),[p,d]=(0,_.useState)(0),[h,m]=(0,_.useState)([]),[g,y]=(0,_.useState)(0),[b,v]=(0,_.useState)(0),[w,x]=(0,_.useState)(o),[S,E]=(0,_.useState)(s),[$,k]=(0,_.useState)(!1),[C,T]=(0,_.useState)(!1),[A,O]=(0,_.useState)(!1),[R,N]=(0,_.useState)(1),[P,D]=(0,_.useState)(o),[I,M]=(0,_.useState)(!1),L=(0,_.useRef)(),j=(0,_.useCallback)(e=>{L.current=e,i&&("function"==typeof i?i(e):i.current=e)},[i]),z=(0,_.useMemo)(()=>"small"!==c,[c]),F=(0,_.useMemo)(()=>({onCanPlay:()=>k(!1),onLoadedMetadata:e=>f(e.currentTarget.duration),onPause:()=>x(!1),onPlay:()=>x(!0),onPlaying:()=>k(!1),onProgress:e=>m(e.currentTarget.buffered),onRateChange:e=>N(e.currentTarget.playbackRate),onTimeUpdate:e=>d(e.currentTarget.currentTime),onVolumeChange:e=>E(e.currentTarget.muted),onWaiting:e=>k(!0)}),[]),U=(0,_.useCallback)(e=>{if(L.current){let t=e.currentTarget.getBoundingClientRect(),r=ry(Math.floor(e.clientX-t.left),0,t.width),n=r/t.width*L.current.duration;return{cursor:r,time:n}}return{cursor:0,time:0}},[]),B=(0,_.useCallback)(()=>{L.current&&(L.current.paused?(P||D(!0),L.current.play()):L.current.pause())},[P]),H=(0,_.useCallback)(e=>{if(L.current){let t=ry(e,0,L.current.duration);L.current.currentTime=t,d(t)}},[]),G=(0,_.useCallback)((e,t)=>{if(e.preventDefault(),e.stopPropagation(),L.current){let{currentTime:e}=L.current;H("rewind"===t?e-10:e+30)}},[H]),W=(0,_.useCallback)(e=>{e.preventDefault(),e.stopPropagation(),L.current&&(L.current.muted=!L.current.muted)},[]),q=(0,_.useCallback)(e=>{e.preventDefault(),e.stopPropagation(),L.current&&(L.current.playbackRate=(e=>{switch(e){case 1:return 1.25;case 1.25:return 1.5;case 1.5:return 2;default:return 1}})(L.current.playbackRate))},[]),Y=(0,_.useCallback)(e=>{e.preventDefault(),e.stopPropagation(),O(!1)},[]),V=(0,_.useCallback)(e=>{e.preventDefault(),e.stopPropagation(),O(!0);let{time:t}=U(e);H(t)},[U,H]),X=(0,_.useCallback)(()=>T(!0),[]),K=(0,_.useCallback)(e=>{e.preventDefault(),e.stopPropagation(),A?O(!1):B()},[A,B]),J=(0,_.useCallback)(e=>{if((A||C)&&L.current){e.preventDefault();let{cursor:t,time:r}=U(e);v(r),y(t),A&&(L.current.paused||(L.current.pause(),M(!0)),H(r))}},[U,A,C,H]),Z=(0,_.useCallback)(e=>{A&&0===e.buttons&&O(!1)},[A]),Q=(0,_.useCallback)(e=>{if(A)return;let{keyCode:t}=e;if([32,37,39,77].includes(t)&&L.current)switch(e.preventDefault(),t){case 32:B();break;case 37:H(L.current.currentTime-5);break;case 39:H(L.current.currentTime+5);break;case 77:L.current.muted=!L.current.muted}},[A,H,B]),ee=(0,_.useMemo)(()=>({onClick:K,onKeyDown:Q,onMouseMove:J,onMouseOut:()=>T(!1),onMouseOver:Z}),[K,Q,J,Z]),et=(0,_.useMemo)(()=>P?{title:""}:{},[P]),er=(0,_.useMemo)(()=>h&&h.length&&L.current?[...Array(h.length).keys()].map(e=>({start:h.start(e)/L.current.duration,end:h.end(e)/L.current.duration})):[],[h]),en=(0,_.useMemo)(()=>rg(p||0),[p]),eo=(0,_.useMemo)(()=>rg(u||0),[u]),ea=(0,_.useMemo)(()=>({$cardSize:c,currentTime:en,endTime:eo,isMuted:S,onMuteClick:W,onPlaybackRateClick:q,playbackRate:R}),[en,eo,S,W,q,R,c]),ei=(0,_.useMemo)(()=>({bufferedMedia:er,cursorX:g,duration:u,hoveredTime:b,$isDragging:A,$isHovering:C,onClick:Y,onMouseDown:V,onMouseOver:X,progress:p,showTooltip:A||C}),[er,g,u,b,A,C,Y,V,X,p]);return(0,_.useEffect)(()=>{!A&&I&&L.current&&L.current.paused&&(L.current.play(),M(!1))},[I,A]),_.default.createElement(_.default.Fragment,null,_.default.createElement(t,r({},n,F,{ref:j,autoPlay:o,loop:l,muted:s})),a&&_.default.createElement(nZ,r({},et,{tabIndex:0,$hasInteracted:P,$isDragging:A,$isPlaying:w},ee),_.default.createElement(nJ,{size:c,$isVisible:$}),P?_.default.createElement(_.default.Fragment,null,_.default.createElement(n0,{$isVisible:!A},_.default.createElement(nQ,null,z&&_.default.createElement(nH,{className:r_.rwControl,type:"rewind",$cardSize:c,onClick:e=>G(e,"rewind")}),_.default.createElement(nb,{$cardSize:c,$isPlaying:w}),z&&_.default.createElement(nH,{className:r_.ffwControl,type:"fastforward",$cardSize:c,onClick:e=>G(e,"fastforward")})),z&&_.default.createElement(nf,ea)),_.default.createElement(nI,ei)):_.default.createElement(nQ,null,_.default.createElement(nb,{$cardSize:c}))))},n2=tA("video")`
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;

  &::media-controls-start-playback-button {
    display: none;
    appearance: none;
  }
`,n5={video:e=>{let{state:{imageUrl:t,playsInline:n,videoUrl:o}}=(0,_.useContext)(rz),a=(0,_.useMemo)(()=>{let e={className:`${r_.media} ${r_.video}`,src:o,playsInline:n};return t&&(e.poster=rh(t)),e},[t,n,o]);return _.default.createElement(r4,r({className:`${r_.mediaWrapper} ${r_.videoWrapper}`},e),_.default.createElement(n1,{MediaComponent:n2,mediaProps:a}))},image:r8,audio:e=>{let{state:{audioUrl:t}}=(0,_.useContext)(rz),n=(0,_.useMemo)(()=>({className:`${r_.media} ${r_.audio}`,src:t}),[t]);return _.default.createElement(r8,r({className:`${r_.mediaWrapper} ${r_.audioWrapper}`},e),_.default.createElement(n1,{MediaComponent:"audio",mediaProps:n}))}},n3=()=>{let{state:{imageUrl:e,isAudio:t,isVideo:r}}=(0,_.useContext)(rz),[n,o]=(0,_.useState)(null!==rp(e)),a=n5[t?"audio":r?"video":"image"];return _.default.createElement(_.default.Fragment,null,_.default.createElement(a,{$isLoading:n}),n&&_.default.createElement(r1,{src:e,onLoad:()=>o(!1)}))},n4=["href","rel","target","as"],n7=["contrast","direction"];function n8(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),r.push.apply(r,n)}return r}function n9(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?n8(Object(r),!0).forEach(function(t){o(e,t,r[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):n8(Object(r)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))})}return e}let n6="382px",oe=e=>{let{$backgroundColor:t,$color:r}=e;return tT`
  background-color: ${t};
  border-color: ${r};
  transition-property: filter;
  will-change: filter;

  &&& {
    color: ${r};
  }

  &:hover {
    filter: brightness(90%);
  }
`},ot=tT`
  flex-direction: column;
  height: ${n6};
  ${rd`
    height: calc(${n6} * 7/9);
  `};
`,or=tT`
  transition-property: background, border-color;
  will-change: background, border-color;
  &:hover {
    background-color: var(--microlink-hover-background-color, #f5f8fa);
    border-color: var(--microlink-hover-border-color, #8899a680);
  }
`,on=e=>{let{$cardSize:t}=e;return tT`
  flex-direction: ${"large"===t?"column-reverse":"row-reverse"};
`},oo=tT(()=>`
  max-width: var(--microlink-max-width, 500px);
  background-color: var(--microlink-background-color, #fff);
  border-width: var(--microlink-border-width, 1px);
  border-style: var(--microlink-border-style, solid);
  border-color: var(--microlink-border-color, #e1e8ed);
  color: var(--microlink-color, #181919);
  overflow: hidden;
  font-family: InterUI, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'Segoe UI', Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
  display: flex;
  text-decoration: none;
  opacity: 1;
  position: relative;
  transition-duration: ${rT.medium};
  transition-timing-function: ${rA.medium};

  &:active,
  &:hover {
    outline: 0;
  }
`),oa=tA("a")(oo,e=>{let{$isLoading:t,$contrast:r}=e;return!t&&!r&&or},e=>{let{$cardSize:t}=e;return"large"===t&&ot},e=>{let{$direction:t}=e;return"rtl"===t&&on},e=>{let{$backgroundColor:t,$color:r,$contrast:n}=e;return n&&r&&t&&oe},e=>{let{$backgroundColor:t,$color:r,$contrast:n}=e;return n&&(!r||!t)&&or}),oi=(0,_.forwardRef)((e,t)=>{let{href:r,rel:n="noopener noreferrer",target:o="_blank",as:i="a"}=e,s=a(e,n4),{state:{$backgroundColor:l,color:c,title:u},props:{size:f}}=(0,_.useContext)(rz),{contrast:p,direction:d}=s,h=a(s,n7);return(0,_.createElement)(oa,n9(n9(n9({},"a"===i?{href:r,rel:n,target:o}:void 0),h),{},{$backgroundColor:l,$cardSize:f,$color:c,$contrast:p,$direction:d,ref:t,title:u}))});oi.displayName="CardWrap";let os=["className","fetchData","lazy","loading","media","setData","url","apiKey"],ol=["className","apiKey","autoPlay","controls","direction","lazy","loop","media","fetchData","muted","playsInline","size"];function oc(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),r.push.apply(r,n)}return r}function ou(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?oc(Object(r),!0).forEach(function(t){o(e,t,r[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):oc(Object(r)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))})}return e}let of=e=>{let{className:t,fetchData:n,lazy:o,loading:i,media:s,setData:l,url:c,apiKey:u}=e,f=a(e,os),p=(0,_.useMemo)(()=>[].concat(s),[s]),{updateState:d}=(0,_.useContext)(rz),[h,m]=(0,_.useState)(!0),[g,y]=(0,_.useState)(null),[b,v]=(0,_.useState)(!1),S=(0,_.useMemo)(()=>void 0===i,[i]),[E,$]=(0,_.useMemo)(()=>(e=>{let{apiKey:t,contrast:r=!1,data:n,endpoint:o,force:a,headers:i,media:s,prerender:l,proxy:c,ttl:u,url:f}=e;return rr(f,{apiKey:t,audio:s.includes("audio"),data:n,endpoint:o,force:a,headers:i,iframe:s.includes("iframe"),palette:r,prerender:l,proxy:c,screenshot:s.includes("screenshot"),ttl:u,video:s.includes("video")})})(ou(ou({},e),{},{media:p})),[p,e]),k=(0,_.useMemo)(()=>rm&&(!0===o||"object"==typeof o),[o]),[C,T]=((e,t)=>{let[r,n]=(0,_.useState)(!1);return[r,(0,_.useCallback)(r=>{if(e){let e=new IntersectionObserver((e,t)=>{let[r]=e;r.isIntersecting&&(n(!0),t.unobserve(r.target))},t);null!==r&&e.observe(r)}else n(!0)},[e,t])]})(k,(0,_.useMemo)(()=>"object"==typeof o?o:void 0,[o])),A=(0,_.useMemo)(()=>!k||k&&C,[k,C]),O=(0,_.useCallback)(e=>{let t,r,n="function"==typeof l?l(e):ou(ou({},e),l),{title:o,description:a,url:i,video:s,audio:c,image:u,logo:f,iframe:h}=n,g=u||f||{},b=g,v=!1,w=!1;switch(((e,t)=>{let r;for(let n=0;n<t.length;n++){let o=t[n];if(!rf(e[o])){r=o;break}}return r})(n,p)){case"audio":w=!0,r=rp(c);break;case"video":v=!0,t=rp(s);break;case"iframe":y(h);break;default:b=n[p.find(e=>!rf(n[e]))]||g}let x=rp(b),{color:_,background_color:S}=b;d({url:i,color:_,title:o,description:a,imageUrl:x,videoUrl:t,audioUrl:r,isVideo:v,isAudio:w,$backgroundColor:S}),m(!1)},[d,p,l]),R=(0,_.useCallback)(()=>{A&&(m(!0),(n?rt(E,$):Promise.resolve({})).then(e=>{let{data:t}=e;return O(t)}).catch(e=>{m(!1),v(!0),console.error(`
┌───────────────┐
│ Microlink SDK │
└───────────────┘

${e.description}

${JSON.stringify(e.data)}

id   ${e.headers["x-request-id"]}
uri  ${e.url}
code ${e.code} (${e.statusCode})

microlink.io/${e.code.toLowerCase()}
`)}))},[$,n,E,O,A]);(0,_.useEffect)(R,[c,l,C]);let N=S?h:i;return b?_.default.createElement("a",r({href:c},f),c):g?(ru||g.scripts.forEach(e=>{if(!document.querySelector(`script[src="${e.src}"]`)){let t=document.createElement("script");Object.keys(e).forEach(r=>t[r]=e[r]),document.body.appendChild(t)}}),_.default.createElement("div",r({className:r_.iframe,dangerouslySetInnerHTML:{__html:g.html}},f))):_.default.createElement(oi,r({className:`${r_.main} ${t}`.trim(),href:c,$isLoading:N,ref:T},f),N?w||(w=_.default.createElement(nr,null)):x||(x=_.default.createElement(_.default.Fragment,null,_.default.createElement(n3,null),_.default.createElement(rK,null))))},op=e=>{let{className:t="",apiKey:n,autoPlay:o=!0,controls:i=!0,direction:s="ltr",lazy:l=!0,loop:c=!0,media:u=["iframe","video","audio","image","logo"],fetchData:f=!0,muted:p=!0,playsInline:d=!0,size:h="normal"}=e,m=a(e,ol);return _.default.createElement(rF,r({className:t,apiKey:n,autoPlay:o,controls:i,direction:s,lazy:l,loop:c,media:u,fetchData:f,muted:p,playsInline:d,size:h},m),e=>_.default.createElement(of,e))};e.s(["default",()=>op],12028)}]);