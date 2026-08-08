const { useState: mUseState } = React;

const MPHASE_COLORS = { 1:'#d4a05a', 2:'#4a8de8', 3:'#d04040', 4:'#a05cd0', 5:'#5fa856', 6:'#c8384a' };
const MPHASE_LABELS = { 1:'PHASE 1', 2:'PHASE 2', 3:'PHASE 3', 4:'PHASE 4', 5:'PHASE 5', 6:'PHASE 6' };
const SORT_TABS = [['release','Release','▤'],['chrono','Chrono','⇄'],['phase','Phase','◫'],['imdb','IMDb','★'],['rt','RT','◉']];
const VIEW_MODES = [['grid','Grid','▦'],['list','List','☰'],['spatial','Spatial','◈']];

function ScoreBadges({ title, lead, compact }) {
  const imdb = title.imdb != null ? <div className="m-sc imdb" key="i"><span className="tg">IMDb</span>{title.imdb.toFixed(1)}</div> : null;
  const rt = title.rt != null ? <div className="m-sc rt" key="r"><span className="tg">RT</span>{title.rt}%</div> : null;
  if (!imdb && !rt) return <div className={`m-scores${compact?' compact':''}`}><div className="m-sc none">Not yet rated</div></div>;
  return <div className={`m-scores${compact?' compact':''}`}>{lead === 'rt' ? [rt, imdb] : [imdb, rt]}</div>;
}

