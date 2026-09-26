/* ---------- state ---------- */
const KEY='doomsday-quest-v1';
let S={xp:0,stars:{},method:'odd11',bestTime:null};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s)S=Object.assign(S,s);}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
let streak=0;
const $=s=>document.querySelector(s);
const app=()=>$('#app');
const dayName=i=>DAYS[i];
const sr=t=>`<span class="sr">${t}</span>`;
const starsHTML=n=>`<span aria-hidden="true">${'★'.repeat(n)}${'☆'.repeat(3-n)}</span>${sr(`${n} of 3 stars`)}`;
/* After each screen change: set the tab title, jump to the top and move focus to the
   screen's heading so keyboard and screen-reader users start in the right place. */
function settle(title,focus=true){
  document.title=title?`${title} · Doomsday Quest`:'Doomsday Quest';
  window.scrollTo(0,0);
  const f=focus&&document.querySelector('[data-focus]');if(f)f.focus({preventScroll:true});
}

/* ---------- explanation helpers ---------- */
function methodSteps(yy,method){
  const st=[];
  if(method==='odd11'){
    let t=yy; st.push(`Start with <b>${yy}</b>.`);
    const check=()=>{if(t%2){st.push(`${t} is odd, so add 11 → <b>${t+11}</b>.`);t+=11;}else st.push(`${t} is even, so leave it.`);};
    check();
    st.push(`Halve it → <b>${t/2}</b>.`);t/=2;
    check();
    const r=t%7,h=(7-r)%7;
    st.push(`Take away 7s from ${t}: leftover <b>${r}</b>.`);
    st.push(r===0?`Leftover 0 means no hop: stay on the anchor.`:`7 − ${r} = <b>${h}</b>. Hop forward ${h} from the anchor.`);
    return {steps:st,hop:h};
  }
  const a=Math.floor(yy/12),b=yy%12,c=Math.floor(b/4),s=a+b+c,h=s%7;
  st.push(`How many 12s fit in ${yy}? <b>${a}</b>.`);
  st.push(`What's left over? <b>${b}</b>.`);
  st.push(`How many 4s fit in ${b}? <b>${c}</b>.`);
  st.push(`Add them: ${a} + ${b} + ${c} = <b>${s}</b>. Take away 7s → <b>${h}</b>. Hop forward ${h} from the anchor.`);
  return {steps:st,hop:h};
}
function anchorExplain(c,cal){
  const a=anchor(c,cal);
  if(cal==='G'){
    if(c>=16&&c<=21)return `The ${c}00s anchor is <b>${DAYS[a]}</b>, straight from your anchor list.`;
    const chain=[c];while(chain[chain.length-1]>21)chain.push(chain[chain.length-1]-4);const ref=chain[chain.length-1];
    return `Take away 4s: ${chain.join(' → ')}. So the ${c}00s act like the ${ref}00s: <b>${DAYS[a]}</b>.`;
  }
  const r=c%7;return `Julian ${c}00s: ${c} ÷ 7 leaves <b>${r}</b>. Sunday, back ${r} → <b>${DAYS[a]}</b>.`;
}
function yearExplain(y,cal,method){
  const c=Math.floor(y/100),yy=y%100,a=anchor(c,cal),m=methodSteps(yy,method);
  const out=[`Century anchor: ${anchorExplain(c,cal)}`];
  out.push(`Year part <b>${yy}</b>:<ul>${m.steps.map(s=>`<li>${s}</li>`).join('')}</ul>`);
  out.push(`${DAYS[a]} + ${m.hop} = <b>${DAYS[mod(a+m.hop,7)]}</b>. That's ${y}'s doomsday.`);
  return out;
}
function hopText(dd,d,ddDay){
  const diff=d-dd;
  if(diff===0)return `It <i>is</i> the doomsday date, so it's <b>${DAYS[ddDay]}</b>.`;
  const k=Math.abs(diff),r=k%7,dir=diff>0?'after':'before',ans=mod(ddDay+diff,7);
  const shrink=k>=7?` Take away 7s → ${r}.`:'';
  return `${d} is ${k} day${k>1?'s':''} ${dir} ${dd}.${shrink} ${DAYS[ddDay]} ${diff>0?'+':'−'} ${r} = <b>${DAYS[ans]}</b>.`;
}
function fullExplain(y,m,d){
  const cal=calOf(y,m,d),leap=isLeap(y,cal),yd=yearDD(y,cal),dd=ddDate(m,leap);
  const st=[];
  st.push(cal==='G'?`${y} uses today's calendar (Gregorian).`:`This date is before Oct 15, 1582, so use the old Julian calendar.`);
  st.push(...yearExplain(y,cal,S.method));
  let mNote=`${MONTHS[m-1]}'s doomsday date is <b>${m}/${dd}</b>`;
  if(m<=2)mNote+=leap?` (${y} is a leap year)`:` (${y} isn't a leap year)`;
  st.push(mNote+'.');
  st.push(hopText(dd,d,yd));
  return `<ol class="steps">${st.map(s=>`<li>${s}</li>`).join('')}</ol>`;
}
function randDate(y0,y1){
  for(;;){const y=rnd(y0,y1),m=rnd(1,12),d=rnd(1,dim(y,m,calOf(y,m,1)));
    if(y===1582&&m===10&&d>=5&&d<=14)continue;return {y,m,d};}
}
const fmt=({y,m,d})=>`${MONTHS[m-1]} ${d}, ${y}`;

