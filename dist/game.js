(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('board'), ctx = canvas.getContext('2d');
  const size = 24, cell = canvas.width / size;
  const vectors = {up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
  let snake, food, direction, queue, score, state = 'ready', timer = null, best = 0;
  try { best = Math.max(0, Number(localStorage.getItem('garden-worm-best')) || 0); } catch {}
  $('best').textContent = best;
  function newFood() {
    const empty = [];
    for (let y=0;y<size;y++) for(let x=0;x<size;x++) if(!snake.some(p=>p.x===x&&p.y===y)) empty.push({x,y});
    return empty.length ? empty[Math.floor(Math.random()*empty.length)] : null;
  }
  function reset() {
    snake = [{x:8,y:12},{x:7,y:12},{x:6,y:12},{x:5,y:12}];
    direction = vectors.right; queue = []; score = 0; food = newFood(); $('score').textContent = score;
  }
  function roundRect(x,y,w,h,r,color) {ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  function draw() {
    ctx.fillStyle='#102b23';ctx.fillRect(0,0,720,720);
    ctx.fillStyle='#214135';
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){ctx.beginPath();ctx.arc(x*cell+15,y*cell+15,1.2,0,Math.PI*2);ctx.fill();}
    if(food){const x=food.x*cell+15,y=food.y*cell+15;ctx.fillStyle='#f1a36c';ctx.beginPath();ctx.arc(x,y+2,10,0,Math.PI*2);ctx.fill();roundRect(x,y-13,4,8,2,'#b7d97f');}
    snake.slice().reverse().forEach((p,i)=>{const head=i===snake.length-1;roundRect(p.x*cell+2,p.y*cell+2,26,26,head?11:8,head?'#d4ef9b':i%2?'#a8cb78':'#96bc69');});
    const head=snake[0], ox=direction.x, oy=direction.y;
    for(const side of [-1,1]) {const x=head.x*cell+15+ox*6+oy*side*6,y=head.y*cell+15+oy*6+ox*side*6;ctx.fillStyle='#203d2a';ctx.beginPath();ctx.arc(x,y,2.6,0,Math.PI*2);ctx.fill();}
  }
  function schedule() {clearInterval(timer);timer=null;if(state==='running') timer=setInterval(tick,Number($('difficulty').value));}
  function overlay(title,description,label,icon) {$('message').textContent=title;$('description').textContent=description;$('start').textContent=label;$('icon').textContent=icon;$('overlay').hidden=false;}
  function start() {reset();state='running';$('overlay').hidden=true;$('pause').disabled=false;$('pause').textContent='Ⅱ 일시정지';$('status').textContent='GROWING HAPPILY';draw();schedule();}
  function end(won=false) {state='over';schedule();$('pause').disabled=true;$('status').textContent=won?'GARDEN COMPLETE':'UNTIL NEXT TIME';overlay(won?'정원을 가득 채웠어요!':'잠깐 쉬어 갈까요?',`이번 산책에서 ${score}점을 모았어요. 최고 기록은 ${best}점이에요.`,'다시 자라기 →',won?'🌳':'🍂');}
  function tick() {
    if(state!=='running')return;
    if(queue.length)direction=queue.shift();
    const head={x:snake[0].x+direction.x,y:snake[0].y+direction.y};
    const eating=food&&head.x===food.x&&head.y===food.y;
    const body=eating?snake:snake.slice(0,-1);
    if(head.x<0||head.y<0||head.x>=size||head.y>=size||body.some(p=>p.x===head.x&&p.y===head.y)){end();return;}
    snake.unshift(head);
    if(eating){score+=10;$('score').textContent=score;if(score>best){best=score;$('best').textContent=best;try{localStorage.setItem('garden-worm-best',String(best));}catch{}}food=newFood();if(!food){draw();end(true);return;}}
    else snake.pop();
    draw();
  }
  function steer(name) {
    if(state!=='running'||queue.length>=2)return;
    const next=vectors[name],last=queue.length?queue[queue.length-1]:direction;
    if(next.x===last.x&&next.y===last.y)return;
    if(next.x===-last.x&&next.y===-last.y)return;
    queue.push(next);
  }
  function pause() {
    if(state==='running'){state='paused';schedule();$('status').textContent='TAKE A BREATH';$('pause').textContent='▶ 계속하기';overlay('숨 한번 고르고','정원은 여기에서 기다리고 있어요.','계속하기 →','🌼');}
    else if(state==='paused'){state='running';$('overlay').hidden=true;$('pause').textContent='Ⅱ 일시정지';$('status').textContent='GROWING HAPPILY';schedule();}
  }
  $('start').addEventListener('click',()=>state==='paused'?pause():start());
  $('restart').addEventListener('click',start);$('pause').addEventListener('click',pause);$('difficulty').addEventListener('change',schedule);
  const keys={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
  document.addEventListener('keydown',e=>{if(['SELECT','INPUT','TEXTAREA'].includes(e.target.tagName))return;const name=keys[e.key]||keys[e.key.toLowerCase()];if(name){e.preventDefault();steer(name);}else if(e.code==='Space'){e.preventDefault();if(state==='ready'||state==='over')start();else pause();}});
  document.querySelectorAll('[data-dir]').forEach(button=>button.addEventListener('click',()=>steer(button.dataset.dir)));
  let touch=null;
  canvas.addEventListener('pointerdown',e=>{touch={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointerup',e=>{if(!touch)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;touch=null;if(Math.max(Math.abs(dx),Math.abs(dy))<12)return;steer(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));});
  canvas.addEventListener('pointercancel',()=>touch=null);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='running')pause();});
  reset();draw();
})();
