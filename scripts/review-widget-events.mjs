import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const root=fs.realpathSync(new URL('..',import.meta.url));const ts=createRequire(root+'/package.json')('typescript');
const transpile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const data=new Map(),timers=new Map(),listeners=new Map();let timerId=0,hooks=[],index=0,effects=[],now=1000000;
const document={getElementById:()=>({}),addEventListener:(k,f)=>listeners.set(k,f),removeEventListener:k=>listeners.delete(k)};
const window={location:{pathname:'/widget.html'},dispatchEvent(){},addEventListener:(k,f)=>listeners.set(k,f),removeEventListener:k=>listeners.delete(k),setTimeout:f=>{timers.set(++timerId,f);return timerId},clearTimeout:i=>timers.delete(i),setInterval:()=>0,clearInterval(){}};
const base={Date:{now:()=>now},Event,localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},window,document};
const sc={...base,exports:{}};vm.runInNewContext(transpile(fs.readFileSync(root+'/src/timerStore.ts','utf8')),sc);const api=sc.exports;
const react={useState:init=>{const i=index++;if(!(i in hooks))hooks[i]=typeof init==='function'?init():init;return [hooks[i],v=>hooks[i]=typeof v==='function'?v(hooks[i]):v]},useRef:init=>{const i=index++;return hooks[i]??(hooks[i]={current:init})},useEffect:(f,deps)=>{const i=index++;const old=hooks[i];if(!old||deps.some((v,j)=>v!==old.deps[j])){old?.cleanup?.();effects.push(()=>hooks[i]={deps,cleanup:f()});}}};
const jsx=(type,props)=>({type,props});const wc={...base,exports:{},require:n=>n==='react'?react:n==='react/jsx-runtime'?{jsx,jsxs:jsx}:n==='react-dom/client'?{createRoot:()=>({render(){}})}:n==='./timerStore'?api:{}};
vm.runInNewContext(transpile(fs.readFileSync(root+'/src/widget.tsx','utf8')+'\nexport { Widget };'),wc);
function render(){index=0;const tree=wc.exports.Widget();effects.splice(0).forEach(f=>f());return tree;}
const event={detail:1,button:0,clientX:0,clientY:0,preventDefault(){},stopPropagation(){}};
let tree=render();tree.props.onClick(event);assert.equal(timers.size,1);tree.props.onContextMenu(event);assert.equal(timers.size,0);tree=render();
// Closed-menu outside gesture, then all following click/dblclick events must be inert.
listeners.get('pointerdown')({...event,target:{}});tree=render();tree.props.onClick(event);tree.props.onClick({...event,detail:2});tree.props.onDoubleClick();assert.equal(timers.size,0);assert.equal(api.snapshot().mode,'focus');assert.equal(api.snapshot().running,false);console.log('PASS menu outside click/double-click only dismisses; pending click canceled');
now+=1000;tree=render();tree.props.onClick(event);assert.equal(timers.size,1);for(const f of timers.values())f();timers.clear();assert.equal(api.snapshot().running,true);console.log('PASS normal click works after dismiss gesture');
tree=render();tree.props.onContextMenu(event);tree=render();listeners.get('keydown')({key:'Escape'});tree=render();assert.equal(tree.props.className.includes('engaged'),false);console.log('PASS Escape closes menu');
