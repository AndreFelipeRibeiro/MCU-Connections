// Abstract original poster art — no Marvel imagery, just stylized geometric compositions
// Generates a deterministic SVG per title from its accent color and title hash

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function darken(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.max(0, Math.floor(r * (1 - amt)));
  g = Math.max(0, Math.floor(g * (1 - amt)));
  b = Math.max(0, Math.floor(b * (1 - amt)));
  return `rgb(${r},${g},${b})`;
}

function lighten(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.min(255, Math.floor(r + (255 - r) * amt));
  g = Math.min(255, Math.floor(g + (255 - g) * amt));
  b = Math.min(255, Math.floor(b + (255 - b) * amt));
  return `rgb(${r},${g},${b})`;
}

// 6 abstract poster styles, picked deterministically per title
function PosterArt({ title }) {
  // If media metadata loaded and we have a real poster URL, render an image
  const media = window.MEDIA;
  const local = media && media.local_posters && media.local_posters[title.id];
  const path = media && media.posters && media.posters[title.id];
  if (local || path) {
    const url = window.mediaURL ? window.mediaURL('p', title.id, local || (media.poster_base + path)) : (local || (media.poster_base + path));
    return (
      <div className="poster-image-wrap" style={{width:'100%', height:'100%', position:'relative', background:'#0a0c14'}}>
        <img src={url} alt={title.title} loading="lazy" style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}}/>
      </div>
    );
  }
  // Fallback to abstract generated art
  const h = hashCode(title.id);
  const variant = h % 6;
  const accent = title.accent;
  const dark = darken(accent, 0.55);
  const mid = darken(accent, 0.25);
  const light = lighten(accent, 0.3);
  const W = 200, H = 280;
  const gid = 'g_' + title.id.replace(/[^a-z0-9]/gi, '');

  const initial = title.title.split(/[: ]/)[0].slice(0, 1).toUpperCase();
  const phaseRoman = ['I','II','III','IV','V','VI'][title.phase - 1];

  let art;
  if (variant === 0) {
    // concentric rings
    art = (
      <g>
        {[0,1,2,3,4].map(i => (
          <circle key={i} cx={W/2} cy={H*0.42} r={20 + i*22} fill="none" stroke={accent} strokeWidth={1.2} opacity={0.18 + i*0.12}/>
        ))}
        <circle cx={W/2} cy={H*0.42} r={14} fill={light}/>
      </g>
    );
  } else if (variant === 1) {
    // diagonal beams
    art = (
      <g>
        {[0,1,2,3,4,5].map(i => (
          <polygon key={i} points={`0,${i*40} ${W},${i*40 - 60} ${W},${i*40 - 40} 0,${i*40 + 20}`} fill={accent} opacity={0.08 + (i%2)*0.1}/>
        ))}
        <circle cx={W*0.7} cy={H*0.35} r={42} fill={dark} stroke={light} strokeWidth={1.5}/>
      </g>
    );
  } else if (variant === 2) {
    // shattered grid
    art = (
      <g>
        {Array.from({length: 14}).map((_, i) => {
          const r = ((h + i*97) % 100) / 100;
          const x = (i % 5) * 40 + 4;
          const y = Math.floor(i / 5) * 50 + 20;
          return <rect key={i} x={x} y={y} width={36 + r*4} height={42} fill={accent} opacity={0.05 + r*0.25} transform={`rotate(${(r-0.5)*8} ${x+18} ${y+20})`}/>;
        })}
      </g>
    );
  } else if (variant === 3) {
    // city skyline silhouette
    art = (
      <g>
        <rect x="0" y="0" width={W} height={H*0.55} fill={`url(#${gid}_sky)`}/>
        <circle cx={W*0.75} cy={H*0.3} r={28} fill={light} opacity={0.85}/>
        {Array.from({length: 18}).map((_, i) => {
          const bh = 30 + ((h + i*47) % 80);
          return <rect key={i} x={i*12} y={H*0.55 - bh} width={11} height={bh + H*0.5} fill={dark}/>;
        })}
      </g>
    );
  } else if (variant === 4) {
    // radial burst
    art = (
      <g>
        {Array.from({length: 24}).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const x2 = W/2 + Math.cos(a) * 200;
          const y2 = H*0.42 + Math.sin(a) * 200;
          return <line key={i} x1={W/2} y1={H*0.42} x2={x2} y2={y2} stroke={accent} strokeWidth={1} opacity={0.15 + (i%3)*0.08}/>;
        })}
        <circle cx={W/2} cy={H*0.42} r={36} fill={dark} stroke={light} strokeWidth={2}/>
      </g>
    );
  } else {
    // stacked horizontal bands
    art = (
      <g>
        {[0,1,2,3,4,5,6,7].map(i => (
          <rect key={i} x="0" y={i*22 + 30} width={W} height={14} fill={accent} opacity={0.08 + ((h+i)%5)*0.06}/>
        ))}
        <polygon points={`${W/2},40 ${W*0.78},${H*0.38} ${W/2},${H*0.55} ${W*0.22},${H*0.38}`} fill={light} opacity="0.85"/>
      </g>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <defs>
        <linearGradient id={`${gid}_bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={dark}/>
          <stop offset="100%" stopColor="#0a0c14"/>
        </linearGradient>
        <linearGradient id={`${gid}_sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={mid}/>
          <stop offset="100%" stopColor={dark}/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill={`url(#${gid}_bg)`}/>
      {art}
      {/* big initial */}
      <text x={W/2} y={H*0.78} textAnchor="middle" fontFamily="'Bebas Neue', Impact, sans-serif" fontSize="120" fill={light} opacity="0.18" letterSpacing="-4">{initial}</text>
      {/* phase roman numeral */}
      <text x={W - 10} y={H - 12} textAnchor="end" fontFamily="'JetBrains Mono', monospace" fontSize="10" fill={light} opacity="0.55" letterSpacing="2">PHASE {phaseRoman}</text>
      <rect x="0" y="0" width={W} height={H} fill="none" stroke={light} strokeOpacity="0.08" strokeWidth="1"/>
    </svg>
  );
}

window.PosterArt = PosterArt;