/* ---------- dial ---------- */
function dialHTML(mode,o={}){
  /* The accessible name only says what the button shows, so it never gives the answer away. */
  const name=i=>mode==='num'?`${i}`:mode==='name'?DAYS[i]:`${DAYS[i]}, ${i}`;
  let h=o.static?`<div class="dial static" role="img" aria-label="${o.label||'Week dial: Sunday 0 to Saturday 6'}">`
    :`<div class="dial" role="group" aria-label="${mode==='num'?'Day numbers':'Days of the week'}" data-mode="${mode}">`;
  for(let i=0;i<7;i++){
    const lab=mode==='num'?`<b>${i}</b>`:mode==='name'?`<b>${SHORT[i]}</b>`:`<b>${SHORT[i]}</b><small>${i}</small>`;
    const cls=['dk'];if(o.hi===i)cls.push('hi');if(o.mark===i)cls.push('mark');
    h+=o.static?`<span class="${cls.join(' ')}" style="--a:${i*360/7}deg" aria-hidden="true">${lab}</span>`
      :`<button class="${cls.join(' ')}" data-v="${i}" style="--a:${i*360/7}deg" aria-label="${name(i)}${o.mark===i?' (start)':''}">${lab}</button>`;
  }
  return h+`<div class="dial-c" id="dialC" aria-hidden="true">${o.center??'?'}</div></div>`;
}

/* ---------- levels ---------- */
const thisYear=new Date().getFullYear(),tyDD=yearDD(thisYear,'G');
const chips=()=>`<div class="chips">${DAYS.map((d,i)=>`<div class="chip"><b>${i}</b><span>${d}</span><small>${FUN[i]}</small></div>`).join('')}</div>`;
const ddTable=()=>`<div class="ddtable">${MONTHS.map((mn,i)=>`<div><span>${mn.slice(0,3)}</span><b>${i+1}/${[ '3 or 4','28 or 29',14,4,9,6,11,8,5,10,7,12][i]}</b></div>`).join('')}</div>`;

/* Anchor vs doomsday vs doomsday dates: one weekday per century, one per year, and the dates that land on it. */
const WORDS=[
  ['Anchor','One weekday for a <b>whole century</b>.','1900s → Wednesday · 2000s → Tuesday'],
  ['Doomsday','One weekday for a <b>whole year</b>. Start at the anchor and hop.','1969 → Friday · 2026 → Saturday'],
  ['Doomsday dates','The dates in each month that <b>always land on</b> the year\'s doomsday.','4/4 · 6/6 · 7/11 · 3/14']];
const wordsHTML=()=>`<dl class="words">${WORDS.map(([w,d,e])=>`<div><dt>${w}</dt><dd>${d}<span class="words-ex">${e}</span></dd></div>`).join('')}</dl>
  <p class="note">Put together: <b>anchor</b> → the year's <b>doomsday</b> → the month's <b>doomsday date</b> → hop to your date.</p>`;

const STEPS=[
  ['Which calendar?','Gregorian from Oct 15, 1582; Julian before that.'],
  ['Century anchor','The weekday for the century — 1900s Wednesday, 2000s Tuesday.'],
  ["The year's doomsday",'Start at the anchor and hop, using Odd + 11 or Twelves on the last two digits.'],
  ["The month's doomsday date",'A date in that month that always lands on the doomsday — 4/4, 6/6, 7/11, 3/14.'],
  ['Hop to your date','Count forward or back from that date, taking away 7s to keep the hop small.']];
const STEPS_HTML=`<ol class="steps">${STEPS.map(([t,d])=>`<li><b>${t}</b><br>${d}</li>`).join('')}</ol>`;

