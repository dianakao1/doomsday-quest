/* Date math for the Doomsday method (Gregorian + Julian). */
const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const SHORT=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const FUN=["Noneday","Oneday","Twosday","Treblesday","Foursday","Fiveday","Six-a-day"];
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const mod=(a,n)=>((a%n)+n)%n;
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
function calOf(y,m,d){return (y<1582||(y===1582&&(m<10||(m===10&&d<15))))?'J':'G';}
function isLeap(y,cal){return cal==='J'?y%4===0:(y%4===0&&y%100!==0)||y%400===0;}
function dim(y,m,cal){return [31,isLeap(y,cal)?29:28,31,30,31,30,31,31,30,31,30,31][m-1];}
function jdn(y,m,d,cal){const a=Math.floor((14-m)/12),yy=y+4800-a,mm=m+12*a-3;
 const base=d+Math.floor((153*mm+2)/5)+365*yy+Math.floor(yy/4);
 return cal==='G'?base-Math.floor(yy/100)+Math.floor(yy/400)-32045:base-32083;}
function weekday(y,m,d){return mod(jdn(y,m,d,calOf(y,m,d))+1,7);}
function ddDate(m,leap){return [leap?4:3,leap?29:28,14,4,9,6,11,8,5,10,7,12][m-1];}
const JK=0;
function anchor(c,cal){return cal==='G'?mod(2+5*mod(c,4),7):mod(JK-c,7);}
function yearDD(y,cal){const yy=y%100;return mod(anchor(Math.floor(y/100),cal)+yy+Math.floor(yy/4),7);}

if (typeof module !== 'undefined') {
  module.exports = { DAYS, mod, calOf, isLeap, dim, jdn, weekday, ddDate, anchor, yearDD };
}
