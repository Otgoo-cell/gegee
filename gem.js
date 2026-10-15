/* Эрдэнийн чулуу: шагнал бүр гэрэл нэвтэрдэг, өнгөлсөн 3D чулуу.
   Нүүрэн талд дотроо гэрэлтэх бэлгэдэл, ар талд нь нарийн сийлсэн бичээс. Хуруугаар эргүүлнэ. */
window.Gem = (function(){
  if(!window.THREE) return null;
  const GEMC = {
    gold:  {c:0xffb01a, e:0x6a3200, f:0xfff0b8, a:[0xffd23a,0xff5fa8,0xff6a3d]},   // шар молор (цитрин)
    rose:  {c:0xec2f7e, e:0x4a0420, f:0xffe0ec, a:[0xff5fa8,0xffb347,0xb47aff]},   // ягаан болор
    violet:{c:0x7030f0, e:0x1e0660, f:0xe9dcff, a:[0xb47aff,0xff6fcf,0x5fd0ff]},   // номин ягаан (аметист)
    sky:   {c:0x1fa2ec, e:0x053a66, f:0xdcf3ff, a:[0x4fc8ff,0xb47aff,0x5fffc0]},   // усан цэнхэр (аквамарин)
    jade:  {c:0x00b866, e:0x02381f, f:0xd4ffe9, a:[0x3dffaa,0xffe94a,0x4fc8ff]},   // маргад
    silver:{c:0x7393f2, e:0x0f1846, f:0xffffff, a:[0xff9fd8,0x7fd0ff,0xc69bff]},   // сарны чулуу
    dawn:  {c:0xff7a3a, e:0x6a2006, f:0xffe4d4, a:[0xff8a3d,0xff5f9e,0xffd23a]},   // нарны чулуу
    cosmos:{c:0x4426c8, e:0x12065a, f:0xd9ccff, a:[0x9b6bff,0xff5fcf,0x4fe0ff]},   // танзанит
    stone: {c:0x9aa3b0, e:0x1a1e26, f:0xf2f5fa, a:[0x888888,0x888888,0x888888]}    // өнгөлөөгүй
  };
  /* ---------- хэлбэр: тэгш хэмгүй, сунасан болор талст ---------- */
  function rng(seed){ let h=2166136261; for(const ch of String(seed)) h=Math.imul(h^ch.charCodeAt(0),16777619); return ()=>{ h^=h<<13; h^=h>>>17; h^=h<<5; return ((h>>>0)%100000)/100000; }; }
  /* Зураг дээрх шиг: нэг үзүүртэй зургаан талт болор, доод тал нь хугарсан, хажуудаа жижиг талсттай */
  const FORM={ hex:{H:2.85,r:.38,side:.36}, round:{H:2.55,r:.44,side:.32}, lotus:{H:2.45,r:.45,side:.42}, shield:{H:2.95,r:.36,side:.3} };
  function crystalPos(kind, seed, small){
    const F=FORM[kind]||FORM.hex, R=rng(kind+'|'+seed+(small?'|s':'')), n=6, H=small?1.6:F.H, pos=[], bar=[];
    const jit=(a)=> (R()*2-1)*a;
    // хөндлөн огтлол: бараг жигд зургаан өнцөгт, хоёр тал нь бага зэрэг өргөн
    const ang=[], rad=[];
    for(let i=0;i<n;i++){ ang.push((i/n)*Math.PI*2 + Math.PI/6 + jit(.08)); rad.push(F.r*(small?1.05:1)*(1+jit(.07))); }
    const lean=jit(.035), leanZ=jit(.02);
    const ring=(y,s,vy)=>ang.map((a,i)=>{ const yy=y+(vy?jit(vy):0); return new THREE.Vector3(Math.cos(a)*rad[i]*s+lean*yy, yy, Math.sin(a)*rad[i]*s*.86+leanZ*yy); });
    const yTop=H/2, yBot=-H/2;
    const tt=H*(.23+R()*.07);
    const up=ring(yTop-tt, 1, tt*.18);
    const lo=ring(yBot+.16, .97+jit(.03), .05);
    const apex=new THREE.Vector3(jit(.06)+lean*yTop, yTop, jit(.04));
    const tri=(a,b,c,ea=1,eb=1,ec=1)=>{ pos.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z);
      bar.push(1,eb?0:1,ec?0:1, ea?0:1,1,ec?0:1, ea?0:1,eb?0:1,1); };
    const quad=(a,b,c,d)=>{ tri(a,b,c, 1,0,1); tri(a,c,d, 1,1,0); };
    for(let i=0;i<n;i++){ const j=(i+1)%n; quad(lo[i],lo[j],up[j],up[i]); tri(up[i],up[j],apex); }
    // хугарсан, жигд бус суурь
    const base=lo.map(v=>new THREE.Vector3(v.x*(.86+jit(.06))+lean*yBot, yBot+jit(.09), v.z*(.86+jit(.06))));
    for(let i=0;i<n;i++){ const j=(i+1)%n; quad(base[i],base[j],lo[j],lo[i]); }
    const cB=new THREE.Vector3(); base.forEach(v=>cB.add(v)); cB.multiplyScalar(1/n); cB.y-=.05;
    for(let i=0;i<n;i++){ const j=(i+1)%n; tri(cB,base[j],base[i], 1,0,0); }
    return {pos,bar};
  }
  function orient(pos, bar){
    const v=new THREE.Vector3(), a=new THREE.Vector3(), b=new THREE.Vector3(), c=new THREE.Vector3();
    for(let i=0;i<pos.length;i+=9){
      a.set(pos[i],pos[i+1],pos[i+2]); b.set(pos[i+3],pos[i+4],pos[i+5]); c.set(pos[i+6],pos[i+7],pos[i+8]);
      const nrm=new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3().subVectors(c,a));
      v.copy(a).add(b).add(c).multiplyScalar(1/3); v.y*=.35;
      if(nrm.dot(v)<0){ for(let k=0;k<3;k++){ let t=pos[i+3+k]; pos[i+3+k]=pos[i+6+k]; pos[i+6+k]=t; t=bar[i+3+k]; bar[i+3+k]=bar[i+6+k]; bar[i+6+k]=t; } }
    }
  }
  function buildGeo(kind, seed){
    const F=FORM[kind]||FORM.hex, m=crystalPos(kind, seed); orient(m.pos, m.bar);
    let pos=m.pos, bar=m.bar;
    // хажуудаа наалдсан жижиг талст (зурган дээрх шиг доод хэсэгт)
    const R=rng('side|'+kind+'|'+seed);
    if(false){   // хажуугийн жижиг талстыг хассан
      const c=crystalPos(kind, seed, true); orient(c.pos, c.bar);
      const sc=F.side*(.85+R()*.3), side=R()<.5?-1:1, rz=side*(.55+R()*.35), ry=(R()*2-1)*.6;
      const mtx=new THREE.Matrix4().makeRotationY(ry).premultiply(new THREE.Matrix4().makeRotationZ(rz)).premultiply(new THREE.Matrix4().makeScale(sc,sc,sc))
        .premultiply(new THREE.Matrix4().makeTranslation(side*F.r*.82, -F.H*(.22+R()*.1), .1));
      const t=new THREE.Vector3();
      for(let i=0;i<c.pos.length;i+=3){ t.set(c.pos[i],c.pos[i+1],c.pos[i+2]).applyMatrix4(mtx); c.pos[i]=t.x; c.pos[i+1]=t.y; c.pos[i+2]=t.z; }
      pos=pos.concat(c.pos); bar=bar.concat(c.bar);
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
    uniform sampler2D orn; uniform float ornRep; uniform vec3 col; uniform vec3 deep; uniform vec3 lite; uniform float time; uniform float phase; uniform float isBack; uniform float locked;
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
    float vn(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
    float fbm(vec3 p){ return vn(p)*.55+vn(p*2.07+3.1)*.3+vn(p*4.13+7.7)*.15; }
    /* алтан судал (кинцүги мэт) ба сүүн цагаан дотоод */
    float vein(vec3 p){ vec3 q=p+vec3(vn(p*7.),vn(p*7.+5.),0.)*.06;   // жижиг хугарал нэмж ан цав мэт болгоно
      float a=abs(fbm(q*1.15+vec3(0.,1.3,0.))-.5), b=abs(fbm(q*1.9+vec3(4.2,0.,1.7))-.5);
      float m=smoothstep(.35,.6,fbm(p*.9+9.));   // зарим хэсэгт л судал гарна
      return max(1.-smoothstep(0.,.016,a), (1.-smoothstep(0.,.01,b))*.6)*m; }
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
      // ---- дотоод бие: гүн өнгө, сүүн үүл, дулаан зүрх, гялалзах тоосонцор, алтан судал ----
      float hy=clamp(vL.y*.38+.5,0.,1.);                       // доороос дээш 0..1
      float rimD=clamp(length(vec2(vL.x,vL.z*1.3))/.46,0.,1.);   // төвөөс ирмэг рүү
      float cl=fbm(vL*2.3+vec3(1.7));
      float cloud=smoothstep(.42,.82,cl);
      float hd=length(vec2(vL.x*1.15, (vL.y+.12)*.8));
      float heart=exp(-hd*hd*6.)*(.8+.2*sin(time*.8+phase))*(1.-lk);
      float halo2=exp(-hd*hd*1.6)*(1.-lk);
      vec3 gq=vL*22.+vec3(phase); vec3 gp=floor(gq); float gh=hash(gp);
      vec3 go=vec3(hash(gp+1.7),hash(gp+3.1),hash(gp+5.3))*.6+.2;
      float gd=length(fract(gq)-go);
      float tw=pow(max(0.,sin(time*(1.2+gh*2.5)+gh*40.)),10.);
      float glit=step(.88,gh)*smoothstep(.2,0.,gd)*(.7+tw*3.)*(1.-lk);
      float vg=vein(vL)*(1.-lk);
      // угалз хээ: биеийг тойруулан хоёр давтагдана, ховилын ирмэг алтлаг гэрэлтэнэ
      vec2 ouv=vec2((-atan(vL.z,vL.x)/6.2832+.5)*ornRep, clamp((vL.y+1.18)/1.95,0.,1.));
      float om=smoothstep(-1.28,-1.12,vL.y)*(1.-smoothstep(.62,.8,vL.y))*(isBack>.5&&ornRep<1.5?.2:1.);
      float og=texture2D(orn,ouv).r*om, ob=(og-texture2D(orn,ouv+vec2(.0025,-.004)).r*om);
      float ogl=og*(1.-lk*.6);
      vec3 warm=mix(lite, vec3(1.,.78,.66), .6);
      if(isBack>.5){
        vec3 fire=vec3(env(refract(-V,N,.40)).r, env(refract(-V,N,.43)).g, env(refract(-V,N,.46)).b);
        vec3 body=mix(deep*1.05, C*1.2, .18+.5*hy) * (1.-rimD*.5);
        body=mix(body, mix(C,a2,.35)*1.2, smoothstep(.2,.9,hy)*.25);        // дээр нь бага зэрэг өөр туяа
        vec3 inR=env(reflect(-V,N));
        float lf=max(dot(N,normalize(vec3(-.5,.6,.65))),0.), lf2=max(dot(N,normalize(vec3(.7,.2,.5))),0.);
        body*= .45 + lf*.75 + lf2*.35;
        c = body*(.4+fh*1.)+ C*fire*.55 + au*.7 + inR*C*.35 + vec3(1.)*pow(max(dot(inR,vec3(.33)),0.),3.)*.12;
        c = mix(c, mix(lite,C,.5)*1.05, cloud*.14);
        c += mix(warm,C*1.4,.45)*heart*1.05 + mix(C,vec3(1.,.75,.65),.35)*halo2*.4;
        c += vec3(1.)*glit;
        c = mix(c, vec3(1.,.68,.22)*1.9, clamp(vg,0.,1.)*.85);
        c += C*(eglow*.35) + vec3(1.)*core*.12;
        c = mix(c, c*.45, ogl*.55);
        c += vec3(1.,.8,.45)*(max(ob,0.)*3.2 + ogl*.42) + C*max(-ob,0.)*.8;
        a = clamp(.66 + cloud*.08 + heart*.18 + glit*.3 + vg*.2 + rimD*.1, 0., .95);
        { float lu=dot(c,vec3(.3,.59,.11)); c=max(mix(vec3(lu),c,1.35),0.); }
        if(lk>.5){ c=mix(c, vec3(.55,.57,.62)*(.7+fh*.4), .7); a=.7; }
      } else {
        // ---- гадаргуу: тал бүр өөрөөр гялалзана, нарийн ирмэг, ойлт ----
        vec3 R=reflect(-V,N);
        float fr=.04+.96*pow(1.-max(dot(N,V),0.),5.);
        vec3 rf=env(R);
        float spec=pow(max(dot(R,normalize(vec3(-.4,.7,.6))),0.),40.)*2.6 + pow(max(dot(R,normalize(vec3(.7,.3,.6))),0.),80.)*3.2 + pow(max(dot(R,normalize(vec3(.1,-.3,.95))),0.),30.)*.9;
        float flash=pow(fh,6.)*.6*(.6+.4*sin(time*.9+fh*20.));
        c = rf*mix(vec3(1.),C*1.3+.15,.45)*(.06+fr*.8) + vec3(1.)*spec + C*.08 + vec3(1.)*core*.17 + mix(C,vec3(1.),.6)*eglow*.18 + vec3(1.)*flash*.22;
        c += vec3(1.,.74,.32)*vg*.55 + vec3(1.,.84,.55)*(ogl*.38 + max(ob,0.)*2.4);
        a = clamp(.02 + fr*.55 + spec*.35 + core*.32 + eglow*.12 + flash*.2 + vg*.3 + ogl*.22 + max(ob,0.)*.4, 0., .95);
        if(lk>.5){ c = mix(c, vec3(.82,.84,.88), .5); a = a*.7+.08; }
      }
      c = vec3(1.)-exp(-c*1.35);
      gl_FragColor=vec4(c,a);
    }`;
  /* ---------- сийлсэн угалз хээ ---------- */
  // Монгол угалз хээ: сийлбэрийн бүтэц (цагаан шугам = ховил)
  function drawOrnament(cv){
    const W=cv.width, H=cv.height, x=cv.getContext('2d');
    x.fillStyle='#000'; x.fillRect(0,0,W,H); x.strokeStyle='#fff'; x.fillStyle='#fff'; x.lineCap='round'; x.lineJoin='round';
    // угалз: логарифм мушгиа
    function spiral(cx,cy,r0,turns,dir,rot,lw){
      x.lineWidth=lw; x.beginPath();
      const N=120; for(let i=0;i<=N;i++){ const t=i/N, a=rot+dir*t*turns*Math.PI*2, r=r0*Math.pow(1-t,1.35)+r0*.06;
        const px=cx+Math.cos(a)*r, py=cy+Math.sin(a)*r; i?x.lineTo(px,py):x.moveTo(px,py); }
      x.stroke();
    }
    // эвэр угалз: хоёр тийш мушгирсан хос
    function horn(cx,cy,s,flip){
      const d=flip?-1:1;
      x.lineWidth=s*.06; x.beginPath(); x.moveTo(cx-s*.9,cy+s*.35*d); x.bezierCurveTo(cx-s*.45,cy-s*.55*d, cx+s*.45,cy-s*.55*d, cx+s*.9,cy+s*.35*d); x.stroke();
      spiral(cx-s*.9+s*.32, cy+s*.35*d-s*.02*d, s*.34, 1.55, -d, Math.PI*(d>0?0:1), s*.05);
      spiral(cx+s*.9-s*.32, cy+s*.35*d-s*.02*d, s*.34, 1.55, d, Math.PI*(d>0?1:0), s*.05);
      // дунд нь навч / дусал
      x.lineWidth=s*.045; x.beginPath(); x.moveTo(cx,cy-s*.42*d); x.quadraticCurveTo(cx+s*.16,cy-s*.15*d,cx,cy+s*.05*d); x.quadraticCurveTo(cx-s*.16,cy-s*.15*d,cx,cy-s*.42*d); x.stroke();
    }
    // үүлэн хээ
    function cloud(cx,cy,s){
      spiral(cx-s*.28,cy,s*.3,1.2,1,0,s*.06); spiral(cx+s*.28,cy,s*.3,1.2,-1,Math.PI,s*.06);
      x.lineWidth=s*.06; x.beginPath(); x.arc(cx,cy-s*.18,s*.22,Math.PI*1.05,Math.PI*1.95); x.stroke();
    }
    // алхан хээ (хүрээ)
    function meander(y0,h){
      const u=h/4; x.lineWidth=u*.55; x.beginPath(); let px=0; x.moveTo(0,y0+h);
      while(px<W+u*4){ x.lineTo(px,y0); x.lineTo(px+u*3,y0); x.lineTo(px+u*3,y0+u*2.4); x.lineTo(px+u*1.5,y0+u*2.4); x.lineTo(px+u*1.5,y0+u*1.2);
        x.moveTo(px+u*3,y0+u*2.4); x.lineTo(px+u*3,y0+h); x.lineTo(px+u*4.5,y0+h); px+=u*4.5; }
      x.stroke();
      x.lineWidth=u*.3; x.beginPath(); x.moveTo(0,y0-u*.8); x.lineTo(W,y0-u*.8); x.moveTo(0,y0+h+u*.8); x.lineTo(W,y0+h+u*.8); x.stroke();
    }
    meander(H*.06,H*.06); meander(H*.88,H*.06);
    const s=W/2.6;
    horn(W*.25,H*.34,s*.62,false); horn(W*.75,H*.34,s*.62,false);
    cloud(W*.5,H*.47,s*.5); cloud(W*0,H*.47,s*.5); cloud(W*1,H*.47,s*.5);
    horn(W*.25,H*.62,s*.62,true); horn(W*.75,H*.62,s*.62,true);
    // нарийн чимэглэл цэгүүд
    for(const [px,py] of [[.5,.25],[0,.25],[1,.25],[.5,.72],[0,.72],[1,.72]]){ x.beginPath(); x.arc(W*px,H*py,W*.018,0,Math.PI*2); x.fill(); }
  }
  let _orn=null;
  function ornTex(){
    if(_orn) return _orn;
    const cv=document.createElement('canvas'); cv.width=cv.height=1024; drawOrnament(cv);
    const b=document.createElement('canvas'); b.width=b.height=1024; const bx=b.getContext('2d'); bx.filter='blur(2.5px)'; bx.drawImage(cv,0,0);
    _orn=new THREE.CanvasTexture(b); _orn.wrapS=THREE.RepeatWrapping; _orn.wrapT=THREE.ClampToEdgeWrapping; _orn.anisotropy=4; return _orn;
  }

  /* ---------- чулуу бүрийн түүх: өөрийн бэлгэдэл, тоо, огноо, ар талд нь Багшийн бадам ба үг ---------- */
  const storyCache={}, storyKeys=[];
  async function storyTex(o){
    const key=[o.gid,o.date,o.locked?1:0,(o.quote&&o.quote.text)||'',o.title,((o.engrave&&o.engrave.lines)||[]).join('/')].join('|');
    if(storyCache[key]) return storyCache[key];
    try{ await document.fonts.ready; }catch(e){}
    const W=2048, H=1024, cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d');
    x.fillStyle='#000'; x.fillRect(0,0,W,H); x.strokeStyle='#fff'; x.fillStyle='#fff'; x.lineCap='round'; x.lineJoin='round';
    const spiral=(cx,cy,r0,turns,dir,rot,lw)=>{ x.lineWidth=lw; x.beginPath(); for(let i=0;i<=90;i++){ const t=i/90, a=rot+dir*t*turns*Math.PI*2, r=r0*Math.pow(1-t,1.35)+r0*.06; const px=cx+Math.cos(a)*r, py=cy+Math.sin(a)*r; i?x.lineTo(px,py):x.moveTo(px,py); } x.stroke(); };
    const scroll=(cx,cy,s,d)=>{ x.lineWidth=s*.05; x.beginPath(); x.moveTo(cx-s*.9,cy+s*.35*d); x.bezierCurveTo(cx-s*.45,cy-s*.55*d,cx+s*.45,cy-s*.55*d,cx+s*.9,cy+s*.35*d); x.stroke();
      spiral(cx-s*.58,cy+s*.33*d,s*.32,1.5,-d,d>0?0:Math.PI,s*.045); spiral(cx+s*.58,cy+s*.33*d,s*.32,1.5,d,d>0?Math.PI:0,s*.045); };
    const ring=(cx,cy,r,lw)=>{ x.lineWidth=lw; x.beginPath(); x.arc(cx,cy,r,0,Math.PI*2); x.stroke(); };
    const beads=(cx,cy,r,n,br)=>{ for(let i=0;i<n;i++){ const a=-Math.PI/2+i/n*Math.PI*2; x.beginPath(); x.arc(cx+Math.cos(a)*r, cy+Math.sin(a)*r, br, 0, Math.PI*2); x.fill(); } };
    // ---- дээд хүрээ: шагналын төрлөөр ----
    const sec=o.sec||'', y0=70, bh=70;
    x.lineWidth=5; x.beginPath(); x.moveTo(0,y0-22); x.lineTo(W,y0-22); x.moveTo(0,y0+bh+22); x.lineTo(W,y0+bh+22); x.stroke();
    if(sec==='streak'){ for(let px=30;px<W;px+=70){ x.lineWidth=7; x.beginPath(); x.ellipse(px,y0+bh/2,32,20,0,0,Math.PI*2); x.stroke(); } }          // тасралтгүй гинж
    else if(sec==='month'){ for(let i=0,px=60;px<W;px+=128,i++){ const ph=i%8; x.beginPath(); x.arc(px,y0+bh/2,28,0,Math.PI*2); x.lineWidth=4; x.stroke();      // сарны хувьсал
        if(ph){ x.save(); x.beginPath(); x.arc(px,y0+bh/2,28,0,Math.PI*2); x.clip(); x.fillRect(px-28+ (ph<4?56-ph*14:0), y0+bh/2-28, ph<4?ph*14:(8-ph)*14+ (ph===4?56:0), 56); x.restore(); } } }
    else if(sec==='hours'){ for(let px=20;px<W;px+=34){ x.beginPath(); x.arc(px,y0+bh/2,11,0,Math.PI*2); x.fill(); } x.lineWidth=3; x.beginPath(); x.moveTo(0,y0+bh/2); x.lineTo(W,y0+bh/2); x.stroke(); }  // эрих
    else if(sec==='duty'){ x.lineWidth=6; x.beginPath(); x.moveTo(0,y0+bh); for(let px=0;px<W;px+=120){ x.lineTo(px+40,y0+8); x.lineTo(px+70,y0+38); x.lineTo(px+90,y0+20); x.lineTo(px+120,y0+bh); } x.stroke(); }   // уулс
    else { const u=bh/4; x.lineWidth=u*.5; x.beginPath(); let px=0; x.moveTo(0,y0+bh); while(px<W+u*5){ x.lineTo(px,y0); x.lineTo(px+u*3,y0); x.lineTo(px+u*3,y0+u*2.4); x.lineTo(px+u*1.5,y0+u*2.4); x.lineTo(px+u*1.5,y0+u*1.2); x.moveTo(px+u*3,y0+u*2.4); x.lineTo(px+u*3,y0+bh); x.lineTo(px+u*4.5,y0+bh); px+=u*4.5; } x.stroke(); }  // алхан хээ
    // гадаргуу дээр нарийсч харагдахгүйн тулд хэвтээ чиглэлд K дахин өргөн зурна
    const K=1.7, S=.85, inK=(cx,cy,s,fn)=>{ x.save(); x.translate(cx,cy); x.scale(K*s,s); x.translate(-cx,-cy); fn(); x.restore(); };
    const txt=(t,cx,y,font,maxW)=>{ x.save(); x.translate(cx,0); x.scale(K,1); x.font=font; x.textAlign='center'; x.fillText(t,0,y,maxW); x.restore(); };
    // ---- урд тал: медаль, бэлгэдэл, тоогоор эрих ----
    const fx=W*.25, fy=450;
    const n=o.count?Math.min(108,Math.max(3,o.count>36?108:o.count)):27;
    const im=o.svg?await svgImg(o.svg):null;
    inK(fx,fy,S,()=>{ ring(fx,fy,250,7); ring(fx,fy,196,4); beads(fx,fy,223,n,n>60?6:n>30?8:11);
      if(im) x.drawImage(im, fx-170, fy-170, 340, 340);
      else if(o.num!=null){ x.textAlign='center'; x.font='600 190px Cormorant, Georgia, serif'; x.fillText(String(o.num),fx,fy+62); } });
    // хоёр талын заагт угалз
    [0,W/2,W].forEach(cx=>{ inK(cx,0,1,()=>{ scroll(cx,330,70,1); scroll(cx,560,70,-1); }); });
    // ---- ар тал: Багшийн бадамлянхуа, гэрлийн туяа ----
    const bx=W*.75, by=400;
    inK(bx,by,S,()=>{
      x.lineWidth=4; for(let i=0;i<15;i++){ const a=-Math.PI+i/14*Math.PI; x.beginPath(); x.moveTo(bx+Math.cos(a)*150,by-20+Math.sin(a)*150); x.lineTo(bx+Math.cos(a)*240,by-20+Math.sin(a)*240); x.stroke(); }
      x.lineWidth=7; const petal=(ang,len,wid)=>{ x.save(); x.translate(bx,by+90); x.rotate(ang); x.beginPath(); x.moveTo(0,0); x.bezierCurveTo(wid,-len*.35,wid*.6,-len*.8,0,-len); x.bezierCurveTo(-wid*.6,-len*.8,-wid,-len*.35,0,0); x.stroke(); x.restore(); };
      petal(0,230,70); petal(-.55,200,66); petal(.55,200,66); petal(-1.05,160,58); petal(1.05,160,58);
      x.lineWidth=6; x.beginPath(); x.moveTo(bx-200,by+98); x.quadraticCurveTo(bx,by+150,bx+200,by+98); x.stroke(); });
    // Багшийн үг (хэрэглэгчийн өөрийн хадгалсан үгнээс)
    const q=o.quote&&o.quote.text?o.quote.text:(o.desc||'');
    if(q){ const qf='italic 500 40px Cormorant, Georgia, serif'; x.font=qf;
      const words=q.replace(/\s+/g,' ').trim().split(' '), lines=[]; let ln='';
      for(const w of words){ const t=ln?ln+' '+w:w; if(x.measureText(t).width>520 && ln){ lines.push(ln); ln=w; } else ln=t; } if(ln) lines.push(ln);
      const L=lines.slice(0,4); if(lines.length>4) L[3]=L[3].replace(/\s*\S+$/,'')+' …';
      L.forEach((l,i)=>txt(l,bx,600+i*50,qf,560));
      if(o.quote&&o.quote.src) txt('— '+o.quote.src,bx,600+L.length*50+10,'500 28px Manrope, system-ui, sans-serif',560); }
    // ---- доод бичээс: нэр, огноо, хичнээн хүчин чармайлт гаргаж авсан нь ----
    const line=[o.title||'', o.date?String(o.date).replace(/-/g,'.'):''].filter(Boolean).join('  ·  ');
    if(line) txt(line, fx, 730, '600 50px Cormorant, Georgia, serif', 570);
    const eff=((o.engrave&&o.engrave.lines)||[]).filter(l=>!/^(Хүртсэн|Earned)/.test(l)).slice(0,2);
    eff.forEach((l,i)=>txt(l, fx, 788+i*44, '500 34px Manrope, system-ui, sans-serif', 570));
    x.lineWidth=5; x.beginPath(); x.moveTo(0,870); x.lineTo(W,870); x.moveTo(0,935); x.lineTo(W,935); x.stroke();
    for(let px=0;px<W;px+=48){ x.beginPath(); x.moveTo(px,902); x.lineTo(px+24,880); x.lineTo(px+48,902); x.lineTo(px+24,925); x.closePath(); x.stroke(); }
    const b=document.createElement('canvas'); b.width=W; b.height=H; const bx2=b.getContext('2d'); bx2.filter='blur(2.2px)'; bx2.drawImage(cv,0,0);
    const t=new THREE.CanvasTexture(b); t.wrapS=THREE.RepeatWrapping; t.anisotropy=4;
    storyCache[key]=t; storyKeys.push(key); if(storyKeys.length>8){ const k=storyKeys.shift(); storyCache[k].dispose(); delete storyCache[k]; }
    return t;
  }
  const gemMats=[], TIME={value:0};
  function gemMat(P, locked, back, ph){
    const m=new THREE.ShaderMaterial({vertexShader:GVS, fragmentShader:GFS, transparent:true, depthWrite:back, side:back?THREE.BackSide:THREE.FrontSide,
      extensions:{derivatives:true},
      uniforms:{orn:{value:ornTex()}, ornRep:{value:2.}, col:{value:new THREE.Color(P.c)}, deep:{value:new THREE.Color(P.e)}, lite:{value:new THREE.Color(P.c).lerp(new THREE.Color(P.f),.6).multiplyScalar(1.15)}, time:TIME, phase:{value:ph||0}, a1:{value:new THREE.Color(P.a[0])}, a2:{value:new THREE.Color(P.a[1])}, a3:{value:new THREE.Color(P.a[2])}, isBack:{value:back?1:0}, locked:{value:locked?1:0}}});
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
  function pulseHalo(gr,s){ const h=gr.userData.halo; if(!h) return; const k=.5+.5*Math.sin(s*.75+h.userData.ph); h.material.opacity=.15+.12*k; const sc=h.userData.base||(h.userData.base=h.scale.x), f=.93+.1*k; h.scale.set(sc*f, sc*1.4*f, 1); }
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
    if(!o.mini && o.gid && o.engrave){ try{ const st=await storyTex(o); [back,front].forEach(m=>{ m.material.uniforms.orn.value=st; m.material.uniforms.ornRep.value=1.; }); }catch(e){ console.log('storyErr', e && e.message); } }
    if(o.engrave){
      // болор дотор лазераар сийлсэн мэт бичээс (ар талаас харагдана)
      const eng=new THREE.Mesh(new THREE.PlaneGeometry(.78,1.56), new THREE.MeshBasicMaterial({map:engraveTex(o.engrave), transparent:true, depthWrite:false, opacity:o.locked?.6:.95}));
      eng.position.z=-.03; eng.rotation.y=Math.PI; eng.renderOrder=2; grp.add(eng);
    }
    // чулууны өөрийнх нь хэлбэрийг дагасан гэрлийн аура (ард асаасан гэрэл биш)
    let halo=null;
    if(!o.mini && !o.locked){
      halo=new THREE.Sprite(new THREE.SpriteMaterial({map:haloTex(), color:new THREE.Color(P.c).lerp(new THREE.Color(0xffb89a),.2), transparent:true, opacity:.3, blending:THREE.AdditiveBlending, depthWrite:false}));
      halo.scale.set(2.,2.9,1); halo.position.set(0,-.1,0); halo.renderOrder=0; halo.userData={ph:o.phase||0, base:2.2}; grp.add(halo);
    }
    grp.userData={back,front,glyph,glow,halo,gc:new THREE.Color(o.locked?0x777777:P.c).lerp(new THREE.Color(P.a[1]),.25)};
    if(o.fuse && !o.mini && !o.locked) addFuse(grp, o.fuse, P);
    return grp;
  }
  /* ---------- Чулууны нэгдэл: шат ахих тусам эх чулуу том, гэрэлтэй болж, хээт бүс, цагираг, оч нэмэгдэнэ ---------- */
  let _fxDot=null;
  function fxDot(){ if(_fxDot) return _fxDot; const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'), g=x.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.3,'rgba(255,255,255,.5)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); return (_fxDot=new THREE.CanvasTexture(c)); }
  function heeTex(t){ const W=1024,H=128,c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d');
    x.clearRect(0,0,W,H); x.strokeStyle='#fff'; x.lineCap='round'; x.lineJoin='round'; x.lineWidth=4; const n=8, cw=W/n, draw=window.FuseHee&&window.FuseHee.draw;
    if(draw) for(let i=0;i<n;i++) draw(x,t-1,(i+.5)*cw,H/2,cw*.8,H*.8);
    x.lineWidth=2; x.beginPath(); x.moveTo(0,4); x.lineTo(W,4); x.moveTo(0,H-4); x.lineTo(W,H-4); x.stroke();
    const tx=new THREE.CanvasTexture(c); tx.wrapS=THREE.RepeatWrapping; return tx; }
  function fusePath(t,u,R0){ const th=u*Math.PI*2;
    if(t<=1) return [Math.cos(th)*R0,0,Math.sin(th)*R0];
    if(t>=7){ const k=th*3, rr=R0*(.55+.45*((u*3)%1)); return [Math.cos(k)*rr,Math.sin(th*3)*.2,Math.sin(k)*rr]; }
    const k=t+1, rr=R0*(.72+.28*Math.cos(k*th)); return [Math.cos(th)*rr,Math.sin(k*th)*.14,Math.sin(th)*rr]; }
  // Шатны бэлгэдэлт хээг эх чулууны сийлбэрт шингээнэ: хүрээ хэвээр, дунд нь тухайн шатны хээ, дээр доор нь өмнөх шатных
  const _fOrn={};
  function fuseOrnTex(t){
    if(_fOrn[t]) return _fOrn[t];
    const cv=document.createElement('canvas'); cv.width=cv.height=1024; drawOrnament(cv);
    const W=1024,H=1024,x=cv.getContext('2d'), draw=window.FuseHee&&window.FuseHee.draw;
    x.fillStyle='#000'; x.fillRect(0,H*.155,W,H*.69);
    x.strokeStyle='#fff'; x.fillStyle='#fff'; x.lineCap='round'; x.lineJoin='round';
    if(draw){
      x.lineWidth=11; for(let i=0;i<2;i++) draw(x,t-1,(i+.5)*W/2,H*.47,W*.36,H*.3);
      if(t>=2){ x.lineWidth=6; for(let i=0;i<4;i++) draw(x,t-2,(i+.5)*W/4,H*.24,W*.17,H*.12); }
      if(t>=3){ x.lineWidth=6; for(let i=0;i<4;i++) draw(x,t-3,(i+.5)*W/4,H*.715,W*.17,H*.12); }
      x.lineWidth=4; x.beginPath(); for(const y of [.175,.305,.635,.79]){ x.moveTo(0,H*y); x.lineTo(W,H*y); } x.stroke();
    }
    const b=document.createElement('canvas'); b.width=b.height=1024; const bx=b.getContext('2d'); bx.filter='blur(2.5px)'; bx.drawImage(cv,0,0);
    const tx=new THREE.CanvasTexture(b); tx.wrapS=THREE.RepeatWrapping; tx.wrapT=THREE.ClampToEdgeWrapping; tx.anisotropy=4; return (_fOrn[t]=tx);
  }
  function addFuse(grp, f, P){
    const t=Math.max(1,Math.min(7,f.tier||1)), fx=new THREE.Group(), add=m=>{ m.renderOrder=4; fx.add(m); return m; };
    const AB=THREE.AdditiveBlending, col=new THREE.Color(P.c), gold=new THREE.Color(0xffd98a);
    // сийлбэр: эх чулууны угалзны оронд шатны хээ
    try{ const ot=fuseOrnTex(t); [grp.userData.back,grp.userData.front].forEach(m=>{ m.material.uniforms.orn.value=ot; m.material.uniforms.ornRep.value=2.; }); }catch(e){}
    grp.userData.glow.material.opacity=.03+.012*t;
    // нарийн алтан цагираг: 3-р шатаас нэг, 5-р шатаас хоёр
    const ringM=new THREE.MeshBasicMaterial({color:gold, transparent:true, opacity:.55, blending:AB, depthWrite:false});
    if(t>=3){ const r=add(new THREE.Mesh(new THREE.TorusGeometry(.98,.006,6,160), ringM)); r.rotation.x=Math.PI/2.15; r.position.y=-.05; fx.userData.r1=r; }
    if(t>=5){ const r=add(new THREE.Mesh(new THREE.TorusGeometry(1.12,.005,6,180), ringM)); r.rotation.set(Math.PI/2.6,0,.35); fx.userData.r2=r; }
    // 4-р шатнаас лянхуан суурь: чулуу дэлбээн дунд суусан мэт; 6-р шатнаас хоёр давхар дэлбээ
    if(t>=4){ const c=document.createElement('canvas'); c.width=128; c.height=256; const x=c.getContext('2d');
      const g=x.createLinearGradient(0,256,0,0); g.addColorStop(0,'rgba(255,255,255,.95)'); g.addColorStop(.55,'rgba(255,244,214,.7)'); g.addColorStop(1,'rgba(255,236,190,.15)');
      x.fillStyle=g; x.beginPath(); x.moveTo(64,252); x.bezierCurveTo(4,190,10,70,64,4); x.bezierCurveTo(118,70,124,190,64,252); x.fill();
      x.strokeStyle='rgba(255,255,255,.9)'; x.lineWidth=3; x.stroke(); x.lineWidth=2; x.beginPath(); x.moveTo(64,240); x.lineTo(64,40); x.stroke();
      const ptx=new THREE.CanvasTexture(c), pm=new THREE.MeshBasicMaterial({map:ptx, color:col.clone().lerp(new THREE.Color(0xffffff),.15), transparent:true, opacity:.5, blending:AB, depthWrite:false, side:THREE.DoubleSide});
      const lotus=new THREE.Group();
      const layer=(n,len,wid,tilt,rad,off,y)=>{ for(let i=0;i<n;i++){ const a=(i+off)/n*Math.PI*2, geo=new THREE.PlaneGeometry(wid,len); geo.translate(0,len/2,0);
          const p=new THREE.Mesh(geo,pm); p.position.set(Math.cos(a)*rad,y,Math.sin(a)*rad); p.rotation.order='YXZ'; p.rotation.y=-a+Math.PI/2; p.rotation.x=-tilt; p.renderOrder=4; lotus.add(p); } };
      layer(8,.75,.36,1.28,.62,0,-1.36);
      if(t>=6) layer(8,.62,.3,1.05,.5,.5,-1.33);
      if(t>=7) layer(10,.9,.32,1.45,.75,.25,-1.4);
      fx.add(lotus); fx.userData.lotus=lotus; }
    // 6-р шатнаас эргэн тойрон зөөлөн гэрлийн хүрээ
    if(t>=6){ const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d'), g=x.createRadialGradient(128,128,40,128,128,128);
      g.addColorStop(0,'rgba(255,230,170,0)'); g.addColorStop(.62,'rgba(255,225,160,.22)'); g.addColorStop(.7,'rgba(255,240,200,.05)'); g.addColorStop(1,'rgba(255,230,170,0)'); x.fillStyle=g; x.fillRect(0,0,256,256);
      const s=add(new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c), transparent:true, opacity:.9, blending:AB, depthWrite:false}))); s.scale.set(3.2,3.6,1); s.position.z=-.35; fx.userData.aura=s; }
    // 7-р шат: солонгон туяа
    if(t>=7){ const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
      for(let r=128;r>60;r-=2){ x.strokeStyle=`hsla(${(128-r)*5.2},90%,70%,${.22*(1-Math.abs(r-94)/34)})`; x.lineWidth=2.5; x.beginPath(); x.arc(128,128,r,0,7); x.stroke(); }
      const rb=add(new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c), transparent:true, opacity:.85, blending:AB, depthWrite:false}))); rb.scale.set(3.4,3.9,1); rb.position.z=-.4; }
    // титэм: 5-аар нэгтгэсэн бол таван гэрэл, 7-р шатанд гурван гэрэл орой дээр
    if(t>=7 || f.crown){ const n=f.crown?5:3; for(let i=0;i<n;i++){ const s=add(new THREE.Sprite(new THREE.SpriteMaterial({map:fxDot(), color:gold, transparent:true, opacity:.9, blending:AB, depthWrite:false}))); const a=(i-(n-1)/2)*.38; s.position.set(Math.sin(a)*.32,1.18+Math.cos(a)*.08,.05); s.scale.setScalar(.14); } }
    // оч: шат бүрт өөр замаар эргэнэ
    const N=4+t*4, R0=1.0+.05*t, pg=new THREE.BufferGeometry(), pa=new Float32Array(N*3); pg.setAttribute('position',new THREE.BufferAttribute(pa,3));
    add(new THREE.Points(pg,new THREE.PointsMaterial({map:fxDot(), color:0xfff0c0, size:.07+.006*t, transparent:true, blending:AB, depthWrite:false})));
    const lp=[]; for(let i=0;i<=240;i++) lp.push(new THREE.Vector3(...fusePath(t,i/240,R0)));
    add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(lp), new THREE.LineBasicMaterial({color:gold, transparent:true, opacity:.14, blending:AB, depthWrite:false})));
    fx.userData.sp={pa,pg,N,R0,t}; fx.rotation.x=.18;
    grp.add(fx); grp.userData.fx=fx; grp.userData.fscale=1+.025*(t-1)+(f.crown?.015:0);
  }
  function fuseFrame(g,s){ const fx=g.userData.fx; if(!fx) return; const d=fx.userData, sp=d.sp;
    for(let i=0;i<sp.N;i++) sp.pa.set(fusePath(sp.t,((i/sp.N)+s*(.03+.004*sp.t))%1,sp.R0),i*3); sp.pg.attributes.position.needsUpdate=true;
    if(d.lotus) d.lotus.rotation.y=s*.08; if(d.r1) d.r1.rotation.z=s*.12; if(d.r2) d.r2.rotation.z=-s*.2; if(d.aura) d.aura.material.opacity=.7+.25*Math.sin(s*1.1); }
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
  let ry=0, rx=0, vy=0, drag=null, target=0, spin=0, born=0, zoom=1, zoomT=1, full=false, panX=0, panY=0, lastTap=0, homeHost=null;
  const ZMAX=()=>full?9:3.2, ZMIN=()=>full?.6:.8;
  function starTex(){ const cv=document.createElement('canvas'); cv.width=cv.height=64; const x=cv.getContext('2d'); const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.2,'rgba(255,248,220,.6)'); g.addColorStop(1,'rgba(255,240,200,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); x.fillStyle='rgba(255,255,255,.9)'; x.fillRect(31,4,2,56); x.fillRect(4,31,56,2); return new THREE.CanvasTexture(cv); }
  function initBig(){
    if(R) return true;
    try{
      const cv=document.createElement('canvas'); cv.className='gemcv';
      R=new THREE.WebGLRenderer({canvas:cv, antialias:true, alpha:true}); R.setPixelRatio(Math.min(window.__lite?1.5:2.5, window.devicePixelRatio||1)); R.outputEncoding=THREE.sRGBEncoding; R.toneMapping=THREE.ACESFilmicToneMapping; R.toneMappingExposure=1.05; R.setClearColor(0,0);
      env=envFor(R); sc=new THREE.Scene(); dl=lights(sc); cam=new THREE.PerspectiveCamera(30,1,.1,50); cam.position.set(0,.12,6.4); bsh=shadow(); sc.add(bsh);
      const st=starTex();
      // ид шидийн гялбаа: чулуун дээрх одон гялбаа, эргэн тойрны од, дээш хөвөх гэрэлт тоос
      const dot=haloTex(), lite=!!window.__lite;
      for(let i=0;i<(lite?10:18);i++){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:st, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, opacity:0}));
        s.position.set((Math.random()-.5)*.62, (Math.random()-.5)*2.3, .55); s.userData={k:'glint', p:Math.random()*20, sp:.35+Math.random()*.9, sz:.08+Math.random()*.11, rot:(Math.random()-.5)*.6}; s.renderOrder=6; sc.add(s); sparks.push(s); }
      for(let i=0;i<(lite?8:16);i++){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:st, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, opacity:0}));
        const a=Math.random()*Math.PI*2, r=.75+Math.random()*.45; s.position.set(Math.cos(a)*r*.75, Math.sin(a)*r*1.5, (Math.random()-.5)*.8); s.userData={k:'star', p:Math.random()*20, sp:.4+Math.random()*.8, sz:.07+Math.random()*.1, rot:0}; s.renderOrder=6; sc.add(s); sparks.push(s); }
      // хайрын зөөлөн долгион: дулаан гэрэл чулуунаас аажуухан цацарна
      for(let i=0;i<3;i++){ const w=new THREE.Sprite(new THREE.SpriteMaterial({map:dot, color:0xffb89a, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, opacity:0}));
        w.position.set(0,-.08,-.4); w.userData={k:'wave', p:i/3}; w.renderOrder=0; sc.add(w); sparks.push(w); }
      for(let i=0;i<(lite?14:34);i++){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:dot, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, opacity:0}));
        s.position.set((Math.random()-.5)*1.7, -1.7+Math.random()*3.4, (Math.random()-.5)*1.2); s.userData={k:'dust', p:Math.random()*20, sp:.08+Math.random()*.16, sz:.025+Math.random()*.045, sw:Math.random()*6}; s.renderOrder=5; sc.add(s); sparks.push(s); }
      const cvs=R.domElement;
      // нэг хуруу: эргүүлэх · хоёр хуруу: томруулах / жижигрүүлэх
      const pts=new Map(); let pinch=null;
      const dist=()=>{ const v=[...pts.values()]; return Math.hypot(v[0].x-v[1].x, v[0].y-v[1].y); };
      const mid=()=>{ const v=[...pts.values()]; return {x:(v[0].x+v[1].x)/2, y:(v[0].y+v[1].y)/2}; };
      cvs.addEventListener('pointerdown', e=>{ pts.set(e.pointerId,{x:e.clientX,y:e.clientY}); try{ cvs.setPointerCapture(e.pointerId); }catch(_){} e.stopPropagation();
        if(pts.size===2){ const m=mid(); pinch={d:dist(), z:zoomT, mx:m.x, my:m.y}; if(drag) drag.moved=99; return; }
        if(pts.size===1){ drag={x:e.clientX,y:e.clientY,lx:e.clientX,ly:e.clientY,t:performance.now(),moved:0}; vy=0; } });
      cvs.addEventListener('pointermove', e=>{ if(!pts.has(e.pointerId)) return; pts.set(e.pointerId,{x:e.clientX,y:e.clientY}); e.stopPropagation();
        if(pinch && pts.size>=2){ zoomT=Math.max(ZMIN(),Math.min(ZMAX(), pinch.z*dist()/pinch.d));
          if(full){ const m=mid(), k=.0042/Math.max(1,zoom); panX-=(m.x-pinch.mx)*k; panY+=(m.y-pinch.my)*k; pinch.mx=m.x; pinch.my=m.y; clampPan(); }
          return; }
        if(!drag) return; const dx=e.clientX-drag.lx, dy=e.clientY-drag.ly; drag.lx=e.clientX; drag.ly=e.clientY; drag.moved+=Math.abs(dx)+Math.abs(dy);
        ry+=dx*.012/Math.sqrt(zoom); rx=Math.max(-.7,Math.min(.7,rx+dy*.008/Math.sqrt(zoom))); vy=dx*.012/Math.sqrt(zoom); });
      const up=e=>{ pts.delete(e.pointerId); e&&e.stopPropagation();
        if(pinch){ if(pts.size<2) pinch=null; if(!pts.size){ drag=null; if(!full) zoomT=1; } return; }
        if(!drag) return;
        if(drag.moved<8){
          if(full){ const now=performance.now(); if(now-lastTap<320){ zoomT=zoomT>1.6?.92:3.5; panX=panY=0; lastTap=0; } else lastTap=now; }   // хоёр товшиход ойртоно / холдоно
          else { target=Math.round(ry/Math.PI)*Math.PI+Math.PI; vy=0; }
        } else { target=null; vy=Math.max(-.25,Math.min(.25,vy)); }
        drag=null; if(!pts.size && !full) zoomT=1; };
      cvs.addEventListener('pointerup', up); cvs.addEventListener('pointercancel', up);
      cvs.addEventListener('wheel', e=>{ e.preventDefault(); zoomT=Math.max(ZMIN(),Math.min(ZMAX(), zoomT*(e.deltaY<0?1.1:.91))); }, {passive:false});
      cvs.addEventListener('click', e=>e.stopPropagation());
      return true;
    }catch(e){ R=null; return false; }
  }
  function frame(t){
    raf=requestAnimationFrame(frame);
    if(!cur) return;
    if(host && host.clientWidth && (host.clientWidth!==R.domElement._w || host.clientHeight!==R.domElement._h)) size();
    const s=t/1000;
    if(spin>0){ const k=Math.min(1,(t-born)/1800), e=1-Math.pow(1-k,3); ry=-Math.PI*4*(1-e); cur.scale.setScalar((.35+.65*e)*(cur.userData.fscale||1)); if(k>=1){ spin=0; target=0; } }
    else if(!drag){
      if(target===null){ ry+=vy; vy*=.9; if(Math.abs(vy)<.01){ target=Math.round(ry/(2*Math.PI))*2*Math.PI; } }
      else { const sway=Math.sin(s*.7)*.22; ry+=(target+sway-ry)*.06; }
      rx+=(Math.sin(s*.5)*.08-rx)*.07;
    }
    zoom+=(zoomT-zoom)*.18; cam.position.set(panX, .12+panY, 6.4/zoom); bsh.visible=zoom<1.4;
    if(!full && (panX||panY)){ panX*=.8; panY*=.8; if(Math.abs(panX)+Math.abs(panY)<.001) panX=panY=0; }
    cur.rotation.set(rx, ry, 0); cur.position.y=floatY(s,0); { const h=cur.position.y+.15; bsh.scale.set(1-h*.9,1-h*.9,1); bsh.material.opacity=.75-h*1.4; bsh.material.color.copy(cur.userData.gc); }
    dl.position.set(Math.cos(s*.4)*3, 3, Math.sin(s*.4)*3+2);
    pulseHalo(cur,s); fuseFrame(cur,s);
    const u=cur.userData; if(u.glyph) u.glyph.material.opacity=u.glyph.userData.base*(.82+.18*Math.sin(s*1.7));
    const dt=Math.min(.05, s-(frame.ls||s)); frame.ls=s; const sh=1/Math.max(1,zoom*.8);
    sparks.forEach(sp=>{ const d=sp.userData, m=sp.material;
      if(d.k==='wave'){
        const ph=(s/5.5+d.p)%1, e=Math.sin(ph*Math.PI);
        m.opacity=(cur&&!cur.userData.locked)?e*e*.32*sh:0; const sz=1.2+ph*3.;
        sp.scale.set(sz, sz*1.35, 1); return;
      }
      if(d.k==='dust'){
        sp.position.y+=dt*d.sp; sp.position.x+=Math.sin(s*.6+d.sw)*dt*.04;
        if(sp.position.y>1.8){ sp.position.y=-1.7; sp.position.x=(Math.random()-.5)*1.7; }
        const edge=Math.min(1,(1.8-sp.position.y)*1.5, (sp.position.y+1.7)*1.5);
        m.opacity=(cur&&!cur.userData.locked)?edge*(.35+.35*Math.sin(s*2.+d.p))*sh:0; sp.scale.setScalar(d.sz);
      } else {
        const v=Math.pow(Math.max(0,Math.sin(s*d.sp+d.p)), d.k==='glint'?16:8);
        m.opacity=(cur&&!cur.userData.locked)?v*(d.k==='glint'?.6:.65)*sh:0; m.rotation=d.rot+s*.25;
        sp.scale.setScalar(d.sz*(.3+v*1.3));
      }
    });
    TIME.value=s;
    R.render(sc,cam);
  }
  function size(){ if(!host||!R) return; const w=host.clientWidth||260, h=host.clientHeight||w; R.domElement._w=host.clientWidth; R.domElement._h=host.clientHeight; R.setSize(w,h,false); R.domElement.style.width=w+'px'; R.domElement.style.height=h+'px'; if(cam){ cam.aspect=w/h; cam.updateProjectionMatrix(); } }
  function clampPan(){ const L=1.6; panX=Math.max(-L,Math.min(L,panX)); panY=Math.max(-L,Math.min(L,panY)); }
  /* Дэлгэц дүүрэн харах: хоёр хуруугаар томруулж, чулууны дотор руу орно */
  function fullOn(){
    if(!R||!cur||full) return;
    let ov=document.getElementById('gemFull');
    if(!ov){ ov=document.createElement('div'); ov.id='gemFull';
      ov.innerHTML='<div class="gfStage"></div><button class="gfX" aria-label="close">✕</button><div class="gfHint"></div>';
      document.body.appendChild(ov);
      ov.querySelector('.gfX').onclick=e=>{ e.stopPropagation(); fullOff(); }; }
    ov.querySelector('.gfHint').textContent=(window.tr?tr('Хоёр хуруугаар томруулж дотор нь ороорой · хоёр товшвол ойртоно','Pinch to zoom inside · double-tap to zoom'):'');
    homeHost=host; full=true; ov.hidden=false; requestAnimationFrame(()=>ov.classList.add('on'));
    host=ov.querySelector('.gfStage'); host.appendChild(R.domElement); size(); zoomT=.92;
  }
  function fullOff(){
    const ov=document.getElementById('gemFull'); if(!full) return; full=false; zoomT=1; panX=panY=0;
    if(ov){ ov.classList.remove('on'); setTimeout(()=>{ ov.hidden=true; },250); }
    if(homeHost){ host=homeHost; host.appendChild(R.domElement); } size();
  }
  async function show(el, o, celebrate){
    if(!initBig()) return false;
    hide(true); host=el; el.innerHTML=''; el.appendChild(R.domElement); size();
    const g=await build(o, env); if(host!==el){ return true; }
    g.userData.locked=!!o.locked; g.userData.glyph.userData.base=g.userData.glyph.material.opacity;
    if(g.userData.halo){ g.userData.halo.userData.base=1.95; }
    cur=g; sc.add(g); zoom=zoomT=1;
    { const tint=new THREE.Color(g.userData.gc).lerp(new THREE.Color(0xffd2b8),.6), warm=new THREE.Color(g.userData.gc).lerp(new THREE.Color(0xffb08a),.65);
      sparks.forEach(sp=>sp.material.color.copy(sp.userData.k==='glint'?new THREE.Color(0xfff6ee):sp.userData.k==='wave'?warm:tint)); } rx=.1; vy=0; drag=null; target=0;
    if(celebrate){ spin=1; born=performance.now(); } else { ry=-.9; spin=0; cur.scale.setScalar(g.userData.fscale||1); }
    if(!raf) raf=requestAnimationFrame(frame);
    return true;
  }
  function flip(){ if(!cur) return; target=Math.round(ry/Math.PI)*Math.PI+Math.PI; }
  function hide(keep){
    if(full && !keep) fullOff();
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
  return {_story:storyTex, thumb, show, hide, flip, live, liveStop, livePause, orbit, fullOn, fullOff, isFull:()=>full};
})();