const LEVELS=[
{title:'Days are numbers',icon:'🔢',count:6,lessons:[
 ['Give every day a number',`<p>Here's the secret of the whole game: every day of the week gets a number, starting with Sunday as 0.</p>${chips()}`],
 ['Say the silly names',`<p>Read the small names out loud: <b>Noneday, Oneday, Twosday, Treblesday, Foursday, Fiveday, Six-a-day</b>. Each one sounds like its number, so you'll remember fast.</p>`],
 ['The days go round',`<p>After Saturday (6) comes Sunday (0) again. The week is a circle, just like this dial. You'll tap it to answer.</p>${dialHTML('both',{static:true,hi:new Date().getDay(),center:'↻',label:`Week dial going round from Sunday 0 to Saturday 6. Today, ${DAYS[new Date().getDay()]}, is highlighted.`})}<p class="note">Today is ${DAYS[new Date().getDay()]}, so today is day ${new Date().getDay()}.</p>`]],
 gen(){if(Math.random()<.5){const i=rnd(0,6);return{prompt:`What number is <b>${DAYS[i]}</b>?`,kind:'dial',mode:'num',answer:i,hint:`Sunday is 0. Count up from there. Its silly name helps: ${FUN[i]}.`,explain:`${DAYS[i]} is <b>${i}</b> — ${FUN[i]}.`};}
  const i=rnd(0,6);return{prompt:`Which day is number <b>${i}</b>?`,kind:'dial',mode:'name',answer:i,hint:`Start at Sunday = 0 and count ${i} step${i===1?'':'s'} around.`,explain:`Day ${i} is <b>${DAYS[i]}</b> (${FUN[i]}).`};}},

{title:'Hop by sevens',icon:'🐸',count:6,lessons:[
 ['Seven hops = back home',`<p>Every 7 days you land on the same day again. Monday + 7 days = Monday. Monday + 14 days = Monday.</p>`],
 ['Big hops shrink',`<p>To hop a big number, throw away the 7s first.</p><div class="ex">Tuesday + 16 days<br>16 → take away 7 → 9 → take away 7 → <b>2</b><br>Tuesday + 2 = <b>Thursday</b></div>`],
 ['Hopping backward',`<p>Going back works the same way, just the other direction around the circle.</p><div class="ex">Friday − 3 = <b>Tuesday</b><br>Friday − 10 → 10 shrinks to 3 → <b>Tuesday</b></div>`]],
 gen(){const s=rnd(0,6),back=Math.random()<.3,n=back?rnd(1,12):rnd(2,24),ans=mod(s+(back?-n:n),7),r=n%7;
  return{prompt:`Start on <b>${DAYS[s]}</b>. Hop <b>${back?'back':'forward'} ${n}</b> day${n>1?'s':''}. Where do you land?`,kind:'dial',mode:'both',mark:s,answer:ans,
   hint:n>=7?`Throw away the 7s: ${n} shrinks to ${r}. Now hop ${r} ${back?'back':'forward'}.`:`Count ${n} step${n>1?'s':''} ${back?'backward':'forward'} around the dial.`,
   explain:`${n>=7?`${n} shrinks to ${r}. `:''}${DAYS[s]} ${back?'−':'+'} ${r} = <b>${DAYS[ans]}</b>.`};}},

{title:'Doomsday dates',icon:'📅',count:6,lessons:[
 ['Some dates always match',`<p>Every year, a set of dates all land on the same weekday. That weekday is called the year's <b>doomsday</b>.</p><div class="ex">In ${thisYear}, 4/4, 6/6, 8/8, 10/10 and 12/12 are all <b>${DAYS[tyDD]}s</b>.</div>`],
 ['Even months: doubles',`<p>For even months, the month and day are the same number.</p><div class="ex dates">4/4 &nbsp; 6/6 &nbsp; 8/8 &nbsp; 10/10 &nbsp; 12/12<small>Example: in ${thisYear}, April 4, June 6 and December 12 are all ${DAYS[tyDD]}s.</small></div>`],
 ['Odd months: 9-to-5 at the 7-Eleven',`<p>Say it: <b>"I work 9 to 5 at the 7-Eleven."</b></p><div class="ex dates">5/9 &nbsp; 9/5 &nbsp; 7/11 &nbsp; 11/7<small>Example: in ${thisYear}, May 9 (5/9) and September 5 (9/5) are both ${DAYS[tyDD]}s.</small></div><p>It works both ways round.</p>`],
 ['The tricky three',`<p><b>March:</b> 3/14, Pi Day.<br><b>February:</b> the last day — 28, or 29 in a leap year.<br><b>January:</b> the 3rd — or the 4th in a leap year. Three years out of four it's the 3rd; the fourth year it's the 4th.</p>`],
 ['All twelve',`${ddTable()}<p class="note">Leap years: January 4 and February 29.</p>`]],
 gen(){const m=rnd(1,12),leap=m<=2?Math.random()<.5:false,ans=ddDate(m,leap);
  const pool=[...new Set([3,4,5,6,7,8,9,10,11,12,14,28,29,1,2,13,15,20])].filter(x=>x!==ans);
  const opts=[ans];while(opts.length<4){const x=pick(pool);if(!opts.includes(x))opts.push(x);}opts.sort((a,b)=>a-b);
  const tip={1:'3rd normally, 4th in a leap year.',2:'The last day of February.',3:'Pi Day: 3.14.',5:'9 to 5 at the 7-Eleven: 5/9.',7:'7-Eleven: 7/11.',9:'9 to 5: 9/5.',11:'7-Eleven backward: 11/7.'}[m]||`Even month: double it, ${m}/${m}.`;
  return{prompt:`Which ${MONTHS[m-1]} date is a doomsday${m<=2?` in a <b>${leap?'leap':'normal'}</b> year`:''}?`,kind:'choice',options:opts.map(v=>({v,label:`${m}/${v}`})),answer:ans,hint:tip,explain:`${MONTHS[m-1]}: <b>${m}/${ans}</b>. ${tip}`};}},

{title:'Any date in a year',icon:'🎯',count:6,lessons:[
 ['Find it, then hop',`<p>If you know the year's doomsday, any date is two moves away: find that month's doomsday date, then hop.</p><div class="ex">Doomsday is <b>Saturday</b>. What day is July 20?<br>July's doomsday date: 7/11 → Saturday<br>20 is 9 days after 11 → shrinks to 2<br>Saturday + 2 = <b>Monday</b></div>`],
 ['Hop backward too',`<div class="ex">Doomsday is <b>Saturday</b>. What day is July 4?<br>4 is 7 days before 11 → shrinks to 0<br>So July 4 is a <b>Saturday</b> too.</div><p>Pick whichever doomsday date is closest. For December 25, use 12/12 — or use 12/26 (12/12 + 14).</p>`]],
 gen(){const D=rnd(0,6),m=rnd(1,12),leap=m<=2&&Math.random()<.5,d=rnd(1,[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][m-1]),dd=ddDate(m,leap),ans=mod(D+d-dd,7);
  return{prompt:`This year's doomsday is <b>${DAYS[D]}</b>${m<=2?` (a ${leap?'leap':'normal'} year)`:''}. What day is <b>${MONTHS[m-1]} ${d}</b>?`,kind:'dial',mode:'both',mark:D,answer:ans,
   hint:`${MONTHS[m-1]}'s doomsday date is ${m}/${dd}, and that's a ${DAYS[D]}. Now hop to ${d}.`,explain:hopText(dd,d,D)};}},

{title:'Century anchors',icon:'⚓',count:5,lessons:[
 ['Every century has an anchor',`<p>Each century has a starting day called its <b>anchor</b>. Here they are from 1600 on:</p><div class="ddtable six"><div><span>1600s</span><b>Tuesday <small>(2)</small></b></div><div><span>1700s</span><b>Sunday <small>(0)</small></b></div><div><span>1800s</span><b>Friday <small>(5)</small></b></div><div><span>1900s</span><b>Wednesday <small>(3)</small></b></div><div><span>2000s</span><b>Tuesday <small>(2)</small></b></div><div><span>2100s</span><b>Sunday <small>(0)</small></b></div></div><p>Notice the pattern: only four days — <b>Tuesday (2), Sunday (0), Friday (5), Wednesday (3)</b> — and then they repeat.</p>`],
 ['Memory tricks',`<p><b>2000s → Tuesday:</b> Twos-day for the 2000s.<br><b>1900s → Wednesday:</b> "We-in-dis-day."</p><p>The four anchors in order are Tue, Sun, Fri, Wed, which as numbers are <b>2, 0, 5, 3</b>. Say it like a year: <b>"twenty fifty-three."</b></p>`],
 ['The anchor loop',`<p>The anchors go round a loop. Follow the arrows to go forward in time.</p>
<div class="loop" role="img" aria-label="Anchor loop: Tuesday (1600s, 2000s), minus 2 to Sunday (1700s, 2100s), minus 2 to Friday (1800s, 2200s), minus 2 to Wednesday (1900s, 2300s), minus 1 back to Tuesday.">
<div class="lp"><b>Tue</b><small>1600s · 2000s</small></div><div class="ar">→<small>−2</small></div><div class="lp"><b>Sun</b><small>1700s · 2100s</small></div>
<div class="ar short">↑<small>−1</small></div><div></div><div class="ar">↓<small>−2</small></div>
<div class="lp"><b>Wed</b><small>1900s · 2300s</small></div><div class="ar">←<small>−2</small></div><div class="lp"><b>Fri</b><small>1800s · 2200s</small></div></div>
<p>Each step is 2 days back, except the one short step of 1.</p>`],
 ['Going back in time',`<p>Go round the loop the other way, and count <b>forward</b>.</p><div class="ex">2000s Tue <b>+1</b> → 1900s Wed<br>1900s Wed <b>+2</b> → 1800s Fri<br>1800s Fri <b>+2</b> → 1700s Sun</div><p class="note">Why the short step? 2000 was a leap year, but 1700, 1800 and 1900 weren't.</p>`],
 ['They repeat every 400 years',`<p>Every 4 centuries the anchors come back around:</p><div class="ex">1600s = 2000s = 2400s = <b>Tuesday (2)</b><br>1700s = 2100s = 2500s = <b>Sunday (0)</b><br>1800s = 2200s = 2600s = <b>Friday (5)</b><br>1900s = 2300s = 2700s = <b>Wednesday (3)</b></div><p>So those four days cover every century from 1600 on.</p>`],
 ['Far into the future',`<p>For any century, keep <b>taking away 4</b> until you reach one you know (1600s–2100s).</p><div class="ex"><ol class="steps">
<li><b>Anchor for the 3400s:</b> 34 → 30 → 26 → 22 → 18, so the 3400s act like the 1800s → <b>Friday (5)</b></li>
<li><b>Year 3407</b> (Odd + 11 on 07):<ul><li>7 is odd → add 11 → 18</li><li>Halve it → 9</li><li>9 is odd → add 11 → 20</li><li>Take away 7s → 6, and 7 − 6 = 1</li><li>Friday + 1 = <b>Saturday</b></li></ul></li>
<li><b>July 4, 3407:</b> 7/4 isn't a doomsday date, but 7/11 is — 4 is 7 days before 11 → shrinks to 0 → <b>Saturday</b></li></ol></div><p class="note">This works as long as the calendar keeps today's leap-year rules.</p>`]],
 gen(){const c=rnd(16,40);return{prompt:`What's the anchor for the <b>${c}00s</b>?`,kind:'dial',mode:'both',answer:anchor(c,'G'),hint:`Four-century cycle: 2000s Tue, 2100s Sun, 2200s Fri, 2300s Wed, then it repeats.`,explain:anchorExplain(c,'G')};}},

{title:"The year's doomsday",icon:'🧮',count:6,lessons:[
 ['Three words to keep straight',`<p>You've met all three now. They sound alike, but each one covers a different stretch of time:</p>${wordsHTML()}<p class="note">You can find these again any time under <b>Key words</b> on the map.</p>`],
 ['Split the year',`<p>Break a year into two parts: <b>19</b>|<b>87</b>. The first part gives the century anchor (1900s → Wednesday). The last two digits tell you how far to hop from it.</p>`],
 ['Way 1: Odd + 11',`<p>It's always the same four moves: <b>check odd, halve, check odd, sevens</b>.</p>
<ol class="steps"><li><b>Check odd:</b> if it's odd, add 11.</li><li><b>Halve</b> it — always, just once.</li><li><b>Check odd</b> again: if it's odd, add 11.</li><li><b>Sevens:</b> take away 7s. Hop forward 7 minus the leftover.</li></ol>
<p>So you add 11 twice, once, or not at all — never more.</p>
<div class="ex"><b>1987</b> (1900s anchor: Wednesday)<br>87 is odd → add 11 → 98<br>Halve it → 49<br>49 is odd → add 11 → 60<br>Take away 7s → 4<br>7 − 4 = <b>3</b> → Wednesday + 3 = <b>Saturday</b></div>
<div class="ex"><b>2026</b> (2000s anchor: Tuesday)<br>26 is even → leave it<br>Halve it → 13<br>13 is odd → add 11 → 24<br>Take away 7s → 3<br>7 − 3 = <b>4</b> → Tuesday + 4 = <b>Saturday</b></div>`],
 ['Way 2: Twelves',`<div class="ex">How many 12s in 87? <b>7</b> (7 × 12 = 84)<br>Left over: <b>3</b><br>How many 4s in 3? <b>0</b><br>7 + 3 + 0 = 10 → take away 7 → <b>3</b><br>Wednesday + 3 = <b>Saturday</b></div><p>Both ways give the same answer. 1987's doomsday is Saturday.</p>`],
 ['Pick your way','@method']],
 gen(){const y=rnd(1900,2099);return{prompt:`What's the doomsday for <b>${y}</b>?`,kind:'dial',mode:'both',answer:yearDD(y,'G'),hint:`The ${Math.floor(y/100)}00s anchor is ${DAYS[anchor(Math.floor(y/100),'G')]}. Now work out ${y%100} with ${S.method==='odd11'?'Odd + 11':'Twelves'}.`,explain:`<ol class="steps">${yearExplain(y,'G',S.method).map(s=>`<li>${s}</li>`).join('')}</ol>`};}},

{title:'Time machine',icon:'⏳',count:5,lessons:[
 ['The old calendar',`<p>Before <b>October 15, 1582</b>, Europe used the Julian calendar. Its leap years come every 4 years with no exceptions — even 1500 and 1300 were leap years.</p><div class="ex">Thursday, October 4, 1582<br>was followed by<br>Friday, October 15, 1582.<br>Ten days vanished!</div>`],
 ['Julian anchors',`<p>Take the century number, divide by 7, and keep the leftover. Go that many days <b>back</b> from Sunday.</p><div class="ex">1400s: 14 ÷ 7 leaves 0 → <b>Sunday</b><br>1000s: 10 ÷ 7 leaves 3 → Sunday back 3 → <b>Thursday</b></div>`],
 ['Everything else stays',`<p>Same year trick, same doomsday dates, same hopping. Just remember that every 4th year is a leap year for January and February.</p><p class="note">Britain and its colonies switched later, in 1752. This game uses the 1582 switch.</p>`]],
 gen(){if(Math.random()<.45){const c=rnd(1,15);return{prompt:`What's the Julian anchor for the <b>${c}00s</b>?`,kind:'dial',mode:'both',answer:anchor(c,'J'),hint:`${c} ÷ 7 leaves ${c%7}. Go back that many from Sunday.`,explain:anchorExplain(c,'J')};}
  const t=randDate(200,1581);return{prompt:`What day was <b>${fmt(t)}</b>?`,kind:'dial',mode:'both',answer:weekday(t.y,t.m,t.d),hint:`Julian calendar. Start with the anchor: ${Math.floor(t.y/100)} ÷ 7 leaves ${Math.floor(t.y/100)%7}.`,explain:fullExplain(t.y,t.m,t.d)};}},

{title:'Grand master',icon:'👑',count:8,lessons:[
 ['Put it all together',`<p>Every date uses the same five steps. Each one gives you the starting point for the next:</p>${STEPS_HTML}<p>Any year in history. "Show me the steps" is always there if you get stuck.</p>`],
 ['Worked example: the Moon landing',`<p>What day was <b>July 20, 1969</b>?</p><div class="ex"><ol class="steps">
<li><b>Calendar:</b> after 1582 → Gregorian</li>
<li><b>Anchor:</b> 1900s → <b>Wednesday</b></li>
<li><b>Year's doomsday</b> (Odd + 11 on 69):<ul><li>69 is odd → add 11 → 80</li><li>Halve it → 40</li><li>40 is even → leave it</li><li>Take away 7s → 5, and 7 − 5 = 2</li><li>Wednesday + 2 = <b>Friday</b></li></ul></li>
<li><b>Doomsday date:</b> July → <b>7/11</b>, so July 11, 1969 was a Friday</li>
<li><b>Hop:</b> 20 is 9 days after 11 → 9 shrinks to 2 → Friday + 2 = <b>Sunday</b></li></ol></div>`],
 ['A shortcut for this year',`<p>People who practice this memorize the current year's doomsday. For ${thisYear} it's <b>${DAYS[tyDD]}</b>.</p><p>For any date this year, skip straight to steps 4 and 5: find the month's doomsday date, then hop.</p><div class="ex">${thisYear}'s doomsday is ${DAYS[tyDD]}. What day is December 25?<br>12/12 is a ${DAYS[tyDD]}. 25 is 13 days after 12 → 13 shrinks to 6<br>${DAYS[tyDD]} + 6 = <b>${DAYS[mod(tyDD+6,7)]}</b></div><p class="note">The full five steps are only needed for other years.</p>`]],
 gen(i){const r=i<3?[1900,2099]:i<6?[1583,2999]:[1,1581],t=randDate(...r);
  return{prompt:`What day ${t.y<thisYear?'was':'is'} <b>${fmt(t)}</b>?`,kind:'dial',mode:'both',answer:weekday(t.y,t.m,t.d),hint:`Start with the ${Math.floor(t.y/100)}00s anchor${calOf(t.y,t.m,t.d)==='J'?' (Julian calendar)':''}.`,explain:fullExplain(t.y,t.m,t.d)};}}
];

