// Headless smoke test: stub the DOM, auto-play many runs, report crashes + ending stats.
const fs = require('fs');
const src = fs.readFileSync('/private/tmp/claude-502/-Users-abey-Desktop-RatRace/12e4120a-72e5-4416-b31f-f18fd7ae0cdb/scratchpad/game.js', 'utf8');

class El {
  constructor(tag){ this.tag=tag; this.children=[]; this.style={}; this._cls=new Set(); this._html=''; this._txt='';
    this.classList={
      add:(c)=>this._cls.add(c), remove:(c)=>this._cls.delete(c),
      toggle:(c,f)=>{ if(f===undefined) f=!this._cls.has(c); f?this._cls.add(c):this._cls.delete(c); },
      contains:(c)=>this._cls.has(c),
    };
  }
  set className(v){ this._cls=new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className(){ return [...this._cls].join(' '); }
  set innerHTML(v){ this._html=String(v); this.children=[];
    const n=(this._html.match(/<button/g)||[]).length;
    for(let i=0;i<n;i++) this.children.push(new El('button'));
  }
  get innerHTML(){ return this._html; }
  set textContent(v){ this._txt=String(v); }
  get textContent(){ return this._txt; }
  appendChild(c){ this.children.push(c); if(c) c.parent=this; return c; }
  prepend(c){ this.children.unshift(c); if(c) c.parent=this; }
  remove(){ if(this.parent){ const i=this.parent.children.indexOf(this); if(i>=0) this.parent.children.splice(i,1); } }
  querySelector(){ return this._q || (this._q = new El('div')); }
  select(){}
  get offsetWidth(){ return 100; }
}

const ids = {};
const byId = id => ids[id] || (ids[id] = new El('div'));
let createdButtons = [];
global.document = {
  getElementById: byId,
  createElement: (t)=>{ const e=new El(t); if(t==='button') createdButtons.push(e); return e; },
  body: new El('body'),
};
global.localStorage = {};
global.navigator = {};
global.window = global;

// run the game script and grab handles from inside the eval scope
eval(src + '\n;global.G = { startRun, getS: () => S };');
const startGame = global.G.startRun;

const tally = {}, yearsList = [], nwList = [];
let crashes = 0;
const N = 400;
for (let run=0; run<N; run++){
  try {
    createdButtons = [];
    startGame();
    let S = global.G.getS();
    let steps = 0;
    while (!S.over && steps++ < 400){
      S = global.G.getS();
      if (S.locked){
        const withHandlers = createdButtons.filter(b=>typeof b.onclick==='function');
        if (!withHandlers.length) throw new Error('locked with no choice buttons');
        const pickIdx = withHandlers.length - 1 - Math.floor(Math.random()*Math.min(2,withHandlers.length));
        const btn = withHandlers[pickIdx];
        btn.onclick = ((f)=>{ f(); return null; })(btn.onclick) , undefined; // call once
        createdButtons = [];
        continue;
      }
      const acts = byId('acts').children.filter(b=>typeof b.onclick==='function');
      if (!acts.length) throw new Error('no actions rendered');
      let i = -1;
      if (process.env.POLICY === 'greedy'){
        const labels = [...byId('acts').innerHTML.matchAll(/class="top">([^<]*)</g)].map(m=>m[1]);
        const at = s => labels.findIndex(l=>l.includes(s));
        if (at('Quit') >= 0) i = at('Quit');
        else if (S.mode==='emp')   i = S.bo>=62 ? at('Touch Grass') : at('Grind');
        else if (S.mode==='unemp') i = S.bo>=70 ? at('Touch Grass') : (S.lc<55 ? at('LeetCode') : at('Apply'));
        else                       i = S.bo>=65 ? at('Touch Grass') : at('Ship');
      }
      if (i < 0) i = Math.floor(Math.random()*acts.length);
      acts[i].onclick();
    }
    S = global.G.getS();
    if (!S.over){ tally.timeout = (tally.timeout||0)+1; continue; }
    const verdict = byId('verdict').textContent;
    const key = verdict.replace(/^[^ ]+ /,'');
    tally[key] = (tally[key]||0)+1;
    yearsList.push(S.q/4); nwList.push(S.nw);
  } catch(e){
    crashes++;
    if (crashes <= 3) console.error('CRASH run', run, ':', e.message, e.stack.split('\n')[1]);
  }
}
console.log('runs:', N, 'crashes:', crashes);
console.log('endings:', JSON.stringify(tally, null, 1));
const avg = a => (a.reduce((x,y)=>x+y,0)/a.length).toFixed(1);
if (yearsList.length) console.log('avg years:', avg(yearsList), '| avg final nw $k:', avg(nwList));
