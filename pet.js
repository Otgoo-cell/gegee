/* Амьд хамтрагч: зөөлөн, амьсгалдаг, аажуухан эргэлддэг жижиг 3D амьтан.
   Гурван дүр: Соёолж (sprout), Бадам (lotus), Үүлхэн (cloud). Нэг renderer-ийг харагдаж буй дэлгэц рүү шилжүүлж байрлуулна. */
window.Pet = (function(){
  let ok=false, renderer, scene, camera, group, body, bodyMat, acc=null, parts=null, spores, sporeMat;
  let medit=false, meditF=0, haloMesh, haloMat, fixedYaw=null, userYaw=0, yawVel=0, drag=null, autoT=0, lastFrame=0, host=null, raf=null, last=0, boing=0, dark=false, slow=false, t0=performance.now(), aura=0, auraT=0, baseGlow=0.22, charId='sprout';
  const tmpC=new THREE.Color(), rimA=new THREE.Color(0xfff8e2), rimB=new THREE.Color(0xffe39a);
  const VS = `
    uniform float t; uniform float breath; uniform float squash;
    varying vec3 vN; varying vec3 vP; varying float vY;
    void main(){
      vec3 p = position;
      float w = sin(p.x*3.1+t*1.3)*sin(p.y*2.7+t*1.1)*sin(p.z*2.9+t*0.9);
      p *= 1.0 + 0.035*w;
      p.y *= 0.9 - 0.12*squash;
      p.xz *= 1.0 + 0.11*smoothstep(0.35,-1.0,position.y) + 0.08*squash;
      vY = position.y;
      vN = normalize(normalMatrix*normal);
      vec4 mv = modelViewMatrix*vec4(p,1.0); vP = mv.xyz;
      gl_Position = projectionMatrix*mv;
    }`;
  const FS = `
    uniform vec3 cTop; uniform vec3 cBot; uniform vec3 rimC; uniform float glow;
    varying vec3 vN; varying vec3 vP; varying float vY;
    void main(){
      vec3 n = normalize(vN); vec3 v = normalize(-vP);
      vec3 base = mix(cBot, cTop, smoothstep(-1.0, 1.0, vY));
      vec3 L = normalize(vec3(-0.5,0.85,0.6));
      float dif = 0.62 + 0.38*max(dot(n,L),0.0);
      float fr = pow(1.0-max(dot(n,v),0.0), 2.4);
      vec3 h = normalize(L+v); float sp = pow(max(dot(n,h),0.0), 46.0);
      vec3 col = base*dif + rimC*fr*0.85 + vec3(1.0)*sp*0.5;
      col += rimC*glow*(0.18+0.35*fr);
      gl_FragColor = vec4(col, 1.0);
    }`;
  /* a1 = навч / дэлбээ / үс, a2 = иш / цэцгийн гол / хэл, a3 = нэмэлт (бант) */
  const CHARS = {
    sprout:{ mn:'Соёолж', en:'Sprout',
      day:  {top:0xffd45c, bot:0xfff3cf, rim:0xfff8e2, rimHi:0xffe39a, glow:.22, a1:0x6fb07a, a2:0x58935f, a3:0x6fb07a, eye:0x5a3d14, blush:0xf59a8c, spore:0xf2b632, auraRGB:'255,190,50'},
      night:{top:0x7cc495, bot:0x24443a, rim:0xb9f5c8, rimHi:0xf4ffd0, glow:1,   a1:0x5aa173, a2:0x3f7d58, a3:0x5aa173, eye:0x10201a, blush:0xd98a8f, spore:0xd8ffb0, auraRGB:'200,255,190'} },
    lotus:{ mn:'Бадам', en:'Lotus',
      day:  {top:0xffc3d6, bot:0xfff8f2, rim:0xfff2f7, rimHi:0xffbcd4, glow:.26, a1:0xf79cba, a2:0xffdf85, a3:0xf4789c, eye:0x5b3a44, blush:0xff8aa5, spore:0xffb8cd, auraRGB:'255,150,190'},
      night:{top:0xe79cc6, bot:0x3b2538, rim:0xf8c6e2, rimHi:0xfff0f8, glow:1,   a1:0xd97ca5, a2:0xf3cf7a, a3:0xd05f86, eye:0x1a0f16, blush:0xe07a95, spore:0xffc6e2, auraRGB:'255,180,220'} },
    cloud:{ mn:'Үүлхэн', en:'Cloudy',
      day:  {top:0xffffff, bot:0xcfe3f7, rim:0xf3faff, rimHi:0xbfe0ff, glow:.2,  a1:0x5e4234, a2:0xf27d6c, a3:0x5e4234, eye:0x3a4a60, blush:0xffb3aa, spore:0xbfe0ff, auraRGB:'150,200,255'},
      night:{top:0xa9d9f6, bot:0x27394a, rim:0xcdeeff, rimHi:0xf0fbff, glow:1,   a1:0x3a2a24, a2:0xd4705f, a3:0x3a2a24, eye:0x0e1620, blush:0xd98a8f, spore:0xd0ecff, auraRGB:'170,220,255'} }
  };
  const lamb=(o={})=>new THREE.MeshLambertMaterial(Object.assign({color:0xffffff},o));
  const basic=(o={})=>new THREE.MeshBasicMaterial(Object.assign({color:0x333333},o));
  const M=(g,m)=>new THREE.Mesh(g,m);

  function leafGeo(){
    const s=new THREE.Shape(); s.moveTo(0,0); s.quadraticCurveTo(0.24,0.26,0,0.6); s.quadraticCurveTo(-0.24,0.26,0,0);
    const g=new THREE.ShapeGeometry(s,16); const p=g.attributes.position;
    for(let i=0;i<p.count;i++){ const y=p.getY(i), x=p.getX(i); p.setZ(i, 0.35*y*y - 0.25*x*x); }
    g.computeVertexNormals(); return g;
  }
  function onSurface(obj, x, y, out){
    const z=Math.sqrt(Math.max(0,1-x*x-y*y)); obj.position.set(x*out, y*out*0.9, z*out);
    obj.lookAt(x*3, y*3*0.9, z*3);
  }

  /* ---------- Соёолж ---------- */
  function buildSprout(g){
    const eyeMat=basic(), blushMat=basic({transparent:true,opacity:.55,depthWrite:false});
    const eyeGeo=new THREE.TorusGeometry(0.11,0.022,8,24,Math.PI); eyeGeo.rotateZ(Math.PI);
    [-1,1].forEach(sd=>{
      const e=M(eyeGeo,eyeMat); onSurface(e,0.3*sd,0.16,1.035); g.add(e);
      const b=M(new THREE.CircleGeometry(0.1,24),blushMat); onSurface(b,0.5*sd,-0.04,1.06); b.scale.y=0.62; g.add(b);
    });
    const mg=new THREE.TorusGeometry(0.05,0.016,8,18,Math.PI); mg.rotateZ(Math.PI);
    const mouth=M(mg,eyeMat); onSurface(mouth,0,-0.04,1.04); g.add(mouth);
    const stemMat=lamb(), leafMat=lamb({side:THREE.DoubleSide});
    const stem=M(new THREE.CylinderGeometry(0.03,0.04,0.3,10),stemMat); stem.position.set(0,0.98,0); g.add(stem);
    const lg=leafGeo(), pivots=[];
    [-1,1].forEach((sd,i)=>{
      const pv=new THREE.Group(); pv.position.set(0,1.1,0); pv.userData={sd, base:-sd*0.75};
      const l=M(lg,leafMat); l.rotation.y=sd*0.35; pv.add(l); pv.rotation.z=pv.userData.base; g.add(pv); pivots.push(pv);
    });
    return { mats:{a1:[leafMat],a2:[stemMat],eye:[eyeMat],blush:[blushMat]},
      update:(t,br,bo)=>{ pivots.forEach((pv,i)=>{ pv.rotation.z = pv.userData.base + pv.userData.sd*(0.08*br) + 0.1*Math.sin(t*1.3+i*1.7) + bo*0.4*Math.sin(t*20+i); }); } };
  }

  /* ---------- Бадам (бадамлянхуа охин) ---------- */
  function buildLotus(g){
    const eyeMat=basic(), blushMat=basic({transparent:true,opacity:.62,depthWrite:false});
    const eyeGeo=new THREE.TorusGeometry(0.105,0.02,8,24,Math.PI); eyeGeo.rotateZ(Math.PI);
    const lashGeo=new THREE.BoxGeometry(0.018,0.07,0.018); lashGeo.translate(0,0.035,0);
    [-1,1].forEach(sd=>{
      const eye=new THREE.Group(); onSurface(eye,0.3*sd,0.17,1.035); g.add(eye);
      eye.add(M(eyeGeo,eyeMat));
      [0.12,0.42,0.72].forEach((a,k)=>{   // сормуус: нүдний гадна булангаас гадагш, дээш сэрвийнэ
        const l=M(lashGeo,eyeMat); const phi=sd>0 ? 0.35-a : Math.PI-0.35+a;
        l.position.set(sd*0.105 - sd*0.004*k, 0.004, 0); l.rotation.z=phi-Math.PI/2; eye.add(l);
      });
      const b=M(new THREE.CircleGeometry(0.12,24),blushMat); onSurface(b,0.5*sd,-0.05,1.06); b.scale.y=0.6; g.add(b);
    });
    const mg=new THREE.TorusGeometry(0.036,0.015,8,16,Math.PI); mg.rotateZ(Math.PI);
    const mouth=M(mg,eyeMat); onSurface(mouth,0,-0.05,1.04); g.add(mouth);
    // толгой дээрх бадамлянхуа
    const petalMat=lamb(), centerMat=lamb(), bowMat=lamb();
    petalMat.emissive=new THREE.Color(0x000000); petalMat.userData.em=0.42;
    const pg=new THREE.SphereGeometry(0.16,14,12); pg.translate(0,0.16,0);   // дэлбээ: ёроолоосоо дээш сунасан зууван
    const flower=new THREE.Group(); flower.position.set(0,0.9,0); g.add(flower); const petals=[];
    [{n:6,tilt:-0.95,sx:.75,sy:1.8,sz:.5,r:.16,off:0,y:0},{n:3,tilt:-0.42,sx:.68,sy:1.5,sz:.48,r:.08,off:Math.PI/6,y:0.05}].forEach(ring=>{
      for(let i=0;i<ring.n;i++){
        const pv=new THREE.Group(); pv.rotation.y=ring.off+i*2*Math.PI/ring.n; pv.position.y=ring.y;
        const p=M(pg,petalMat); p.scale.set(ring.sx,ring.sy,ring.sz); p.position.z=ring.r; p.rotation.x=ring.tilt; p.userData={base:ring.tilt}; pv.add(p); flower.add(pv); petals.push(p);
      }
    });
    const center=M(new THREE.SphereGeometry(0.1,16,12),centerMat); center.position.y=0.19; flower.add(center);
    // хажуу талын бант
    const bow=new THREE.Group(); onSurface(bow,0.56,0.56,0.99); g.add(bow); const bowIn=new THREE.Group(); bow.add(bowIn);
    [-1,1].forEach(s=>{ const m=M(new THREE.SphereGeometry(0.13,16,12),bowMat); m.scale.set(1,0.62,0.5); m.position.x=s*0.13; m.rotation.z=s*0.35; bowIn.add(m); });
    bowIn.add(M(new THREE.SphereGeometry(0.06,12,10),bowMat));
    return { mats:{a1:[petalMat],a2:[centerMat],a3:[bowMat],eye:[eyeMat],blush:[blushMat]},
      update:(t,br,bo)=>{
        petals.forEach((p,i)=>{ p.rotation.x = p.userData.base - 0.09*br + bo*0.18*Math.sin(t*18+i); });
        flower.rotation.y = 0.15*Math.sin(t*0.6);
        bowIn.rotation.z = 0.1*Math.sin(t*1.5) + bo*0.5*Math.sin(t*20);
      } };
  }

  /* ---------- Үүлхэн (үүл хүү) ---------- */
  function buildCloud(g){
    const eyeMat=basic(), blushMat=basic({transparent:true,opacity:.5,depthWrite:false}), tongueMat=basic(), hairMat=lamb();
    const puffs=[];
    [-1,1].forEach(sd=>{
      const sg=new THREE.SphereGeometry(0.31,24,18); sg.translate(sd*0.7,0.8,0); const p=M(sg,bodyMat); g.add(p); puffs.push(p);
      const inner=M(new THREE.CircleGeometry(0.15,20),blushMat); inner.position.set(sd*0.7,0.8,0.28); inner.lookAt(sd*0.7*3,0.8*3,3); g.add(inner);
    });
    const eyeGeo=new THREE.TorusGeometry(0.1,0.024,8,24,Math.PI);   // ^ ^ баярласан нүд
    const closedGeo=new THREE.TorusGeometry(0.1,0.022,8,24,Math.PI); closedGeo.rotateZ(Math.PI); const openEyes=[], closedEyes=[];
    [-1,1].forEach(sd=>{
      const e=M(eyeGeo,eyeMat); onSurface(e,0.3*sd,0.13,1.035); g.add(e); openEyes.push(e);
      const ce=M(closedGeo,eyeMat); onSurface(ce,0.3*sd,0.16,1.035); ce.visible=false; g.add(ce); closedEyes.push(ce);
      const brow=M(new THREE.BoxGeometry(0.13,0.028,0.02),eyeMat); onSurface(brow,0.3*sd,0.36,1.03); brow.rotateZ(sd*0.2); g.add(brow);
      const b=M(new THREE.CircleGeometry(0.085,24),blushMat); onSurface(b,0.52*sd,-0.07,1.06); b.scale.y=0.65; g.add(b);
    });
    const mouth=M(new THREE.CircleGeometry(0.05,20),eyeMat); onSurface(mouth,0,-0.09,1.04); g.add(mouth);
    const tongue=M(new THREE.CircleGeometry(0.03,16),tongueMat); onSurface(tongue,0,-0.105,1.046); g.add(tongue);
    const curl=new THREE.Group(); curl.position.set(0.06,0.97,0); g.add(curl);
    const c=M(new THREE.TorusGeometry(0.15,0.034,8,24,Math.PI*1.35),hairMat); c.rotation.set(0,0.35,-0.55); c.position.set(0,0.12,0); curl.add(c);
    return { mats:{a1:[hairMat],a2:[tongueMat],eye:[eyeMat],blush:[blushMat]},
      update:(t,br,bo)=>{
        curl.rotation.z = 0.12*Math.sin(t*1.6) + bo*0.5*Math.sin(t*20); curl.rotation.x = 0.08*Math.sin(t*1.1);
        const s=1+0.045*br; puffs.forEach(p=>p.scale.set(s,s,s));
      },
      meditate:(f)=>{ const c=f>0.5; openEyes.forEach(e=>e.visible=!c); closedEyes.forEach(e=>e.visible=c); mouth.scale.setScalar(1-0.5*f); tongue.visible=!c; } };
  }
  const BUILD={sprout:buildSprout, lotus:buildLotus, cloud:buildCloud};

  function rebuild(){
    if(acc){ group.remove(acc); acc.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
    acc=new THREE.Group(); group.add(acc); parts=BUILD[charId](acc); applyPalette();
  }
  function applyPalette(){
    if(!bodyMat) return;
    const P=CHARS[charId][dark?'night':'day'], u=bodyMat.uniforms;
    u.cTop.value.setHex(P.top); u.cBot.value.setHex(P.bot); u.rimC.value.setHex(P.rim); baseGlow=P.glow; rimA.setHex(P.rim); rimB.setHex(P.rimHi);
    if(parts) for(const k in parts.mats) parts.mats[k].forEach(m=>{ m.color.setHex(P[k]); if(m.userData.em) m.emissive.setHex(P[k]).multiplyScalar(m.userData.em); });
    sporeMat.color.setHex(P.spore); sporeMat.blending = dark?THREE.AdditiveBlending:THREE.NormalBlending; sporeMat.needsUpdate=true;
  }

  function init(){
    if(ok || !window.THREE) return ok;
    let canvas;
    try{
      canvas=document.createElement('canvas'); canvas.className='petcanvas';
      renderer=new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:'low-power'});
      renderer.setPixelRatio(Math.min(window.__lite?1.5:2, window.devicePixelRatio||1));
      renderer.setClearColor(0x000000,0);
    }catch(e){ return false; }
    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(30,1,0.1,50); camera.position.set(0,0.55,5.6); camera.lookAt(0,0.28,0);
    scene.add(new THREE.HemisphereLight(0xffffff,0x88aa88,0.9));
    const dl=new THREE.DirectionalLight(0xffffff,0.6); dl.position.set(-2,3,3); scene.add(dl);
    group=new THREE.Group(); scene.add(group);
    bodyMat=new THREE.ShaderMaterial({vertexShader:VS, fragmentShader:FS, uniforms:{
      t:{value:0}, breath:{value:0}, squash:{value:0}, glow:{value:0},
      cTop:{value:new THREE.Color()}, cBot:{value:new THREE.Color()}, rimC:{value:new THREE.Color()} }});
    body=new THREE.Mesh(new THREE.IcosahedronGeometry(1,24), bodyMat); group.add(body);
    // бясалгалын үеийн гэгээн цагираг
    haloMat=new THREE.MeshBasicMaterial({color:0xfff1b8, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false});
    haloMesh=new THREE.Mesh(new THREE.TorusGeometry(0.46,0.028,8,48),haloMat); haloMesh.rotation.x=1.25; haloMesh.position.y=1.5; group.add(haloMesh);

    // эргэн тойронд хөвөх жижиг спор
    const n=22, pos=new Float32Array(n*3), seed=[];
    for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, r=1.45+Math.random()*0.7, y=-0.6+Math.random()*1.9; seed.push({a,r,y,s:0.15+Math.random()*0.35}); pos[i*3]=Math.cos(a)*r; pos[i*3+1]=y; pos[i*3+2]=Math.sin(a)*r; }
    const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.BufferAttribute(pos,3)); sg.userData=seed;
    const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); const gr=x.createRadialGradient(32,32,0,32,32,32);
    gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.4,'rgba(255,255,255,.55)'); gr.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=gr; x.fillRect(0,0,64,64);
    sporeMat=new THREE.PointsMaterial({size:0.13, map:new THREE.CanvasTexture(c), transparent:true, depthWrite:false, color:0xe7c66a, opacity:.85});
    spores=new THREE.Points(sg,sporeMat); scene.add(spores);

    canvas.addEventListener('pointerdown', e=>{ drag={x:e.clientX, moved:false, start:e.clientX}; yawVel=0; try{ canvas.setPointerCapture(e.pointerId); }catch(_){} });
    canvas.addEventListener('pointermove', e=>{ if(!drag) return; const dx=e.clientX-drag.x; drag.x=e.clientX; if(Math.abs(e.clientX-drag.start)>6) drag.moved=true; if(drag.moved){ userYaw+=dx*0.012; yawVel=dx*0.012; } });
    const up=()=>{ if(!drag) return; if(!drag.moved) boing=1; drag=null; };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    rebuild();
    ok=true; return true;
  }
  function setTheme(isDark){ dark=!!isDark; applyPalette(); }
  function setChar(id){ if(!CHARS[id]) id='sprout'; if(id===charId && ok) return; charId=id; if(ok) rebuild(); }
  function frame(now){
    raf=requestAnimationFrame(frame);
    if(now-last < (window.__lite ? (slow?66:45) : 33)) return; last=now;
    const t=(now-t0)/1000, period=slow?10:7, dtf=lastFrame?Math.min(0.1,(now-lastFrame)/1000):0; lastFrame=now;
    meditF += ((medit?1:0)-meditF)*0.035;
    if(!drag){ autoT+=dtf*(1-0.75*meditF); userYaw+=yawVel; yawVel*=0.9; if(Math.abs(yawVel)<0.004){ const home=Math.round(userYaw/(2*Math.PI))*2*Math.PI; userYaw+=(home-userYaw)*0.06; } }
    const br=0.5-0.5*Math.cos(2*Math.PI*t/period);
    boing*=0.93;
    const u=bodyMat.uniforms; u.t.value=t; u.breath.value=br; u.squash.value=boing*Math.sin(t*18)*0.9;
    const sc=1+0.05*br; group.scale.set(sc, sc*(1-0.025*br), sc);
    group.rotation.y = fixedYaw===null ? autoT*0.21 + userYaw : fixedYaw;
    group.rotation.x = 0.06*Math.sin(t*0.5) + 0.14*meditF;
    group.position.y = 0.07*Math.sin(t*0.9) + boing*0.25*Math.abs(Math.sin(t*9)) + meditF*(0.16+0.05*Math.sin(t*0.6));
    haloMat.opacity = meditF*(0.55+0.3*br); haloMesh.rotation.z=t*0.4; haloMesh.position.y=1.5+0.04*Math.sin(t*1.1);
    if(parts&&parts.meditate) parts.meditate(meditF);
    camera.position.set(0, 0.55+0.25*meditF, 5.6+1.4*meditF); camera.lookAt(0, 0.28+0.42*meditF, 0);
    if(parts) parts.update(t,br,boing);
    const p=spores.geometry.attributes.position, sd=spores.geometry.userData;
    for(let i=0;i<sd.length;i++){ const s=sd[i], a=s.a+t*s.s*0.4; p.setXYZ(i, Math.cos(a)*s.r, s.y+0.15*Math.sin(t*s.s*2+i), Math.sin(a)*s.r); }
    p.needsUpdate=true;
    aura += (auraT-aura)*0.03;
    u.glow.value = baseGlow + aura*(dark?0.9:0.85) + aura*0.12*Math.sin(t*1.6);
    tmpC.copy(rimA).lerp(rimB, aura); u.rimC.value.copy(tmpC);
    const vis = Math.round(6 + aura*16);
    for(let i=0;i<sd.length;i++){ if(i>=vis) p.setXYZ(i,0,-50,0); }
    sporeMat.size = 0.11 + aura*0.07;
    sporeMat.opacity = (dark ? 0.55+0.35*Math.sin(t*1.7) : 0.7) * (0.6+0.4*aura);
    if(orbitG){ orbitG.visible = !!host && host.id!=='petLock'; if(orbitG.visible){ orbitG.userData.tick(t); orbitG.position.y=group.position.y*.6; } }
    renderer.render(scene,camera);
  }
  let orbitG=null, orbitKey='';
  function setOrbit(specs,key){
    key=key||''; if(key===orbitKey) return; orbitKey=key;
    if(orbitG){ scene.remove(orbitG); orbitG.traverse(m=>{ if(m.material) m.material.dispose(); }); orbitG=null; }
    if(!specs || !specs.length || !window.Gem || !Gem.orbit || !init()) return;
    Gem.orbit(specs).then(g=>{ if(orbitKey!==key) return; orbitG=g; scene.add(g); }).catch(()=>{});
  }
  function mount(el){
    if(!init()){ return false; }
    if(host!==el){ host=el; el.appendChild(renderer.domElement); }
    const s=el.clientWidth||120; renderer.setSize(s,s,false);
    renderer.domElement.style.width=renderer.domElement.style.height=s+'px';
    if(!raf){ last=0; raf=requestAnimationFrame(frame); }
    return true;
  }
  function pause(){ if(raf){ cancelAnimationFrame(raf); raf=null; } }
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden) pause(); else if(host && host.offsetParent!==null) mount(host); });
  return {setMeditate:v=>{ medit=!!v; }, pose:v=>{ fixedYaw=(v===null||v===undefined)?null:+v; }, setAura:v=>{ auraT=Math.max(0,Math.min(1,+v||0)); }, spores:v=>{ if(spores) spores.visible=!!v; }, setOrbit, mount, pause, setTheme, setChar,
    chars:()=>Object.keys(CHARS), charName:(id,en)=>(CHARS[id]||CHARS.sprout)[en?'en':'mn'], current:()=>charId,
    auraRGB:()=>CHARS[charId][dark?'night':'day'].auraRGB, setSlow:v=>{ slow=!!v; }, ready:()=>!!window.THREE};
})();