/* ---------- screens ---------- */
const totalStars=()=>Object.values(S.stars).reduce((a,b)=>a+b,0);
function topbar(back){
  return `<header class="top">${back?`<button class="ghost" onclick="home()"><span aria-hidden="true">←&nbsp;</span>Map</button>`:`<div class="brand">Doomsday Quest</div>`}
  <div class="stats">${statsHTML()}</div></header>`;
}
function statsHTML(){
  return [['⭐','Stars',totalStars()],['✨','XP',S.xp],['🔥','Streak',streak]]
    .map(([e,l,v])=>`<span title="${l}"><span aria-hidden="true">${e}</span>${sr(l+':')} ${v}</span>`).join('');
}
function refreshStats(){document.querySelector('.stats').innerHTML=statsHTML();}
function home(first){
  const t=new Date().getDay();
  let h=topbar(false)+`<div class="home"><div class="home-side"><section class="hero">${dialHTML('both',{static:true,hi:t,center:`<span>today</span><b>${t}</b>`,label:`Week dial. Today is ${DAYS[t]}, day ${t}.`})}
  <h1 tabindex="-1" data-focus>Name the weekday of any date, in your head.</h1><p>Eight levels, from counting days to dates a thousand years ago.</p></section>`+homePanel()+`</div>
  <nav class="home-map" aria-label="Levels"><svg class="trail" aria-hidden="true"></svg>
  <div class="map-start" aria-hidden="true"><span>🚩</span>Start</div><ol class="path">`;
  const next=LEVELS.findIndex((_,i)=>!S.stars[i]);
  LEVELS.forEach((L,i)=>{
    const open=true,st=S.stars[i]||0;
    h+=`<li class="node ${open?'':'locked'} ${st?'done':''} ${i===next?'next':''}" style="--off:${[0,1,2,1][i%4]}"><button ${open?`onclick="startLevel(${i})"`:'disabled'}>
      <span class="bub" aria-hidden="true">${open?L.icon:'🔒'}</span><span class="nt"><small>Level ${i+1}</small><b>${L.title}</b><span class="st">${starsHTML(st)}</span>${i===next?`<span class="here"><span aria-hidden="true">📍</span> You are here</span>`:''}</span></button></li>`;
  });
  h+=`</ol><div class="map-end" aria-hidden="true">🏰</div></nav></div>`;
  app().innerHTML=h;settle('',!first);
  watchTrail();
}
/* Draw a smooth trail through the Start sign, every level bubble and the castle.
   Walked stretches are drawn solid gold; the rest stay dotted. */
