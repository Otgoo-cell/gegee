/* Эрдэнийн чулуу: шагнал бүр гэрэл нэвтэрдэг, өнгөлсөн 3D чулуу.
   Нүүрэн талд дотроо гэрэлтэх бэлгэдэл, ар талд нь нарийн сийлсэн бичээс. Хуруугаар эргүүлнэ. */
window.Gem = (function(){
  if(!window.THREE) return null;
  const GEMC = {
    gold:  {c:0xffbf2a, e:0x7a4600, f:0xfff0b8, a:[0xffd23a,0xff5fa8,0xff6a3d]},   // шар молор (цитрин)
    rose:  {c:0xe8458a, e:0x5a0828, f:0xffe0ec, a:[0xff5fa8,0xffb347,0xb47aff]},   // ягаан болор
    violet:{c:0x7a40ee, e:0x2a0a78, f:0xe9dcff, a:[0xb47aff,0xff6fcf,0x5fd0ff]},   // номин ягаан (аметист)
    sky:   {c:0x1fa2ec, e:0x053a66, f:0xdcf3ff, a:[0x4fc8ff,0xb47aff,0x5fffc0]},   // усан цэнхэр (аквамарин)
    jade:  {c:0x10b46a, e:0x03452a, f:0xd4ffe9, a:[0x3dffaa,0xffe94a,0x4fc8ff]},   // маргад
    silver:{c:0xaebfe0, e:0x2a3450, f:0xffffff, a:[0xff9fd8,0x7fd0ff,0xc69bff]},   // сарны чулуу
    dawn:  {c:0xff7a3a, e:0x6a2006, f:0xffe4d4, a:[0xff8a3d,0xff5f9e,0xffd23a]},   // нарны чулуу
    cosmos:{c:0x4426c8, e:0x12065a, f:0xd9ccff, a:[0x9b6bff,0xff5fcf,0x4fe0ff]},   // танзанит
    stone: {c:0x9aa3b0, e:0x1a1e26, f:0xf2f5fa, a:[0x888888,0x888888,0x888888]}    // өнгөлөөгүй
  };
  /* ---------- хэлбэр: тэгш хэмгүй, сунасан болор талст ---------- */
  function rng(seed){ let h=2166136261; for(const ch of String(seed)) h=Math.imul(h^ch.charCodeAt(0),16777619); return ()=>{ h^=h<<13; h^=h>>>17; h^=h<<5; return ((h>>>0)%100000)/100000; }; }
  const FORM={ hex:{n:6,H:2.5,r:.46,dbl:false}, round:{n:6,H:2.3,r:.5,dbl:true}, lotus:{n:5,H:2.2,r:.52,dbl:false,rough:.2}, shield:{n:5,H:2.6,r:.44,dbl:false} };
  function crystalPos(kind, seed){
    const F=FORM[kind]||FORM.hex, R=rng(kind+'|'+seed), n=F.n, H=F.H, pos=[], bar=[];
    const jit=(a)=> (R()*2-1)*a;
    // хөндлөн огтлол: жигд бус олон өнцөгт, урд тал нь өргөн
    const ang=[], rad=[];
    for(let i=0;i<n;i++){ ang.push((i/n)*Math.PI*2 + jit(.3*Math.PI/n)); rad.push(F.r*(1+jit(F.rough||.14))); }
    const lean=jit(.06), leanZ=jit(.03);
    const ring=(y,s,dx,dz,vy)=>ang.map((a,i)=>{ const yy=y+(vy?jit(vy):0); return new THREE.Vector3(Math.cos(a)*rad[i]*s+dx+lean*yy, yy, Math.sin(a)*rad[i]*s*.78+dz+leanZ*yy); });
    const yTop=H/2, yBot=-H/2;
    const tt=H*(.3+R()*.14), tb=H*(.18+R()*.1);
    const up=ring(yTop-tt, 1+jit(.04), jit(.02), 0, tt*.55);
    const lo=ring(yBot+(F.dbl?tb:.1), .96+jit(.05), jit(.02), 0, F.dbl?tb*.3:.06);
    const apex=new THREE.Vector3(jit(.22)+lean*yTop, yTop+jit(.06), jit(.1));
    const apexB=new THREE.Vector3(jit(.08)+lean*yBot, yBot, jit(.05));
    // хурц ирмэг: 1 = жинхэнэ ирмэг, 0 = дөрвөлжин талын диагональ (харагдахгүй)
    const tri=(a,b,c,ea=1,eb=1,ec=1)=>{ pos.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z);
      // ec: a-b ирмэг, ea: b-c, eb: c-a
      bar.push(1,eb?0:1,ec?0:1, ea?0:1,1,ec?0:1, ea?0:1,eb?0:1,1); };
    const quad=(a,b,c,d)=>{ tri(a,b,c, 1,0,1); tri(a,c,d, 1,1,0); };   // a-b-c-d тойрог, a-c диагональ далд
    for(let i=0;i<n;i++){ const j=(i+1)%n;
      quad(lo[i],lo[j],up[j],up[i]);
      tri(up[i],up[j],apex);
      if(F.dbl) tri(lo[j],lo[i],apexB);
    }
    if(!F.dbl){ // хугарсан мэт хавтгай суурь
      const base=lo.map(v=>new THREE.Vector3(v.x*.95+lean*yBot, yBot+jit(.03), v.z*.95));
      for(let i=0;i<n;i++){ const j=(i+1)%n; quad(base[i],base[j],lo[j],lo[i]); }
      const cB=new THREE.Vector3(); base.forEach(v=>cB.add(v)); cB.multiplyScalar(1/n);
      for(let i=0;i<n;i++){ const j=(i+1)%n; tri(cB,base[j],base[i], 1,0,0); }
    }
    return {pos,bar};
  }
  function buildGeo(kind, seed){
    const {pos,bar}=crystalPos(kind, seed);
    // нүүр бүрийг гадагш харуулна (оройн дараалал солигдвол bary-г хамт солино)
    const v=new THREE.Vector3(), a=new THREE.Vector3(), b=new THREE.Vector3(), c=new THREE.Vector3();
    for(let i=0;i<pos.length;i+=9){
      a.set(pos[i],pos[i+1],pos[i+2]); b.set(pos[i+3],pos[i+4],pos[i+5]); c.set(pos[i+6],pos[i+7],pos[i+8]);
      const nrm=new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3().subVectors(c,a));
      v.copy(a).add(b).add(c).multiplyScalar(1/3); v.y*=.35;
      if(nrm.dot(v)<0){ for(let k=0;k<3;k++){ let t=pos[i+3+k]; pos[i+3+k]=pos[i+6+k]; pos[i+6+k]=t; t=bar[i+3+k]; bar[i+3+k]=bar[i+6+k]; bar[i+6+k]=t; } }
    }
    const g=new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3)); g.computeVertexNormals();
    g.setAttribute('bary', new THREE.Float32BufferAttribute(bar,3));
    return g;
  }
  const geoCache={}; const geo=(k,s)=>{ const key=k+'|'+(s||''); return geoCache[key]||(geoCache[key]=buildGeo(k,s||'')); };
  function backR(kind){ return .42; }

  /* ---------- бэлгэдлийн бичлэг (дотор гэрэлтэнэ) ---------- */
  const imgCache={};
  function svgImg(svg){
    if(imgCache[svg]) return imgCache[svg];
    return imgCache[svg]=new Promise(res=>{ const im=new Image();
      im.onload=()=>res(im); im.onerror=()=>res(null);
      im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="22 22 56 56" width="512" height="512"><g fill="#fff" stroke="#fff">${svg}</g></svg>`); });
  }
  async function glyphTex(o){
    const cv=document.createElement('canvas'); cv.width=cv.height=512; const x=cv.getContext('2d');
    try{ await document.fonts.ready; }catch(e){}
    x.shadowColor='rgba(255,246,220,.95)';
    const paint=()=>{
      if(o.num!=null){
        const s=String(o.num); x.fillStyle='#fffaf0'; x.textAlign='center'; x.textBaseline='alphabetic';
        x.font=`600 ${s.length>3?170:s.length>2?210:270}px Cormorant, Georgia, serif`; x.fillText(s,256,o.unit?318:350);
        if(o.unit){ x.font='300 52px Manrope, system-ui, sans-serif'; const u=o.unit.split('').join(String.fromCharCode(8202)); x.fillText(u,256,408); }
      } else if(o._im){ x.drawImage(o._im,56,56,400,400); }
    };
    if(o.svg && o.num==null) o._im=await svgImg(o.svg);
    x.shadowBlur=40; paint(); x.shadowBlur=14; paint(); x.shadowBlur=0; paint();
    const t=new THREE.CanvasTexture(cv); t.encoding=THREE.sRGBEncoding; return t;
  }
  /* ---------- ар талын сийлбэр ---------- */
  function wrap(x,txt,w){ const out=[]; let line=''; txt.split(' ').forEach(wd=>{ const t=line?line+' '+wd:wd; if(x.measureText(t).width>w && line){ out.push(line); line=wd; } else line=t; }); if(line) out.push(line); return out; }
  function engraveTex(o){
    const W=512, H=1024, cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d'), c=W/2;
    const etch=(fn)=>{ x.save(); x.shadowColor='rgba(255,255,255,.85)'; x.shadowBlur=10; x.fillStyle=x.strokeStyle='rgba(255,255,255,.55)'; fn(); x.restore();
      x.save(); x.fillStyle=x.strokeStyle='rgba(255,255,255,.98)'; fn(); x.restore(); };
    x.textAlign='center'; x.textBaseline='middle';
    // нарийн хүрээ
    etch(()=>{ x.lineWidth=2; x.beginPath(); x.moveTo(c,22); x.lineTo(W-40,150); x.lineTo(W-40,H-150); x.lineTo(c,H-22); x.lineTo(40,H-150); x.lineTo(40,150); x.closePath(); x.stroke(); });
    etch(()=>{ x.lineWidth=1.2; x.beginPath(); x.moveTo(c,48); x.lineTo(W-62,162); x.lineTo(W-62,H-162); x.lineTo(c,H-48); x.lineTo(62,H-162); x.lineTo(62,162); x.closePath(); x.stroke(); });
    const small=(t,y)=>{ x.font='600 22px Golos, system-ui, sans-serif'; const s=t.split('').join(String.fromCharCode(8202)); etch(()=>x.fillText(s,c,y)); };
    small(o.ring2||'', 128); small(o.ring||'', H-128);
    // гол бичээс
    x.font='700 60px Cormorant, Georgia, serif';
    const tl=wrap(x,o.title||'',340);
    x.font='500 30px Golos, system-ui, sans-serif';
    const body=[]; (o.lines||[]).slice(0,5).forEach(l=>wrap(x,l,330).forEach(w=>body.push(w)));
    const HH=tl.length*64+60+body.length*44; let y=H/2-HH/2+32;
    tl.forEach(t=>{ x.font='700 60px Cormorant, Georgia, serif'; etch(()=>x.fillText(t,c,y)); y+=64; });
    y+=4;
    etch(()=>{ x.lineWidth=1.6; x.beginPath(); x.moveTo(c-110,y); x.lineTo(c-16,y); x.moveTo(c+16,y); x.lineTo(c+110,y); x.stroke();
      x.beginPath(); x.moveTo(c,y-9); x.lineTo(c+9,y); x.lineTo(c,y+9); x.lineTo(c-9,y); x.closePath(); x.fill(); });
    y+=52;
    body.forEach(t=>{ x.font='500 30px Golos, system-ui, sans-serif'; etch(()=>x.fillText(t,c,y)); y+=44; });
    const tx=new THREE.CanvasTexture(cv); tx.encoding=THREE.sRGBEncoding; tx.anisotropy=4; return tx;
  }
  /* ---------- орчин (гялбаа) ---------- */
  function envFor(renderer){
    const sc=new THREE.Scene();
    const sky=new THREE.Mesh(new THREE.SphereGeometry(10,32,16), new THREE.ShaderMaterial({side:THREE.BackSide,
      vertexShader:'varying vec3 p; void main(){ p=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader:'varying vec3 p; void main(){ float h=normalize(p).y; vec3 c=mix(vec3(.03,.03,.05), vec3(.32,.30,.28), smoothstep(-.5,.6,h)); c=mix(c, vec3(.9,.86,.8), smoothstep(.75,1.,h)); gl_FragColor=vec4(c,1.); }'}));
    sc.add(sky);
    const panel=(w,h,x,y,z,k)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({color:new THREE.Color(k,k,k), side:THREE.DoubleSide})); m.position.set(x,y,z); m.lookAt(0,0,0); sc.add(m); };
    panel(3,1.6, -4,5,5, 7); panel(.8,5, 6,1,2, 5); panel(3,.6, 2,-2,6, 4); panel(1.6,1.6, -5,-1,-4, 3); panel(.7,4, 0,3,-7, 5); panel(.6,.6, 3,4,-3, 8);
    const pm=new THREE.PMREMGenerator(renderer); const t=pm.fromScene(sc,0.035).texture; pm.dispose(); return t;
  }

  /* ---------- чулууны гэрэл хугарал (өөрийн shader) ---------- */
  const GVS='attribute vec3 bary; varying vec3 vB; varying vec3 vW; varying vec3 vL; void main(){ vB=bary; vL=position; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }';
  const GFS=`
    uniform vec3 col; uniform vec3 deep; uniform vec3 lite; uniform float time; uniform float phase; uniform float isBack; uniform float locked;
    varying vec3 vW; varying vec3 vL; varying vec3 vB;
    /* дотор нь амьд мэт хөвөх олон өнгийн аура ба гэрэлт тоосонцор */
    uniform vec3 a1; uniform vec3 a2; uniform vec3 a3;
    vec3 aura(vec2 q, float t){
      vec3 s=vec3(0.);
      for(int i=0;i<3;i++){ float fi=float(i);
        vec2 c=vec2(sin(t*(.3+.07*fi)+fi*2.1)*.46, cos(t*(.25+.06*fi)+fi*1.7)*.42);
        float r=.32+.1*sin(t*.35+fi*3.);
        float k=exp(-dot(q-c,q-c)/(r*r))*(.55+.45*sin(t*.45+fi*2.4));
        s+=k*(i==0?a1:i==1?a2:a3);
      }
      float m1=.5+.5*sin(q.x*3.1+t*.25+sin(q.y*2.3-t*.2)*1.6);
      float m2=.5+.5*sin(q.y*2.7-t*.22+sin(q.x*1.9+t*.16)*1.4);
      s+= (a1*m1*(1.-m2)+a2*m2*(1.-m1)+a3*m1*m2)*.16;
      return s;
    }
    vec3 env(vec3 d){
      vec3 c = mix(vec3(.1,.095,.12), vec3(.26,.24,.23), smoothstep(-.4,.9,d.y));
      c += vec3(1.,.96,.88)*pow(max(dot(d,normalize(vec3(-.5,.7,.5))),0.),36.)*4.;
      c += vec3(.9,.95,1.)*pow(max(dot(d,normalize(vec3(.8,.25,.55))),0.),60.)*3.5;
      c += vec3(1.)*pow(max(dot(d,normalize(vec3(.35,-.4,.85))),0.),40.)*1.8;
      c += vec3(1.,.9,.8)*pow(max(dot(d,normalize(vec3(-.6,-.5,-.6))),0.),24.)*1.6;
      c += vec3(1.)*pow(max(dot(d,normalize(vec3(.3,.9,-.3))),0.),90.)*6.;
      c += vec3(1.,.95,.85)*pow(max(dot(d,normalize(vec3(-.9,.1,-.2))),0.),50.)*3.;
      return c;
    }
    float hash(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
    void main(){
      vec3 N=normalize(cross(dFdx(vW),dFdy(vW)));
      vec3 NL=normalize(cross(dFdx(vL),dFdy(vL)));
      float fh=hash(floor(NL*9.+.5));
      // гэрэлтэх ирмэг: нарийн цагаан шугам + өнгөт туяа
      vec3 fw=max(fwidth(vB),vec3(1e-4)); vec3 ep=vB/fw; float em=min(min(ep.x,ep.y),ep.z);
      float core=1.-smoothstep(.5,2.2,em), eglow=exp(-em*.13)*.9+exp(-em*.045)*.5;
      vec3 V=normalize(cameraPosition-vW);
      if(dot(N,V)<0.) N=-N;
      vec3 c; float a;
      vec3 C=col; float lk=locked;
      if(lk>.5){ float l=dot(C,vec3(.3,.59,.11)); C=mix(C,vec3(l),.85); core*=.45; eglow*=.3; }
      float d=length(vec2(vL.x, vL.z*1.4))/.55;
      float pulse=.75+.25*sin(time*.8+vL.y*1.6+phase);
      float low=smoothstep(.9,-.9,vL.y)*.8+.35;
      float coreGlow=exp(-d*d*1.6)*pulse*low*(1.-lk*.8);
      vec3 au=aura(vec2(vL.x*1.5, vL.y*.62), time+phase)*(1.-lk);
      if(isBack>.5){
        vec3 fire=vec3(env(refract(-V,N,.40)).r, env(refract(-V,N,.42)).g, env(refract(-V,N,.44)).b);
        vec3 G=C*1.5+lite*.15;
        c = deep*.3 + C*(.26 + fh*.3) + C*fire*.45 + G*coreGlow*1.7 + au*1.1;
        c += vec3(1.)*core*.45 + G*(core*1.0 + eglow*.9);
        a = clamp(.42 + coreGlow*.35 + core*.4 + eglow*.3, 0., .97);
        if(lk>.5) a = .55 + core*.3;
      } else {
        vec3 R=reflect(-V,N);
        float fr=.05+.95*pow(1.-max(dot(N,V),0.),4.);
        vec3 rf=env(R);
        float rim=pow(1.-max(dot(N,V),0.),2.2);
        vec3 G=C*1.5+lite*.15;
        c = rf*(.14+fr) + C*.05 + au*.15 + G*rim*.5 + vec3(1.)*core*.7 + G*(core*.8 + eglow*1.15) + vec3(.9,.95,1.)*fh*fh*.22;
        a = clamp(.03 + fr*.5 + dot(rf,vec3(.33))*.1 + rim*.2 + core*.9 + eglow*.5 + fh*fh*.18, 0., .96);
        if(lk>.5){ c = mix(c, vec3(.82,.84,.88), .5); a = a*.7+.08; }
      }
      c = vec3(1.)-exp(-c*1.35);
      gl_FragColor=vec4(c,a);
    }`;
  const gemMats=[], TIME={value:0};
  function gemMat(P, locked, back, ph){
    const m=new THREE.ShaderMaterial({vertexShader:GVS, fragmentShader:GFS, transparent:true, depthWrite:back, side:back?THREE.BackSide:THREE.FrontSide,
      extensions:{derivatives:true},
      uniforms:{col:{value:new THREE.Color(P.c)}, deep:{value:new THREE.Color(P.e)}, lite:{value:new THREE.Color(P.c).lerp(new THREE.Color(P.f),.6).multiplyScalar(1.15)}, time:TIME, phase:{value:ph||0}, a1:{value:new THREE.Color(P.a[0])}, a2:{value:new THREE.Color(P.a[1])}, a3:{value:new THREE.Color(P.a[2])}, isBack:{value:back?1:0}, locked:{value:locked?1:0}}});
    gemMats.push(m); if(gemMats.length>60) gemMats.shift(); return m;
  }

  let _haloTex=null;
  function haloTex(){
    if(_haloTex) return _haloTex;
    const cv=document.createElement('canvas'); cv.width=cv.height=256; const x=cv.getContext('2d'), gr=x.createRadialGradient(128,128,0,128,128,128);
    gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.42,'rgba(255,255,255,.8)'); gr.addColorStop(.62,'rgba(255,255,255,.38)'); gr.addColorStop(.82,'rgba(255,255,255,.1)'); gr.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=gr; x.fillRect(0,0,256,256); _haloTex=new THREE.CanvasTexture(cv); return _haloTex;
  }
  const shellCache={};
  function shellGeo(kind, off){
    const k=kind+off; if(shellCache[k]) return shellCache[k];
    const src=geo(kind).attributes.position.array, map={}, pos=[], idx=[];
    for(let i=0;i<src.length;i+=3){ const key=src[i].toFixed(3)+','+src[i+1].toFixed(3)+','+src[i+2].toFixed(3);
      if(map[key]===undefined){ map[key]=pos.length/3; pos.push(src[i],src[i+1],src[i+2]); } idx.push(map[key]); }
    const gg=new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos,3)); gg.setIndex(idx); gg.computeVertexNormals();
    const p=gg.attributes.position, n=gg.attributes.normal;
    for(let i=0;i<p.count;i++){ p.setXYZ(i, p.getX(i)+n.getX(i)*off, p.getY(i)+n.getY(i)*off, p.getZ(i)+n.getZ(i)*off*.6); }
    gg.computeVertexNormals(); return shellCache[k]=gg;
  }
  const AVS='varying vec3 vN; varying vec3 vL; void main(){ vN=normalize(normalMatrix*normal); vL=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }';
  const AFS=`uniform vec3 c1; uniform vec3 c2; uniform vec3 c3; uniform float time; uniform float phase; uniform float strength;
    varying vec3 vN; varying vec3 vL;
    void main(){
      float i=pow(max(.38-dot(vN,vec3(0.,0.,1.)),0.),3.2);
      float t=time*.45+phase;
      vec3 col=mix(mix(c1,c2,.5+.5*sin(t+vL.x*2.)), c3, .5+.5*sin(t*.7+vL.y*2.5+1.7));
      float breath=.78+.22*sin(time*1.1+phase*1.3);
      gl_FragColor=vec4(col, clamp(i*strength*breath,0.,1.));
    }`;
  function auraMat(P, ph, mini){
    return new THREE.ShaderMaterial({vertexShader:AVS, fragmentShader:AFS, transparent:true, depthWrite:false, side:THREE.BackSide,
      uniforms:{c1:{value:new THREE.Color(P.c)}, c2:{value:new THREE.Color(P.a[0])}, c3:{value:new THREE.Color(P.a[1])}, time:TIME, phase:{value:ph}, strength:{value:mini?.9:.5}}});
  }
  function pulseHalo(gr,s){ const h=gr.userData.halo; if(!h) return; const k=.5+.5*Math.sin(s*1.25+h.userData.ph); h.material.opacity=.55+.35*k; const sc=h.userData.base||(h.userData.base=h.scale.x); h.scale.setScalar(sc*(.93+.1*k)); }
  /* ---------- нэг чулууны бүтэц ---------- */
  async function build(o, env){
    const kind=o.shape==='circle'?'round':o.shape||'round', g=geo(kind, o.seed||'');
    const P=o.locked?GEMC.stone:(GEMC[o.pal]||GEMC.gold);
    const grp=new THREE.Group();
    const back=new THREE.Mesh(g, gemMat(P,o.locked,true,o.phase));
    back.renderOrder=1; grp.add(back);
    const gt=o.mini?null:await glyphTex(o);
    const glyph=new THREE.Mesh(new THREE.PlaneGeometry(.66,.66), new THREE.MeshBasicMaterial({map:gt, visible:!o.mini, color:o.locked?0x9aa2ad:P.f, transparent:true, opacity:o.locked?.3:.9, blending:THREE.AdditiveBlending, depthWrite:false}));
    glyph.position.z=.02; glyph.renderOrder=2; grp.add(glyph);
    const glow=new THREE.Mesh(new THREE.CircleGeometry(.75,40), new THREE.MeshBasicMaterial({color:P.c, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false}));
    glow.position.z=-.05; glow.renderOrder=2; grp.add(glow);
    const front=new THREE.Mesh(g, gemMat(P,o.locked,false,o.phase));
    front.renderOrder=3; grp.add(front);
    if(o.engrave){
      // болор дотор лазераар сийлсэн мэт бичээс (ар талаас харагдана)
      const eng=new THREE.Mesh(new THREE.PlaneGeometry(.78,1.56), new THREE.MeshBasicMaterial({map:engraveTex(o.engrave), transparent:true, depthWrite:false, opacity:o.locked?.6:.95}));
      eng.position.z=-.03; eng.rotation.y=Math.PI; eng.renderOrder=2; grp.add(eng);
    }
    // чулууны өөрийнх нь хэлбэрийг дагасан гэрлийн аура (ард асаасан гэрэл биш)
    let halo=null;
    grp.userData={back,front,glyph,glow,halo,gc:new THREE.Color(o.locked?0x777777:P.c).lerp(new THREE.Color(P.a[1]),.25)};
    return grp;
  }
  let _shTex=null;
  function shadow(){
    if(!_shTex){ const cv=document.createElement('canvas'); cv.width=cv.height=128; const x=cv.getContext('2d'); const gr=x.createRadialGradient(64,64,0,64,64,64);
      gr.addColorStop(0,'rgba(255,255,255,.9)'); gr.addColorStop(.45,'rgba(255,255,255,.3)'); gr.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=gr; x.fillRect(0,0,128,128); _shTex=new THREE.CanvasTexture(cv); }
    const m=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.36), new THREE.MeshBasicMaterial({map:_shTex, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending}));
    m.position.set(0,-1.3,-.5); m.renderOrder=0; return m;
  }
  function floatY(s,p){ return Math.sin(s*.85+p)*.13 + Math.sin(s*1.9+p*1.7)*.025; }
  function lights(sc){ sc.add(new THREE.AmbientLight(0xffffff,.08)); const d=new THREE.DirectionalLight(0xffffff,.9); d.position.set(2,3,4); sc.add(d); const d2=new THREE.DirectionalLight(0xfff0d0,.6); d2.position.set(-3,-1,-3); sc.add(d2); return d; }

  /* ---------- жижиг зураг (жагсаалтад) ---------- */
  let tr=null, tenv=null, tsc=null, tcam=null; const thumbCache={};
  function thumbRenderer(){
    if(tr) return tr;
    const cv=document.createElement('canvas'); cv.width=cv.height=240;
    tr=new THREE.WebGLRenderer({canvas:cv, antialias:true, alpha:true, preserveDrawingBuffer:true});
    tr.setPixelRatio(1); tr.setSize(240,240,false); tr.outputEncoding=THREE.sRGBEncoding; tr.toneMapping=THREE.ACESFilmicToneMapping; tr.toneMappingExposure=1.05; tr.setClearColor(0,0);
    tenv=envFor(tr); tsc=new THREE.Scene(); lights(tsc); tcam=new THREE.PerspectiveCamera(30,1,.1,50); tcam.position.set(0,0,4.4);
    return tr;
  }
  let chain=Promise.resolve();
  function thumb(o, key){
    if(thumbCache[key]) return Promise.resolve(thumbCache[key]);
    chain=chain.then(async()=>{
      if(thumbCache[key]) return thumbCache[key];
      try{ thumbRenderer();
        const gem=await build({...o, engrave:null}, tenv);
        const tv=TIME.value; TIME.value=0; gem.rotation.set(.28,-.5,0); tsc.add(gem); tr.render(tsc,tcam); TIME.value=tv;
        thumbCache[key]=tr.domElement.toDataURL('image/png');
        tsc.remove(gem); gem.traverse(m=>{ if(m.material){ if(m.material.map) m.material.map.dispose(); m.material.dispose(); } });
      }catch(e){ thumbCache[key]=''; }
      return thumbCache[key];
    });
    return chain;
  }

  /* ---------- том, эргэлддэг чулуу ---------- */
  let bsh=null, R=null, env=null, sc=null, cam=null, cur=null, raf=null, host=null, dl=null, sparks=[];
  let ry=0, rx=0, vy=0, drag=null, target=0, spin=0, born=0, zoom=1, zoomT=1;
  function starTex(){ const cv=document.createElement('canvas'); cv.width=cv.height=64; const x=cv.getContext('2d'); const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.2,'rgba(255,248,220,.6)'); g.addColorStop(1,'rgba(255,240,200,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); x.fillStyle='rgba(255,255,255,.9)'; x.fillRect(31,4,2,56); x.fillRect(4,31,56,2); return new THREE.CanvasTexture(cv); }
  function initBig(){
    if(R) return true;
    try{
      const cv=document.createElement('canvas'); cv.className='gemcv';
      R=new THREE.WebGLRenderer({canvas:cv, antialias:true, alpha:true}); R.setPixelRatio(Math.min(window.__lite?1.5:2.5, window.devicePixelRatio||1)); R.outputEncoding=THREE.sRGBEncoding; R.toneMapping=THREE.ACESFilmicToneMapping; R.toneMappingExposure=1.05; R.setClearColor(0,0);
      env=envFor(R); sc=new THREE.Scene(); dl=lights(sc); cam=new THREE.PerspectiveCamera(30,1,.1,50); cam.position.set(0,-.06,5.0); bsh=shadow(); sc.add(bsh);
      const st=starTex();
      for(let i=0;i<16;i++){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:st, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, opacity:0}));
        const a=Math.random()*Math.PI*2, r=1.05+Math.random()*.5; s.position.set(Math.cos(a)*r, Math.sin(a)*r, (Math.random()-.5)*.6); s.userData={p:Math.random()*7, sp:.6+Math.random()*1.2, sz:.09+Math.random()*.14}; sc.add(s); sparks.push(s); }
      const cvs=R.domElement;
      // нэг хуруу: эргүүлэх · хоёр хуруу: томруулах / жижигрүүлэх
      const pts=new Map(); let pinch=null;
      const dist=()=>{ const v=[...pts.values()]; return Math.hypot(v[0].x-v[1].x, v[0].y-v[1].y); };
      cvs.addEventListener('pointerdown', e=>{ pts.set(e.pointerId,{x:e.clientX,y:e.clientY}); try{ cvs.setPointerCapture(e.pointerId); }catch(_){} e.stopPropagation();
        if(pts.size===2){ pinch={d:dist(), z:zoomT}; if(drag) drag.moved=99; return; }
        if(pts.size===1){ drag={x:e.clientX,y:e.clientY,lx:e.clientX,ly:e.clientY,t:performance.now(),moved:0}; vy=0; } });
      cvs.addEventListener('pointermove', e=>{ if(!pts.has(e.pointerId)) return; pts.set(e.pointerId,{x:e.clientX,y:e.clientY}); e.stopPropagation();
        if(pinch && pts.size>=2){ zoomT=Math.max(.8,Math.min(3.2, pinch.z*dist()/pinch.d)); return; }
        if(!drag) return; const dx=e.clientX-drag.lx, dy=e.clientY-drag.ly; drag.lx=e.clientX; drag.ly=e.clientY; drag.moved+=Math.abs(dx)+Math.abs(dy);
        ry+=dx*.012/Math.sqrt(zoom); rx=Math.max(-.7,Math.min(.7,rx+dy*.008/Math.sqrt(zoom))); vy=dx*.012/Math.sqrt(zoom); });
      const up=e=>{ pts.delete(e.pointerId); e&&e.stopPropagation();
        if(pinch){ if(pts.size<2) pinch=null; if(!pts.size){ drag=null; zoomT=1; } return; }
        if(!drag) return; if(drag.moved<8){ target=Math.round(ry/Math.PI)*Math.PI+Math.PI; vy=0; } else { target=null; vy=Math.max(-.25,Math.min(.25,vy)); } drag=null; if(!pts.size) zoomT=1; };
      cvs.addEventListener('pointerup', up); cvs.addEventListener('pointercancel', up);
      cvs.addEventListener('wheel', e=>{ e.preventDefault(); zoomT=Math.max(.8,Math.min(3.2, zoomT*(e.deltaY<0?1.1:.91))); }, {passive:false});
      cvs.addEventListener('click', e=>e.stopPropagation());
      return true;
    }catch(e){ R=null; return false; }
  }
  function frame(t){
    raf=requestAnimationFrame(frame);
    if(!cur) return;
    const s=t/1000;
    if(spin>0){ const k=Math.min(1,(t-born)/1800), e=1-Math.pow(1-k,3); ry=-Math.PI*4*(1-e); cur.scale.setScalar(.35+.65*e); if(k>=1){ spin=0; target=0; } }
    else if(!drag){
      if(target===null){ ry+=vy; vy*=.9; if(Math.abs(vy)<.01){ target=Math.round(ry/(2*Math.PI))*2*Math.PI; } }
      else { const sway=Math.sin(s*.7)*.22; ry+=(target+sway-ry)*.06; }
      rx+=(Math.sin(s*.5)*.08-rx)*.07;
    }
    zoom+=(zoomT-zoom)*.18; cam.position.z=5.0/zoom; bsh.visible=zoom<1.4;
    cur.rotation.set(rx, ry, 0); cur.position.y=floatY(s,0); { const h=cur.position.y+.15; bsh.scale.set(1-h*.9,1-h*.9,1); bsh.material.opacity=.75-h*1.4; bsh.material.color.copy(cur.userData.gc); }
    dl.position.set(Math.cos(s*.4)*3, 3, Math.sin(s*.4)*3+2);
    pulseHalo(cur,s);
    const u=cur.userData; if(u.glyph) u.glyph.material.opacity=u.glyph.userData.base*(.82+.18*Math.sin(s*1.7));
    sparks.forEach(sp=>{ const d=sp.userData, v=Math.pow(Math.max(0,Math.sin(s*d.sp+d.p)),10); sp.material.opacity=0; sp.scale.setScalar(d.sz*(.5+v)); });
    TIME.value=s;
    R.render(sc,cam);
  }
  function size(){ if(!host||!R) return; const w=host.clientWidth||260; R.setSize(w,w,false); R.domElement.style.width=R.domElement.style.height=w+'px'; }
  async function show(el, o, celebrate){
    if(!initBig()) return false;
    hide(true); host=el; el.innerHTML=''; el.appendChild(R.domElement); size();
    const g=await build(o, env); if(host!==el){ return true; }
    g.userData.locked=!!o.locked; g.userData.glyph.userData.base=g.userData.glyph.material.opacity;
    if(g.userData.halo){ g.userData.halo.scale.setScalar(2.45); g.userData.halo.userData.base=2.45; }
    cur=g; sc.add(g); zoom=zoomT=1; rx=.1; vy=0; drag=null; target=0;
    if(celebrate){ spin=1; born=performance.now(); } else { ry=-.9; spin=0; cur.scale.setScalar(1); }
    if(!raf) raf=requestAnimationFrame(frame);
    return true;
  }
  function flip(){ if(!cur) return; target=Math.round(ry/Math.PI)*Math.PI+Math.PI; }
  function hide(keep){
    if(cur){ sc.remove(cur); cur.traverse(m=>{ if(m.material){ if(m.material.map) m.material.map.dispose(); m.material.dispose(); } }); cur=null; }
    if(!keep){ if(raf) cancelAnimationFrame(raf); raf=null; host=null; }
  }
  window.addEventListener('resize', size);

  /* ---------- жагсаалт дахь амьд чулуунууд (нэг canvas, олон цонх) ---------- */
  let lsh=null, LR=null, lsc=null, lcam=null, lraf=null, items=[], paused=false; const lcache={};
  function initLive(){
    if(LR) return true;
    try{
      const cv=document.createElement('canvas'); cv.id='gemLive';
      LR=new THREE.WebGLRenderer({canvas:cv, antialias:true, alpha:true}); LR.setPixelRatio(Math.min(window.__lite?1.25:2, window.devicePixelRatio||1));
      LR.outputEncoding=THREE.sRGBEncoding; LR.setClearColor(0,0); LR.setScissorTest(true); LR.autoClear=false;
      lsc=new THREE.Scene(); lights(lsc); lcam=new THREE.PerspectiveCamera(30,1,.1,50); lcam.position.set(0,-.12,8.6); lsh=shadow(); lsc.add(lsh);
      document.body.appendChild(cv); return true;
    }catch(e){ LR=null; return false; }
  }
  function liveFrame(t){
    lraf=requestAnimationFrame(liveFrame);
    const lk=document.getElementById('lock'); if(paused || !items.length || (lk && !lk.hidden)) return;
    const s=t/1000, W=window.innerWidth, H=window.innerHeight;
    if(LR.domElement._w!==W || LR.domElement._h!==H){ LR.setSize(W,H); LR.domElement._w=W; LR.domElement._h=H; }
    TIME.value=s;
    LR.setScissor(0,0,W,H); LR.clear();
    items.forEach(it=>{
      if(!it.g) return; const r=it.el.getBoundingClientRect();
      if(r.bottom<0 || r.top>H || r.width<4) return;
      // хайрцагт хаагдахгүйн тулд чулуу бүрийг өргөн талбайд, төвд нь зурна
      const S=Math.max(r.width,r.height)*1.7, cx=r.left+r.width/2, cy=H-(r.top+r.height/2), x0=cx-S/2, y0=cy-S/2;
      LR.setViewport(x0,y0,S,S); LR.setScissor(x0,y0,S,S); LR.clearDepth();
      it.g.rotation.set(.12+Math.sin(s*.45+it.p)*.06, s*.32+it.p*2.1, Math.sin(s*.3+it.p)*.05); it.g.position.y=floatY(s,it.p);
      { const h=it.g.position.y+.15; lsh.scale.set(1.1-h*.9,1.1-h*.9,1); lsh.material.opacity=it.lk?.2:.75-h*1.3; lsh.material.color.copy(it.g.userData.gc); }
      pulseHalo(it.g,s); it.g.visible=true; LR.render(lsc,lcam); it.g.visible=false;
    });
  }
  function live(list){
    if(!initLive()) return false;
    items.forEach(it=>{ if(it.g) it.g.visible=false; });
    items=list.map((x,i)=>{ const it={el:x.el, p:i*1.37, g:null, lk:!!x.spec.locked};
      const k=x.key;
      (lcache[k] || (lcache[k]=build({...x.spec, engrave:null, phase:(i*7.3)%20}, null).then(g=>{ g.visible=false; lsc.add(g); return g; })))
        .then(g=>{ it.g=g; x.el.classList.add('live'); });
      return it; });
    LR.domElement.style.display='block'; paused=false;
    if(!lraf) lraf=requestAnimationFrame(liveFrame);
    return true;
  }
  function liveStop(){ items=[]; if(LR){ LR.domElement.style.display='none'; } if(lraf) cancelAnimationFrame(lraf); lraf=null; }
  function livePause(p){ paused=!!p; }
  /* ---------- хамтрагчийг тойрох жижиг чулуунууд ---------- */
  async function orbit(specs){
    const grp=new THREE.Group();
    const gs=await Promise.all(specs.map((s,i)=>build({...s, mini:true, engrave:null, phase:i*3.7}, null)));
    gs.forEach((g,i)=>{ g.scale.setScalar(.19); g.userData.i=i; g.userData.n=gs.length; grp.add(g); });
    grp.userData.tick=t=>{ TIME.value=t; const n=gs.length; gs.forEach(x=>pulseHalo(x,t));
      gs.forEach((g,i)=>{ const a=t*.32+i/n*Math.PI*2;
        g.position.set(Math.cos(a)*1.22, .3+Math.sin(a*1.0+i)*.1+Math.sin(a)*.26, Math.sin(a)*1.05);
        g.rotation.set(.3*Math.sin(t*.6+i), t*.8+i, 0); g.scale.setScalar(.19*(1+.06*Math.sin(t*1.7+i))); }); };
    return grp;
  }
  return {thumb, show, hide, flip, live, liveStop, livePause, orbit};
})();