function MobileTopBar({ viewMode, setViewMode, search, setSearch, onOpenFilters, filterCount, showing, total, sortLabel }) {
  return (
    <div className="m-appbar">
      <div className="m-appbar-top">
        <div className="m-brandrow">
          <div className="m-mark"/>
          <div>
            <div className="m-btitle">MCU Connections</div>
            <div className="m-bsub">{showing === total ? `${total} titles` : `${showing} of ${total}`} · {sortLabel}</div>
          </div>
        </div>
        <div className="m-viewswitch">
          {VIEW_MODES.map(([v,l,ic]) => (
            <button key={v} className={viewMode===v?'on':''} onClick={()=>setViewMode(v)} aria-label={l} title={l}>
              <span className="vi">{ic}</span><span className="vl">{l}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="m-searchrow">
        <div className="m-searchbar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search titles…"/>
          {search && <button className="m-clear" onClick={()=>setSearch('')} aria-label="Clear search">×</button>}
        </div>
        <button className={`m-fpill${filterCount?' act':''}`} onClick={onOpenFilters}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M6 12h12M10 18h4"/></svg>
          Filters{filterCount ? <span className="m-fcount">{filterCount}</span> : null}
        </button>
      </div>
    </div>
  );
}

function SortTabs({ sort, setSort }) {
  return (
    <nav className="m-tabs">
      <div className="m-tabs-lab">Sort by</div>
      {SORT_TABS.map(([v,l,ic])=>(
        <button key={v} className={`m-tab${sort===v?' on':''}`} onClick={()=>setSort(v)}>
          <span className="ti">{ic}</span>{l}
        </button>
      ))}
    </nav>
  );
}

function MobileGrid({ titles, onSelect }) {
  const PosterArt = window.PosterArt;
  if (!titles.length) return <EmptyState/>;
  return (
    <div className="m-scrollarea">
      <div className="m-grid">
        {titles.map(t => (
          <button key={t.id} className="m-card" onClick={()=>onSelect(t.id)}>
            <div className="m-pw">
              <PosterArt title={t}/>
              <span className="m-pbadge" style={{background:MPHASE_COLORS[t.phase]}}>PH {t.phase}</span>
              <ScoreBadges title={t} compact/>
            </div>
            <div className="m-cmeta">
              <div className="m-ctitle">{t.title}</div>
              <div className="m-cyear">
                <span>{t.year}</span>
                {t.budget != null && <b>${t.budget < 1 ? t.budget : Math.round(t.budget)}M</b>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MobileList({ titles, sort, onSelect }) {
  const PosterArt = window.PosterArt;
  if (!titles.length) return <EmptyState/>;
  const ranked = sort === 'imdb' || sort === 'rt';
  const lead = sort === 'rt' ? 'rt' : 'imdb';
  // Group headers for the non-score sorts
  const groups = [];
  if (sort === 'release' || sort === 'chrono') {
    titles.forEach(t => {
      const key = String(t.year);
      const last = groups[groups.length-1];
      if (last && last.label === key) last.items.push(t);
      else groups.push({ key: key + '#' + groups.length, label: key, items: [t] });
    });
  } else if (sort === 'phase') {
    titles.forEach(t => {
      const key = String(t.phase);
      const last = groups[groups.length-1];
      if (last && last.key.startsWith('p' + key + '#')) last.items.push(t);
      else groups.push({ key: 'p' + key + '#' + groups.length, label: MPHASE_LABELS[t.phase], color: MPHASE_COLORS[t.phase], items: [t] });
    });
  } else {
    groups.push({ key: 'all', label: null, items: titles });
  }
  let n = 0;
  return (
    <div className="m-scrollarea">
      {groups.map(g => (
        <div className="m-group" key={g.key}>
          {g.label && <div className="m-glabel" style={g.color?{color:g.color}:null}>{g.label}</div>}
          <div className="m-list">
            {g.items.map(t => {
              n += 1;
              const score = lead === 'rt' ? t.rt : (t.imdb != null ? t.imdb * 10 : null);
              return (
                <button key={t.id} className="m-lrow" onClick={()=>onSelect(t.id)}>
                  {ranked && <div className="m-rank">{n}</div>}
                  <div className="m-lthumb"><PosterArt title={t}/></div>
                  <div className="m-ltext">
                    <div className="m-ltitle">{t.title}</div>
                    <div className="m-lmeta">
                      {!ranked && <span>{t.type.toUpperCase()}</span>}
                      {ranked && <span>{t.year}</span>}
                      <span className="m-dot"/>
                      <span style={{color:MPHASE_COLORS[t.phase]}}>{MPHASE_LABELS[t.phase]}</span>
                      {t.budget != null && <><span className="m-dot"/><span>${t.budget < 1 ? t.budget : Math.round(t.budget)}M</span></>}
                    </div>
                    {ranked && score != null && (
                      <div className="m-barw"><div className="m-barf" style={{width:score+'%', background: lead==='rt' ? '#fa320a' : '#f5c518'}}/></div>
                    )}
                  </div>
                  <ScoreBadges title={t} lead={lead}/>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="m-empty">
      <div className="m-empty-mark">◍</div>
      <div className="m-empty-t">No titles match</div>
      <div className="m-empty-s">Try clearing a filter or the search box.</div>
    </div>
  );
}

function Sheet({ children, onClose, tall }) {
  return (
    <>
      <div className="m-scrim" onClick={onClose}/>
      <div className={`m-sheet${tall?' tall':''}`}>
        <button className="m-grab" onClick={onClose} aria-label="Close"/>
        <div className="m-sheet-body">{children}</div>
      </div>
    </>
  );
}

function FilterSheet({ phaseFilter, setPhaseFilter, typeFilter, setTypeFilter, budgetFilter, setBudgetFilter, sort, setSort, onClose, showing, onClear }) {
  return (
    <Sheet onClose={onClose} tall>
      <div className="m-sh-head">
        <div className="m-sh-title">Filters</div>
        <button className="m-sh-clear" onClick={onClear}>Clear all</button>
      </div>
      <div className="m-fgroup">
        <div className="m-flab">Phase</div>
        <div className="m-chips">
          {['all','1','2','3','4','5','6'].map(p=>(
            <button key={p} className={`m-chip ph${phaseFilter===p?' on':''}`} onClick={()=>setPhaseFilter(p)}
              style={p!=='all' && phaseFilter===p ? {background:MPHASE_COLORS[p], borderColor:MPHASE_COLORS[p], color:'#0a0c14'} : null}>
              {p==='all'?'All':p}
            </button>
          ))}
        </div>
      </div>
      <div className="m-fgroup">
        <div className="m-flab">Type</div>
        <div className="m-chips">
          {[['all','All'],['film','Films'],['series','Series']].map(([v,l])=>(
            <button key={v} className={`m-chip${typeFilter===v?' on':''}`} onClick={()=>setTypeFilter(v)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="m-fgroup">
        <div className="m-flab">Budget</div>
        <div className="m-chips">
          {[['all','All'],['low','<$50M'],['mid','$50–200M'],['high','$200–300M'],['mega','$300M+']].map(([v,l])=>(
            <button key={v} className={`m-chip${budgetFilter===v?' on':''}`} onClick={()=>setBudgetFilter(v)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="m-fgroup">
        <div className="m-flab">Also sort</div>
        <div className="m-chips">
          <button className={`m-chip${sort==='title'?' on':''}`} onClick={()=>setSort('title')}>A–Z</button>
        </div>
      </div>
      <button className="m-apply" onClick={onClose}>Show {showing} {showing === 1 ? 'title' : 'titles'}</button>
    </Sheet>
  );
}

function CastSheet({ title, onClose, onCharacterClick, activeChar, onGoSpatial, inSpatial }) {
  if (!title) return null;
  const PosterArt = window.PosterArt;
  return (
    <Sheet onClose={onClose} tall>
      <div className="m-cast-hero">
        <div className="m-hero-th"><PosterArt title={title}/></div>
        <div className="m-hero-text">
          <div className="m-eyebrow" style={{color:MPHASE_COLORS[title.phase]}}>{MPHASE_LABELS[title.phase]} · {title.type.toUpperCase()} · {title.year}</div>
          <h2 className="m-dtitle">{title.title}</h2>
          <ScoreBadges title={title}/>
        </div>
      </div>
      <div className="m-flab">Featured cast · {title.cast.length}</div>
      <div className="m-castlist">
        {title.cast.length === 0 && <div className="m-empty-cast">No major recurring cast tracked.</div>}
        {title.cast.map(ch => {
          const c = window.CHARACTERS[ch];
          if (!c) return null;
          return (
            <button key={ch} className={`m-crow${activeChar===ch?' on':''}`} onClick={()=>onCharacterClick(ch)}>
              <div className="m-port" style={{background:`linear-gradient(135deg, ${c.color}, ${c.color}88)`}}>
                {window.MEDIA && window.MEDIA.actors && window.MEDIA.actors[ch]
                  ? <img src={window.mediaURL ? window.mediaURL('a', ch, window.MEDIA.profile_base + window.MEDIA.actors[ch]) : window.MEDIA.profile_base + window.MEDIA.actors[ch]} alt={c.name} loading="lazy"/>
                  : <span>{c.initials}</span>}
              </div>
              <div className="m-ctext">
                <div className="m-cn">{c.name}</div>
                <div className="m-an">{c.actor}</div>
              </div>
              <span className="m-cdot" style={{background:c.color}}/>
            </button>
          );
        })}
      </div>
      {!inSpatial && (
        <button className="m-apply ghost" onClick={onGoSpatial}>◈ See connections in Spatial</button>
      )}
    </Sheet>
  );
}

// Unscaled overlay that "pops" the focused card out of the zoomed canvas so it stays legible
function FocusPop({ title, x, y, onOpenCast }) {
  if (!title) return null;
  const PosterArt = window.PosterArt;
  return (
    <button className="m-focuspop" style={{left:x+'px', top:y+'px'}} onClick={onOpenCast}>
      <div className="m-fp-poster">
        <PosterArt title={title}/>
        <span className="m-pbadge" style={{background:MPHASE_COLORS[title.phase]}}>PH {title.phase}</span>
      </div>
      <div className="m-fp-meta">
        <div className="m-fp-title">{title.title}</div>
        <ScoreBadges title={title}/>
        <div className="m-fp-cta">Tap for cast ›</div>
      </div>
    </button>
  );
}

function SpatialHint({ focused, sharedCount }) {
  return (
    <div className="m-ghint">
      {focused
        ? <span><b>{sharedCount}</b> shared {sharedCount === 1 ? 'character' : 'characters'} · tap background to clear</span>
        : <span>Tap a title to focus · pinch to zoom · double-tap to zoom in</span>}
    </div>
  );
}

Object.assign(window, { MobileTopBar, SortTabs, MobileGrid, MobileList, FilterSheet, CastSheet, FocusPop, SpatialHint, ScoreBadges, Sheet, EmptyState });