function drawTrail(){
  const map=$('.home-map');if(!map)return;
  const svg=map.querySelector('.trail'),base=map.getBoundingClientRect();
  const c=el=>{const r=el.getBoundingClientRect();return [r.left+r.width/2-base.left,r.top+r.height/2-base.top];};
  const nodes=[...map.querySelectorAll('.node')];
  /* The trail leaves from just under the Start label and stops at the castle's edge, so it never runs through them. */
  const st=map.querySelector('.map-start').getBoundingClientRect();
  const en=map.querySelector('.map-end').getBoundingClientRect();
  const pts=[[st.left+st.width/2-base.left,st.bottom-base.top+2],...nodes.map(n=>c(n.querySelector('.bub'))),[en.left+en.width/2-base.left,en.top-base.top+4]];
  /* A stretch counts as walked once the level it leads to is finished (the castle: once Level 8 is). */
  const lv=nodes.map(n=>n.classList.contains('done')),walked=[...lv,lv[lv.length-1]];
  svg.setAttribute('viewBox',`0 0 ${base.width} ${base.height}`);
  svg.innerHTML=pts.slice(1).map(([x1,y1],i)=>{const [x0,y0]=pts[i],m=(y1-y0)/2;
    return `<path class="${walked[i]?'walked':''}" d="M${x0} ${y0}C${x0} ${y0+m} ${x1} ${y1-m} ${x1} ${y1}"/>`;}).join('');
}
let trailObs;
function watchTrail(){
  trailObs?.disconnect();drawTrail();
  if('ResizeObserver' in window){trailObs=new ResizeObserver(drawTrail);trailObs.observe($('.home-map'));}
  document.fonts?.ready.then(drawTrail);
}
function homePanel(){
  return `<section class="panel" aria-label="Practice and settings"><button class="big alt" onclick="practice()">Practice arena</button>
  <div class="set"><span id="ytl">Year trick</span><span class="tip"><button class="tip-btn" aria-label="How the year tricks differ" aria-describedby="ytip" aria-haspopup="dialog" onclick="openTricks(this)">i</button>
  <span class="tip-box" role="tooltip" id="ytip">${yearTricks(false)}</span></span>
  <div class="seg" role="group" aria-labelledby="ytl">${segBtns()}</div></div>
  <div class="links"><button class="link" aria-haspopup="dialog" onclick="openSheet('wsheet',this)">Key words</button>
  <button class="link" id="rst" onclick="resetP(this)">Reset progress</button></div><p class="sr" id="rstMsg" aria-live="polite"></p></section>
  ${sheetHTML('ysheet','How the year tricks differ',yearTricks(true))}
  ${sheetHTML('wsheet','Key words',`<p>Three words that sound alike but work at different sizes:</p>${wordsHTML()}<hr class="tip-sep"><h3 class="tip-h">The five steps, in order</h3>${STEPS_HTML}`)}`;
}
/* A modal panel that slides up from the bottom. Any tap or click on it (or its backdrop) closes it. */
function sheetHTML(id,title,body){
  return `<dialog class="sheet" id="${id}" aria-labelledby="${id}-t"><div class="sheet-grip" aria-hidden="true"></div>
  <p class="sheet-hint" aria-hidden="true"><span class="touch-only">Tap</span><span class="mouse-only">Click</span> anywhere to close</p>
  <button class="sheet-x" aria-label="Close" onclick="this.closest('dialog').close()">✕</button>
  <h2 id="${id}-t">${title}</h2>${body}
  <button class="big sheet-ok" onclick="this.closest('dialog').close()">Got it</button></dialog>`;
}
function openSheet(id,btn){const d=$('#'+id);d.onclose=()=>btn.focus();d.showModal();}

