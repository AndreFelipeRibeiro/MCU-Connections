// SVG connection layer drawn over the card grid

function ConnectionLayer({ visibleTitles, positions, hoveredTitle, hoveredCharacter, onHoverConnection, hoveredConnection }) {
  if (!positions || Object.keys(positions).length === 0) return null;

  // Compute pairs: for each character that appears in 2+ visible titles, draw lines between consecutive title pairs
  const pairs = [];
  const visIds = new Set(visibleTitles.map(t => t.id));
  const charToTitles = {};

  visibleTitles.forEach(t => {
    t.cast.forEach(c => {
      if (!charToTitles[c]) charToTitles[c] = [];
      charToTitles[c].push(t.id);
    });
  });

  // To avoid an unreadable spaghetti graph, only draw lines for characters
  // appearing in 2-8 visible titles, and connect each title to the next one (chain).
  // Skip ultra-common cast (>8) — they'd dominate the canvas.
  const pairKey = (a, b, ch) => `${a}|${b}|${ch}`;
  const seen = new Set();

  Object.entries(charToTitles).forEach(([ch, ids]) => {
    if (ids.length < 2) return;
    // sort by chronological release among visible titles
    const ordered = ids
      .map(id => visibleTitles.find(t => t.id === id))
      .sort((a, b) => a.release.localeCompare(b.release))
      .map(t => t.id);
    for (let i = 0; i < ordered.length - 1; i++) {
      const a = ordered[i], b = ordered[i + 1];
      const k = pairKey(a, b, ch);
      if (seen.has(k)) continue;
      seen.add(k);
      pairs.push({ a, b, character: ch });
    }
  });

  // Group pairs by (a,b) to combine multi-character connections (rendered as multiple parallel curves)
  const grouped = {};
  pairs.forEach(p => {
    const k = p.a + '__' + p.b;
    if (!grouped[k]) grouped[k] = { a: p.a, b: p.b, characters: [] };
    grouped[k].characters.push(p.character);
  });

  const connections = Object.values(grouped);

  function bezierPath(p1, p2, offset = 0) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    const sag = Math.min(80, 20 + dist * 0.18);
    // perpendicular offset for parallel curves
    const nx = -dy / (dist || 1);
    const ny = dx / (dist || 1);
    const ox = nx * offset, oy = ny * offset;
    const c1x = p1.x + dx * 0.3 + ox;
    const c1y = p1.y + sag + oy;
    const c2x = p1.x + dx * 0.7 + ox;
    const c2y = p2.y + sag + oy;
    return `M ${p1.x} ${p1.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }

  return (
    <svg className="connection-layer" style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex: 5}}>
      <defs>
        <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {connections.map(conn => {
        const p1 = positions[conn.a];
        const p2 = positions[conn.b];
        if (!p1 || !p2) return null;
        const isHovered = hoveredConnection && hoveredConnection.a === conn.a && hoveredConnection.b === conn.b;
        const involvesHoveredTitle = hoveredTitle && (hoveredTitle === conn.a || hoveredTitle === conn.b);
        const involvesHoveredChar = hoveredCharacter && conn.characters.includes(hoveredCharacter);
        const dimmed = (hoveredTitle || hoveredCharacter || hoveredConnection) && !isHovered && !involvesHoveredTitle && !involvesHoveredChar;
        const emphasized = isHovered || involvesHoveredTitle || involvesHoveredChar;

        return conn.characters.map((ch, i) => {
          const charObj = window.CHARACTERS[ch];
          if (!charObj) return null;
          const offsetIdx = i - (conn.characters.length - 1) / 2;
          const offset = offsetIdx * 4;
          const baseOpacity = dimmed ? 0.04 : (emphasized ? 0.95 : 0.32);
          const strokeW = emphasized ? 2.2 : 1.1;
          return (
            <path
              key={ch + i}
              d={bezierPath(p1, p2, offset)}
              fill="none"
              stroke={charObj.color}
              strokeWidth={strokeW}
              opacity={baseOpacity}
              filter={emphasized ? 'url(#line-glow)' : undefined}
              style={{transition:'opacity 220ms, stroke-width 220ms'}}
              pointerEvents="stroke"
              onMouseEnter={(e) => onHoverConnection({ a: conn.a, b: conn.b, characters: conn.characters, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => onHoverConnection(null)}
            />
          );
        });
      })}
      <style>{`.connection-layer path { pointer-events: stroke; }`}</style>
    </svg>
  );
}

window.ConnectionLayer = ConnectionLayer;
