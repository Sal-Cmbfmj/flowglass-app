import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const root=fs.realpathSync(new URL('..',import.meta.url));const ts=createRequire(root+'/package.json')('typescript');
const transpile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const data=new Map(),timers=new Map(),listeners=new Map();let timerId=0,hooks=[],index=0,effects=[],now=1000000;
const document={getElementById:()=>({}),addEventListener:(k,f)=>listeners.set(k,f),removeEventListener:k=>listeners.delete(k)};
const window={location:{pathname:'/widget.html'},dispatchEvent(){},addEventListener:(k,f)=>listeners.set(k,f),removeEventListener:k=>listeners.delete(k),setTimeout:f=>{timers.set(++timerId,f);return timerId},clearTimeout:i=>timers.delete(i),setInterval:()=>0,clearInterval(){}};
const base={Date:{now:()=>now},Event,localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},window,document};
const sc={...base,exports:{}};vm.runInNewContext(transpile(fs.readFileSync(root+'/src/timerStore.ts','utf8')),sc);const api=sc.exports;
const ic={...base,exports:{}};vm.runInNewContext(transpile(fs.readFileSync(root+'/src/i18n.ts','utf8')),ic);const i18n=ic.exports;
const react={useState:init=>{const i=index++;if(!(i in hooks))hooks[i]=typeof init==='function'?init():init;return [hooks[i],v=>hooks[i]=typeof v==='function'?v(hooks[i]):v]},useRef:init=>{const i=index++;return hooks[i]??(hooks[i]={current:init})},useEffect:(f,deps)=>{const i=index++;const old=hooks[i];if(!old||deps.some((v,j)=>v!==old.deps[j])){old?.cleanup?.();effects.push(()=>hooks[i]={deps,cleanup:f()});}}};
const jsx=(type,props,key)=>({type,props,key});const wc={...base,exports:{},require:n=>n==='react'?react:n==='react/jsx-runtime'?{jsx,jsxs:jsx}:n==='react-dom/client'?{createRoot:()=>({render(){}})}:n==='./timerStore'?api:n==='./i18n'?i18n:{}};
vm.runInNewContext(transpile(fs.readFileSync(root+'/src/widget.tsx','utf8')+'\nexport { Widget };'),wc);
function render(){index=0;const tree=wc.exports.Widget();effects.splice(0).forEach(f=>f());return tree;}
const event={detail:1,button:0,clientX:0,clientY:0,preventDefault(){},stopPropagation(){}};
let tree=render();tree.props.onClick(event);assert.equal(timers.size,1);tree.props.onContextMenu(event);assert.equal(timers.size,0);tree=render();
// Closed-menu outside gesture, then all following click/dblclick events must be inert.
listeners.get('pointerdown')({...event,target:{}});tree=render();tree.props.onClick(event);tree.props.onClick({...event,detail:2});tree.props.onDoubleClick();assert.equal(timers.size,0);assert.equal(api.snapshot().mode,'focus');assert.equal(api.snapshot().running,false);console.log('PASS menu outside click/double-click only dismisses; pending click canceled');
now+=1000;tree=render();tree.props.onClick(event);assert.equal(timers.size,1);for(const f of timers.values())f();timers.clear();assert.equal(api.snapshot().running,true);console.log('PASS normal click works after dismiss gesture');
tree=render();tree.props.onContextMenu(event);tree=render();listeners.get('keydown')({key:'Escape'});tree=render();assert.equal(tree.props.className.includes('engaged'),false);console.log('PASS Escape closes menu');

// 完成边界：最后一秒与完成提示只允许一个节点，且React身份不复用。
function timeSlot(node){ if(!node||typeof node!=="object")return null; if(node.props?.className==="w-time")return node; const cs=node.props?.children; for(const c of (Array.isArray(cs)?cs:[cs])){const found=timeSlot(c);if(found)return found;} return null; }
for(const mode of ["focus","break"]){
 data.set("flowglass-live",JSON.stringify({mode,running:true,endAt:now+1000,remainingMs:1000,durationMs:60000,started:true,finished:false,owner:"widget"}));
 hooks[0]=api.snapshot(); const before=timeSlot(render()); assert.equal(before.props.children.props.children,"00:01"); assert.equal(before.props.children.key,"countdown");
 now+=1000; api.finishIfDue(); hooks[0]=api.snapshot(); const after=timeSlot(render()); assert.equal(after.props.children.props.children,"完成"); assert.equal(after.props.children.key,"finished"); assert.equal(after.props.children.props.role,"status");
 assert.equal(Array.isArray(after.props.children),false); console.log("PASS "+mode+" completion removes numeric node and mounts sole status node");
}
api.toggleRun(); hooks[0]=api.snapshot(); const restarted=timeSlot(render()); assert.equal(restarted.props.children.key,"countdown"); assert.notEqual(restarted.props.children.props.children,"完成");console.log("PASS restarting removes completion node");

// i18n：语言存为英文后，完成提示与菜单文案切换为英文；计时/手势真值不受影响。
data.set("flowglass-live",JSON.stringify({mode:"focus",running:false,endAt:0,remainingMs:0,durationMs:60000,started:true,finished:true,owner:"widget"}));
data.set("flowglass-lang",JSON.stringify("en"));
hooks[0]=api.snapshot(); listeners.get("flowglass-lang")(); const enNode=timeSlot(render());
assert.equal(enNode.props.children.props.children,"Done"); assert.equal(enNode.props.children.key,"finished");
tree=render(); tree.props.onContextMenu(event); tree=render();
const menuBtns=tree.props.children.filter?tree.props.children:[].concat(tree.props.children).flat();
const menu=tree.props.children.find?tree.props.children.find(n=>n&&n.props&&n.props.className==="w-menu"):null;
if(menu){const texts=menu.props.children.map(b=>b.props.children);assert.equal(texts[0],"Start");assert.equal(texts[1],"Switch to Break");assert.equal(texts[2],"Reset Current Timer");}
assert.equal(api.snapshot().mode,"focus"); assert.equal(api.snapshot().finished,true);
console.log("PASS english lang switches finished label and menu strings without touching timer state");
data.set("flowglass-lang",JSON.stringify("zh")); listeners.get("flowglass-lang")(); hooks[0]=api.snapshot();
assert.equal(timeSlot(render()).props.children.props.children,"完成");console.log("PASS switching back to zh restores labels");