/* Explanation of the two year tricks. The sheet gets real headings and lists;
   the tooltip gets plain spans because a tooltip is read out as flat text. */
function yearTricks(sheet){
  const H=t=>sheet?`<h3 class="tip-h">${t}</h3>`:`<b class="tip-h">${t}</b>`;
  const OL=items=>sheet?`<ol class="tip-ol">${items.map(x=>`<li>${x}</li>`).join('')}</ol>`
    :`<span class="tip-ol">${items.map((x,i)=>`<span>${i+1}. ${x}</span>`).join(' ')}</span>`;
  const EX=t=>`<${sheet?'p':'span'} class="tip-ex">${t}</${sheet?'p':'span'}>`;
  return `${sheet?'<p>':''}Both tricks turn a year's last two digits into a hop from the century anchor.${sheet?'</p>':''}
  ${H('Odd + 11 — check odd, halve, check odd, sevens')}${OL(['Check odd: if it\'s odd, add 11.','Halve it (always, once).','Check odd again: if it\'s odd, add 11.','Take away 7s. Hop 7 minus the leftover.'])}
  ${EX('26 → even, leave it → halve: 13 → odd, add 11: 24 → leftover 3 → hop <b>4</b>')}
  ${sheet?'<hr class="tip-sep">':'<span class="tip-sep" aria-hidden="true"></span>'}${H('Twelves — fewer steps, bigger numbers')}${OL(['How many 12s? What\'s left?','How many 4s in what\'s left?','Add all three. Take away 7s. Hop that many.'])}
  ${EX('26 → two 12s, 2 left, no 4s → 2 + 2 + 0 = hop <b>4</b>')}
  <${sheet?'p':'span'} class="tip-end">Same answer either way — pick the one you like.</${sheet?'p':'span'}>`;
}
/* Mouse users get the hover tooltip; touch screens get a bottom sheet dialog instead. */
function openTricks(btn){
  if(matchMedia('(hover:hover) and (pointer:fine)').matches){btn.parentNode.classList.toggle('open');return;}
  openSheet('ysheet',btn);
}
function segBtns(){return [['odd11','Odd + 11'],['twelves','Twelves']].map(([k,l])=>`<button class="${S.method===k?'on':''}" aria-pressed="${S.method===k}" data-k="${k}" onclick="setMethod('${k}',this)">${l}</button>`).join('');}
function setMethod(k,el){S.method=k;save();const seg=el.closest('.seg');seg.innerHTML=segBtns();seg.querySelector(`[data-k="${k}"]`).focus();}
function resetP(b){if(b.dataset.c){S={xp:0,stars:{},method:S.method,bestTime:null};streak=0;save();home();}else{b.dataset.c=1;b.textContent='Tap again to erase everything';$('#rstMsg').textContent='Press again to erase all progress.';}}

