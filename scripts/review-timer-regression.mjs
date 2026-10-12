import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const root=fs.realpathSync(new URL('..',import.meta.url));
const require=createRequire(root+'/package.json');
const ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync(root+'/src/timerStore.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
function store(){const data=new Map();const context={exports:{},Date,Event,localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},window:{location:{pathname:'/widget.html'},dispatchEvent(){},addEventListener(){},removeEventListener(){}}};vm.runInNewContext(code,context);return {api:context.exports,data};}
for(const initial of ['idle','running','paused','finished']){
 const {api,data}=store();
 if(initial==='running'||initial==='paused'){api.toggleRun();if(initial==='paused')api.toggleRun();}
 if(initial==='finished')data.set('flowglass-live',JSON.stringify({mode:'focus',running:false,endAt:0,remainingMs:0,finished:true,owner:'widget'}));
 api.switchTo('break',{start:false});let state=api.snapshot();assert.equal(state.mode,'break');assert.equal(state.running,false);assert.equal(state.finished,false);assert.equal(state.secondsLeft,300);assert.equal(state.endAt,0);
 api.toggleRun();assert.equal(api.snapshot().running,true);console.log('PASS widget switch from '+initial+' stays idle; subsequent click starts');
}
{const {api}=store();api.switchTo('break');assert.equal(api.snapshot().running,true);console.log('PASS main start-mode behavior preserved');}
{const {api}=store();api.switchTo('break',{start:false});api.switchTo('focus',{start:false});assert.equal(api.snapshot().secondsLeft,1500);assert.equal(api.snapshot().running,false);console.log('PASS repeated switches stay idle');}

function timed(){let now=1000000;const data=new Map();const c={exports:{},Date:{now:()=>now},Event,localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},window:{location:{pathname:'/widget.html'},dispatchEvent(){},addEventListener(){},removeEventListener(){}}};vm.runInNewContext(code,c);return {a:c.exports,data,advance:ms=>now+=ms,log:()=>JSON.parse(data.get('flowglass-log')||'[]')};}
{const f=timed();f.a.toggleRun();f.advance(600000);f.a.switchTo('break',{start:false});assert.equal(f.log().length,1);assert.equal(f.log()[0].seconds,600);assert.equal(f.a.snapshot().running,false);console.log('PASS 10min interruption records one 600-second round');}
{const f=timed();f.a.toggleRun();f.advance(600000);f.a.toggleRun();f.advance(900000);f.a.resetCurrent();f.a.resetCurrent();assert.equal(f.log().length,1);assert.equal(f.log()[0].seconds,600);console.log('PASS pause excludes waiting and repeated reset does not duplicate');}
{const f=timed();f.a.toggleRun();f.advance(1500000);f.a.finishIfDue();f.a.finishIfDue();f.a.switchTo('break',{start:false});f.a.resetCurrent();assert.equal(f.log().length,1);assert.equal(f.log()[0].seconds,1500);console.log('PASS completed round never logs twice');}
{const f=timed();f.a.toggleRun();f.advance(600000);f.data.set('flowglass-settings',JSON.stringify({focus:30,break:10}));f.a.idleRemainingTo(1800000);assert.equal(f.a.snapshot().durationMs,1500000);assert.equal(f.a.snapshot().secondsLeft,900);f.a.toggleRun();f.a.idleRemainingTo(1800000);assert.equal(f.a.snapshot().secondsLeft,900);f.a.switchTo('break',{start:false});assert.equal(f.a.snapshot().secondsLeft,600);assert.equal(f.log()[0].seconds,600);console.log('PASS running/paused duration frozen; next break uses new 10min');}
{const f=timed();f.a.toggleRun();f.advance(1000);f.data.set('flowglass-settings',JSON.stringify({focus:30,break:10}));f.a.resetCurrent();assert.equal(f.a.snapshot().secondsLeft,1800);console.log('PASS reset adopts new settings');}
{const f=timed();f.a.toggleRun();f.data.set('flowglass-live',JSON.stringify({...f.a.snapshot(),owner:'closed-main'}));f.advance(1800000);f.a.finishIfDue();f.a.resetCurrent();assert.equal(f.log().length,1);assert.equal(f.log()[0].seconds,1500);console.log('PASS surviving non-owner settles once, duration capped');}