/* ---------- level flow ---------- */
let L,Li,phase,idx,mistakes,Q;
let recent=[];
function fresh(gen){let q;for(let t=0;t<30;t++){q=gen();if(!recent.includes(q.answer))break;}recent=[q.answer,...recent].slice(0,3);return q;}
function startLevel(i){Li=i;L=LEVELS[i];phase='learn';idx=0;mistakes=0;recent=[];renderLevel();}
function renderLevel(){
  if(phase==='learn'){
    const [t,body]=L.lessons[idx],last=idx===L.lessons.length-1;
    const content=body==='@method'?`<p>Choose the one that feels easier. You can switch any time on the map.</p><div class="seg wide">${segBtns()}</div>`:body;
    app().innerHTML=topbar(true)+`<h1 class="sr">Level ${Li+1}: ${L.title}</h1><section class="card lesson" aria-labelledby="lt"><div class="dots" aria-hidden="true">${L.lessons.map((_,j)=>`<i class="${j===idx?'on':''}"></i>`).join('')}</div>
    <h2 id="lt" tabindex="-1" data-focus>${sr(`Lesson ${idx+1} of ${L.lessons.length}:`)} ${t}</h2>${content}</section><nav class="navrow">${idx?`<button class="ghost" onclick="idx--;renderLevel()">Back</button>`:'<span></span>'}
    <button class="big" data-primary onclick="${last?"phase='quiz';idx=0;nextQ()":'idx++;renderLevel()'}">${last?"Let's play":'Next'}</button></nav>`;
    settle(`${L.title}: ${t}`);return;
  }
}
function nextQ(){
  if(idx>=L.count)return finish();
  Q=fresh(()=>L.gen(idx));Q.missed=false;Q.done=false;
  const bar=`<div class="bar" role="progressbar" aria-label="Level progress" aria-valuemin="0" aria-valuemax="${L.count}" aria-valuenow="${idx}"><i style="width:${idx/L.count*100}%"></i></div>`;
  app().innerHTML=topbar(true)+bar+`<h1 class="sr">Level ${Li+1}: ${L.title}</h1><section class="quiz" aria-labelledby="qp"><small class="qn">Question ${idx+1} of ${L.count}</small><h2 class="prompt" id="qp" tabindex="-1" data-focus>${sr(`Question ${idx+1} of ${L.count}.`)} ${Q.prompt}</h2>
   ${answerPad(Q)}${kbdHint(Q)}<div id="fb" class="fb" aria-live="polite"></div>
   <div class="navrow"><button class="ghost" id="steps" onclick="showSteps()">Show me the steps</button><button class="big" id="nx" data-primary hidden onclick="idx++;nextQ()">Next</button></div></section>`;
  bindPad(answerQ);settle(`${L.title}: question ${idx+1}`);
}
function answerPad(Q){
  if(Q.kind==='dial')return dialHTML(Q.mode,{mark:Q.mark});
  return `<div class="choices">${Q.options.map(o=>`<button class="dk ch" data-v="${o.v}">${o.label}</button>`).join('')}</div>`;
}
const kbdHint=Q=>Q.kind==='dial'&&Q.mode!=='name'?`<p class="kbd note" aria-hidden="true">Tip: press <kbd>0</kbd>–<kbd>6</kbd> to answer, or use the arrow keys.</p>`:'';
/* Wrong answers stay focusable (aria-disabled, not disabled) so keyboard focus isn't lost. */
function bindPad(fn){document.querySelectorAll('button.dk').forEach(b=>b.onclick=()=>{if(b.getAttribute('aria-disabled')!=='true')fn(+b.dataset.v,b);});}
const flag=(b,t)=>b.setAttribute('aria-label',`${b.getAttribute('aria-label')||b.textContent} (${t})`);
function markWrong(b){b.classList.add('no');b.setAttribute('aria-disabled','true');flag(b,'wrong');}
/* Enter runs the screen's main action (Next, Next level, New date) unless focus is already on a control. */
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return;
  if(e.target.closest('button,a,input,select,textarea,[contenteditable]'))return;
  const p=[...document.querySelectorAll('[data-primary]')].find(b=>!b.hidden);
  if(p){e.preventDefault();p.click();}
});
/* A tap anywhere closes the sheet: on the panel itself or on the dimmed backdrop (which also covers the ⓘ). */
document.addEventListener('click',e=>{const d=e.target.closest&&e.target.closest('dialog.sheet');if(d&&d.open)d.close();});
/* Open a tooltip upward when there isn't room for it below (e.g. the sticky desktop sidebar). */
function placeTip(t){
  const set=t.closest('.set').getBoundingClientRect(),h=t.querySelector('.tip-box').offsetHeight+16;
  const below=innerHeight-set.bottom,above=set.top;
  t.classList.toggle('up',below<h&&above>below);
}
['mouseover','focusin','click'].forEach(ev=>document.addEventListener(ev,e=>{const t=e.target.closest&&e.target.closest('.tip');if(t)placeTip(t);},true));
/* Tooltips: Escape hides one until the pointer or focus leaves; a tap elsewhere closes a tapped-open one. */
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.tip').forEach(t=>{t.classList.remove('open');t.dataset.hush=1;});});
document.addEventListener('click',e=>document.querySelectorAll('.tip.open').forEach(t=>{if(!t.contains(e.target))t.classList.remove('open');}));
['mouseout','focusout'].forEach(ev=>document.addEventListener(ev,e=>{const t=e.target.closest&&e.target.closest('.tip');if(t&&!t.contains(e.relatedTarget))delete t.dataset.hush;}));
document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const dial=document.querySelector('.dial[role="group"]');if(!dial)return;
  const btns=[...dial.querySelectorAll('button.dk')],i=btns.indexOf(document.activeElement);
  if(i>=0&&['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(e.key)){
    e.preventDefault();btns[mod(i+(e.key==='ArrowRight'||e.key==='ArrowDown'?1:-1),7)].focus();return;
  }
  /* Digit shortcuts, except when the question itself asks "which day is number N?" */
  if(/^[0-6]$/.test(e.key)&&dial.dataset.mode!=='name'&&!/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)){
    const b=btns[+e.key];b.focus();b.click();
  }
});
function answerQ(v,b){
  if(Q.done)return;const fb=$('#fb'),c=$('#dialC');
  if(v===Q.answer){
    Q.done=true;b.classList.add('ok');flag(b,'correct');if(c)c.innerHTML='✓';
    if(!Q.missed){S.xp+=10;streak++;}else S.xp+=5;save();
    fb.className='fb good';fb.innerHTML=`<b>${pick(['Nailed it!','Yes!','Spot on!','You got it!'])}</b> ${Q.explain}`;
    $('#nx').hidden=false;$('#steps').hidden=true;$('#nx').focus();
    refreshStats();
  }else{
    if(!Q.missed)mistakes++;Q.missed=true;streak=0;markWrong(b);refreshStats();
    if(c)c.innerHTML='✗';fb.className='fb bad';fb.innerHTML=`<b>Not quite.</b> Hint: ${Q.hint}`;
  }
}
function showSteps(){const fb=$('#fb');if(!Q.missed){Q.missed=true;mistakes++;streak=0;refreshStats();}fb.className='fb info';fb.innerHTML=`<b>Here's how:</b> ${Q.explain}`;}
function finish(){
  const st=mistakes===0?3:mistakes<=2?2:1;S.stars[Li]=Math.max(S.stars[Li]||0,st);S.xp+=20;save();
  const more=Li<LEVELS.length-1;
  app().innerHTML=topbar(true)+`<h1 class="sr">Level ${Li+1}: ${L.title}</h1><section class="card result"><div class="bigstars" aria-hidden="true">${'★'.repeat(st)}<span>${'★'.repeat(3-st)}</span></div>
  <h2 tabindex="-1" data-focus>${L.title}: complete${sr(`. You earned ${st} of 3 stars.`)}</h2><p>${mistakes===0?'Perfect run — no slips at all.':`${mistakes} question${mistakes>1?'s':''} needed a hint. Replay for three stars.`}</p><p class="note">+20 bonus XP</p>
  <nav class="navrow"><button class="ghost" onclick="startLevel(${Li})">Replay</button>${more?`<button class="big" data-primary onclick="startLevel(${Li+1})">Next level</button>`:`<button class="big" data-primary onclick="practice()">Practice arena</button>`}</nav>
  <p class="kbd note" aria-hidden="true">Press <kbd>Enter</kbd> for ${more?'the next level':'the practice arena'}.</p></section>`;
  settle(`${L.title}: complete`);
}

/* ---------- practice ---------- */
const RANGES=[['1900–2099',1900,2099],['1600–2999',1583,2999],['Any year',1,9999]];
let PR=0,PT,PQ;
function practice(){PR=Math.min(PR,2);newPractice();}
function newPractice(){
  const [,a,b]=RANGES[PR];PQ=fresh(()=>{const t=randDate(a,b);t.answer=weekday(t.y,t.m,t.d);return t;});PQ.ans=PQ.answer;PQ.done=false;PQ.missed=false;PT=Date.now();
  app().innerHTML=topbar(true)+`<h1 class="sr">Practice arena</h1><section class="quiz practice" aria-labelledby="qp"><div class="seg wide" role="group" aria-label="Year range">${RANGES.map((r,i)=>`<button class="${i===PR?'on':''}" aria-pressed="${i===PR}" onclick="PR=${i};newPractice()">${r[0]}</button>`).join('')}</div>
  <h2 class="prompt" id="qp" tabindex="-1" data-focus>What day ${PQ.y<thisYear?'was':'is'} <b>${fmt(PQ)}</b>?</h2>${dialHTML('both')}${kbdHint({kind:'dial'})}<div id="fb" class="fb" aria-live="polite">${S.bestTime?`<span class="note">Best time: ${S.bestTime}s</span>`:''}</div>
  <div class="navrow"><button class="ghost" id="steps" onclick="pSteps()">Show me the steps</button><button class="big" id="nd" data-primary onclick="newPractice()">New date</button></div></section>`;
  bindPad(pAnswer);settle('Practice arena');
}
function pAnswer(v,b){
  if(PQ.done)return;const fb=$('#fb');
  if(v===PQ.ans){PQ.done=true;b.classList.add('ok');$('#dialC').innerHTML='✓';const s=Math.round((Date.now()-PT)/100)/10;
    let rec='';if(!PQ.missed){S.xp+=10;streak++;if(!S.bestTime||s<S.bestTime){S.bestTime=s;rec=' New best time!';}}save();
    fb.className='fb good';fb.innerHTML=`<b>${DAYS[v]} — correct in ${s}s.</b>${rec}`;
    flag(b,'correct');refreshStats();$('#nd').focus();}
  else{PQ.missed=true;streak=0;markWrong(b);refreshStats();$('#dialC').innerHTML='✗';fb.className='fb bad';fb.innerHTML=`<b>Not ${DAYS[v]}.</b> Try again, or choose "Show me the steps".`;}
}
function pSteps(){PQ.missed=true;streak=0;refreshStats();const fb=$('#fb');fb.className='fb info';fb.innerHTML=`<b>Here's how:</b> ${fullExplain(PQ.y,PQ.m,PQ.d)}`;}

home(true);
