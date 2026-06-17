// Side-panel form editor for content.yaml.
//
// State model: the editor holds a `content` object in memory that mirrors
// content.json. Edits update this object immediately, the preview re-renders
// from it (not from disk). Save writes content.yaml back to disk; the page
// suppresses its own auto-reload for one tick after saving.

const E = React.createElement;

// ── Small UI atoms ─────────────────────────────────────────────

function Field({ label, help, children, error }) {
  return (
    <label style={{ display: 'block', marginBottom: 16 }}>
      <div style={{
        fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
        fontWeight: 600, color: error ? '#c0392b' : '#9a8f78', marginBottom: 6,
      }}>{label}</div>
      {children}
      {help && <div style={{ fontSize: 11, color: '#666', marginTop: 5, lineHeight: 1.4 }}>{help}</div>}
      {error && <div style={{ fontSize: 11, color: '#c0392b', marginTop: 5 }}>{error}</div>}
    </label>
  );
}

// Small inline counter — sits below a Field's input. Stays muted while you
// have room, turns Sindoor red the moment you cross the platform limit.
function LimitCounter({ current, max, unit, overLabel }) {
  const over = current > max;
  return (
    <div style={{
      fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600,
      color: over ? '#c0392b' : '#6f6957', marginTop: 6,
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    }}>
      <span>{current.toLocaleString()} / {max.toLocaleString()} {unit}</span>
      {over && overLabel && <span>{overLabel}</span>}
    </div>
  );
}

const inputBase = {
  width: '100%', boxSizing: 'border-box', font: '13px/1.5 "DM Sans", system-ui',
  background: '#0f0f0f', color: '#E8DCC8', border: '1px solid #2c2c2c',
  padding: '9px 11px', borderRadius: 0, outline: 'none',
};

function TextInput({ value, onChange, placeholder }) {
  return <input type="text" value={value ?? ''} placeholder={placeholder || ''}
    onChange={e => onChange(e.target.value)} style={inputBase}
    onFocus={e => e.target.style.borderColor = '#C0392B'}
    onBlur={e => e.target.style.borderColor = '#2c2c2c'} />;
}

function TextArea({ value, onChange, placeholder, rows = 4 }) {
  return <textarea value={value ?? ''} placeholder={placeholder || ''} rows={rows}
    onChange={e => onChange(e.target.value)}
    style={{ ...inputBase, resize: 'vertical', fontFamily: '"DM Sans", system-ui' }}
    onFocus={e => e.target.style.borderColor = '#C0392B'}
    onBlur={e => e.target.style.borderColor = '#2c2c2c'} />;
}

function NumberInput({ value, onChange, step, placeholder }) {
  return <input type="number" value={value ?? ''} placeholder={placeholder || ''} step={step || 1}
    onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
    style={inputBase}
    onFocus={e => e.target.style.borderColor = '#C0392B'}
    onBlur={e => e.target.style.borderColor = '#2c2c2c'} />;
}

function BoolInput({ value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)} style={{
      width: '100%', textAlign: 'left', padding: '9px 11px',
      background: value ? '#C0392B' : '#0f0f0f',
      color: value ? '#fff' : '#888',
      border: `1px solid ${value ? '#C0392B' : '#2c2c2c'}`,
      font: '12px "DM Sans", system-ui', letterSpacing: 1.5, textTransform: 'uppercase',
      fontWeight: 600, cursor: 'pointer',
    }}>{value ? 'On' : 'Off'}</button>
  );
}

function SelectInput({ value, onChange, options }) {
  return (
    <select value={value ?? ''} onChange={e => onChange(e.target.value)}
      style={{ ...inputBase, font: '13px "DM Sans", system-ui', cursor: 'pointer' }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ── Image upload field ─────────────────────────────────────────

function ImageInput({ value, onChange, slideIndex, fieldKey }) {
  const [busy, setBusy] = React.useState(false);
  const [bgBusy, setBgBusy] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const inputRef = React.useRef(null);

  const upload = async (file) => {
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const r = await fetch('api/upload', { method: 'POST', body: form });
      if (!r.ok) throw new Error(await r.text());
      const { filename } = await r.json();
      onChange(filename);
    } catch (e) {
      setErr(String(e.message || e));
    } finally { setBusy(false); }
  };

  const removeBg = async () => {
    if (!value || typeof value !== 'string') return;
    setBgBusy(true); setErr(null);
    try {
      const r = await fetch('api/remove-bg', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: value }),
      });
      if (!r.ok) throw new Error(await r.text());
      const { filename } = await r.json();
      onChange(filename);
    } catch (e) {
      setErr(String(e.message || e));
    } finally { setBgBusy(false); }
  };

  const onDrop = e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) upload(f);
  };

  const isUrl = typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
  const previewSrc = !value ? null : isUrl ? value : `images/${value}`;

  return (
    <div onDragOver={e => e.preventDefault()} onDrop={onDrop}
      style={{ border: '1px dashed #3a3a3a', padding: 10, position: 'relative' }}>
      {previewSrc && (
        <div style={{ marginBottom: 10 }}>
          <img src={previewSrc} style={{ maxWidth: '100%', maxHeight: 160, display: 'block', objectFit: 'cover' }} />
          <div style={{ fontSize: 11, color: '#666', marginTop: 4, wordBreak: 'break-all' }}>{value}</div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
          style={{ ...inputBase, padding: '8px 12px', cursor: 'pointer', flex: 1, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: 11 }}>
          {busy ? 'Uploading…' : (value ? 'Replace file' : 'Choose / drop file')}
        </button>
        {value && !isUrl && (
          <button type="button" onClick={removeBg} disabled={bgBusy}
            title="Run rembg to produce a transparent-background copy"
            style={{ ...inputBase, padding: '8px 12px', cursor: bgBusy ? 'wait' : 'pointer', width: 'auto', color: '#E8DCC8', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
            {bgBusy ? 'Removing…' : 'Remove BG'}
          </button>
        )}
        {value && (
          <button type="button" onClick={() => onChange(undefined)}
            style={{ ...inputBase, padding: '8px 12px', cursor: 'pointer', width: 'auto', color: '#888' }}>
            ✕
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <input type="text" value={isUrl ? value : ''} placeholder="…or paste a URL"
          onChange={e => onChange(e.target.value)} style={{ ...inputBase, padding: '7px 10px', fontSize: 12 }} />
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => upload(e.target.files[0])} />
      {err && <div style={{ fontSize: 11, color: '#c0392b', marginTop: 6 }}>{err}</div>}
    </div>
  );
}

// ── Image-position XY sliders ─────────────────────────────────
// The underlying value is a CSS object-position string ("35% 50%"). Sliders
// parse/serialize transparently. Legacy values like "center 35%" or bare "25"
// load correctly; the next save canonicalizes them.

const _POSITION_KEYWORDS = { left: 0, center: 50, right: 100, top: 0, bottom: 100 };

function _parsePosition(str) {
  if (str == null || str === '') return { x: 50, y: 50 };
  const parse = (s, fallback) => {
    if (s == null) return fallback;
    const k = String(s).toLowerCase();
    if (k in _POSITION_KEYWORDS) return _POSITION_KEYWORDS[k];
    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : fallback;
  };
  const parts = String(str).trim().split(/\s+/);
  if (parts.length === 1) return { x: parse(parts[0], 50), y: 50 };
  return { x: parse(parts[0], 50), y: parse(parts[1], 50) };
}

function _stringifyPosition(x, y) {
  const fmt = n => {
    const v = Number.isFinite(n) ? Math.round(n * 10) / 10 : 50;
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  };
  return `${fmt(x)}% ${fmt(y)}%`;
}

function ImagePositionInput({ value, onChange }) {
  const { x, y } = _parsePosition(value);
  const setX = v => onChange(_stringifyPosition(v, y));
  const setY = v => onChange(_stringifyPosition(x, v));
  const reset = () => onChange(undefined);
  const sliderStyle = { flex: 1, accentColor: '#C0392B', height: 18 };
  const lblStyle = { width: 14, fontSize: 11, color: '#9a8f78', textAlign: 'center', fontWeight: 600, letterSpacing: 1 };
  const valStyle = { width: 42, fontSize: 11, color: '#9a8f78', fontFamily: '"JetBrains Mono", monospace', textAlign: 'right' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={lblStyle}>X</span>
        <input type="range" min="0" max="100" step="1" value={x}
               onChange={e => setX(Number(e.target.value))} style={sliderStyle} />
        <span style={valStyle}>{Math.round(x)}%</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={lblStyle}>Y</span>
        <input type="range" min="0" max="100" step="1" value={y}
               onChange={e => setY(Number(e.target.value))} style={sliderStyle} />
        <span style={valStyle}>{Math.round(y)}%</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
        <input type="text" value={value ?? ''} placeholder="35% 50%"
               onChange={e => onChange(e.target.value || undefined)}
               style={{ ...inputBase, flex: 1, padding: '6px 9px', fontSize: 11, fontFamily: '"JetBrains Mono", monospace' }} />
        <button type="button" onClick={reset}
                title="Reset to default (center)"
                style={{ ...btnSm, padding: '6px 10px' }}>↺</button>
      </div>
    </div>
  );
}

// ── Array field (stats, items, handles) ───────────────────────

function ArrayInput({ value, onChange, item }) {
  const rows = Array.isArray(value) ? value : [];
  const update = (i, key, v) => {
    const next = rows.map((r, j) => j === i ? { ...r, [key]: v } : r);
    onChange(next);
  };
  const add = () => onChange([...rows, {}]);
  const remove = i => onChange(rows.filter((_, j) => j !== i));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const next = rows.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      {rows.map((row, i) => (
        <div key={i} style={{
          background: '#101010', border: '1px solid #2c2c2c', padding: 10, marginBottom: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#C0392B', fontWeight: 600 }}>
              Row {i + 1}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                style={btnSm}>↑</button>
              <button type="button" onClick={() => move(i, +1)} disabled={i === rows.length - 1}
                style={btnSm}>↓</button>
              <button type="button" onClick={() => remove(i)} style={{ ...btnSm, color: '#c0392b' }}>✕</button>
            </div>
          </div>
          {item.fields.map(f => (
            <Field key={f.key} label={f.label} help={f.help}>
              <FieldInput field={f} value={row[f.key]} onChange={v => update(i, f.key, v)} />
            </Field>
          ))}
        </div>
      ))}
      <button type="button" onClick={add} style={{ ...btnSm, width: '100%', padding: '8px 0' }}>+ Add row</button>
    </div>
  );
}

const btnSm = {
  background: '#1a1a1a', color: '#888', border: '1px solid #2c2c2c',
  font: '11px "JetBrains Mono", monospace', padding: '4px 8px', cursor: 'pointer',
  letterSpacing: 1, textTransform: 'uppercase',
};

// ── Field dispatcher ──────────────────────────────────────────

function FieldInput({ field, value, onChange, slideIndex }) {
  switch (field.type) {
    case 'text':     return <TextInput value={value} onChange={onChange} />;
    case 'textarea': return <TextArea value={value} onChange={onChange} rows={field.rows || 4} />;
    case 'number':   return <NumberInput value={value} onChange={onChange} step={field.step} />;
    case 'bool':     return <BoolInput value={value} onChange={onChange} />;
    case 'select':   return <SelectInput value={value} onChange={onChange} options={field.options} />;
    case 'image':    return <ImageInput value={value} onChange={onChange} slideIndex={slideIndex} fieldKey={field.key} />;
    case 'image-position': return <ImagePositionInput value={value} onChange={onChange} />;
    case 'array':    return <ArrayInput value={value} onChange={onChange} item={field.item} />;
    default:         return <TextInput value={value} onChange={onChange} />;
  }
}

// ── Layout picker modal ───────────────────────────────────────
// Tiny CSS schematics of each layout. They hint at structure (where the image
// sits, where the headline goes, etc.) without rendering the real React
// component at thumbnail scale. The modal is opened from SlideForm via a small
// "Browse" button next to the Layout select.

// Native aspect ratio per layout. Most are 4:5 (carousel portrait); standalone
// formats have their own native dimensions.
const LAYOUT_ASPECT = {
  'reel-title':        9/16,
  'quote-card':        1,
  'youtube-thumbnail': 16/9,
  'end-card':          16/9,
};

// Per-layout palette token. The schematic uses these for fg/muted/divider.
function _schemaTokens(layout) {
  if (layout === 'interior-light') {
    return { bg: '#FAF5EE', fg: '#1a1a1a', muted: 'rgba(26,26,26,0.45)', div: 'rgba(26,26,26,0.25)' };
  }
  if (layout === 'cta-red') {
    return { bg: '#C0392B', fg: '#fff', muted: 'rgba(255,255,255,0.55)', div: 'rgba(255,255,255,0.35)' };
  }
  return { bg: '#0d0d0d', fg: 'rgba(232,220,200,0.85)', muted: 'rgba(232,220,200,0.4)', div: 'rgba(232,220,200,0.22)' };
}

// Drawing primitives. All coordinates are percentages of the parent.
const RED = '#C0392B';
const bar  = (k, x, y, w, h, color, extra) => <div key={k} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, background: color, ...(extra || {}) }} />;
const line = (k, x, y, w, color, extra) => bar(k, x, y, w, 1.2, color, extra);

// Headline block — 2 short Bebas-like bars stacked.
function _headlineBlock(x, y, w, color, key='h') {
  return [
    bar(key+'a', x, y,      w * 0.86, 7, color),
    bar(key+'b', x, y + 9,  w * 0.62, 7, color),
  ];
}
// Body block — 3 thin DM-Sans-like lines.
function _bodyBlock(x, y, w, color, key='b') {
  return [
    line(key+'a', x, y,     w * 0.92, color),
    line(key+'b', x, y + 4, w * 0.88, color),
    line(key+'c', x, y + 8, w * 0.65, color),
  ];
}
// Red eyebrow line.
function _eyebrow(x, y, w, key='e') {
  return [
    line(key+'1', x, y, 6,   RED),
    line(key+'2', x + 8, y, w - 8, 'rgba(192,57,43,0.55)'),
  ];
}
// Red divider hard-stop.
function _divider(x, y, key='d') {
  return bar(key, x, y, 5, 0.8, RED);
}

function _schematicFor(layout) {
  const tok = _schemaTokens(layout);
  switch (layout) {
    case 'cover': return <>
      {_eyebrow(7, 7, 30)}
      {_divider(7, 32)}
      {_headlineBlock(7, 36, 86, tok.fg)}
      {bar('m', 7, 86, 50, 1.2, tok.muted)}
    </>;
    case 'story': return <>
      {bar('img', 0, 0, 100, 60, '#222')}
      {bar('grad', 0, 50, 100, 50, 'linear-gradient(180deg, transparent 0%, #0d0d0d 75%)')}
      {_divider(7, 66)}
      {_headlineBlock(7, 70, 80, tok.fg)}
      {_bodyBlock(7, 86, 86, tok.muted)}
    </>;
    case 'split-story': return <>
      {bar('img', 0, 0, 100, 100, '#222')}
      {_divider(7, 12)}
      {_headlineBlock(7, 15, 70, tok.fg)}
      {_bodyBlock(7, 78, 86, tok.fg)}
    </>;
    case 'quote': return <>
      {_divider(7, 8)}
      {_headlineBlock(7, 12, 70, tok.fg)}
      {bar('qbar', 7, 42, 1.2, 28, RED)}
      {bar('q1', 11, 45, 65, 5, tok.fg)}
      {bar('q2', 11, 53, 55, 5, tok.fg)}
      {bar('q3', 11, 61, 40, 5, tok.fg)}
      {bar('att', 11, 70, 25, 2, tok.muted)}
      {_bodyBlock(7, 80, 86, tok.muted)}
    </>;
    case 'stat': return <>
      {_divider(7, 8)}
      {_headlineBlock(7, 12, 80, tok.fg)}
      {bar('s1', 7, 42, 30, 22, tok.fg)}
      {bar('div', 49, 42, 0.6, 22, tok.div)}
      {bar('s2', 55, 42, 30, 22, RED)}
      {_bodyBlock(7, 75, 86, tok.muted)}
    </>;
    case 'dates-grid': return <>
      {_divider(7, 8)}
      {_headlineBlock(7, 12, 70, tok.fg)}
      {bar('top1', 7, 44, 38, 0.5, tok.div)}
      {bar('d1d', 7, 46, 12, 4, RED)}
      {bar('d1b', 7, 52, 32, 2, tok.muted)}
      {bar('d1b2', 7, 56, 28, 2, tok.muted)}
      {bar('top2', 53, 44, 38, 0.5, tok.div)}
      {bar('d2d', 53, 46, 12, 4, RED)}
      {bar('d2b', 53, 52, 32, 2, tok.muted)}
      {bar('d2b2', 53, 56, 28, 2, tok.muted)}
      {bar('top3', 7, 68, 38, 0.5, tok.div)}
      {bar('d3d', 7, 70, 12, 4, RED)}
      {bar('d3b', 7, 76, 32, 2, tok.muted)}
      {bar('top4', 53, 68, 38, 0.5, tok.div)}
      {bar('d4d', 53, 70, 12, 4, RED)}
      {bar('d4b', 53, 76, 32, 2, tok.muted)}
    </>;
    case 'closing': return <>
      {_divider(7, 10)}
      {_headlineBlock(7, 14, 86, tok.fg)}
      {bar('sd1', 7, 50, 24, 0.6, tok.div)}
      {bar('s1v', 7, 52, 12, 5, tok.fg)}
      {bar('s1l', 7, 60, 18, 2, tok.muted)}
      {bar('sd2', 38, 50, 24, 0.6, tok.div)}
      {bar('s2v', 38, 52, 12, 5, tok.fg)}
      {bar('s2l', 38, 60, 18, 2, tok.muted)}
      {bar('sd3', 69, 50, 24, 0.6, tok.div)}
      {bar('s3v', 69, 52, 12, 5, tok.fg)}
      {bar('s3l', 69, 60, 18, 2, tok.muted)}
      {_bodyBlock(7, 74, 86, tok.muted)}
      {bar('dot', 7, 90, 1.5, 1.5, RED)}
      {line('handle', 10, 91, 30, tok.fg)}
    </>;
    case 'numbered-list': return <>
      {_divider(7, 8)}
      {_headlineBlock(7, 12, 70, tok.fg)}
      {[0,1,2].flatMap(i => {
        const y = 40 + i * 18;
        return [
          bar('tn'+i, 7, y, 38, 0.5, tok.div),
          bar('n'+i, 7, y + 2, 8, 7, RED),
          bar('lh'+i, 22, y + 2, 60, 3, tok.fg),
          bar('lb'+i, 22, y + 8, 70, 1.5, tok.muted),
        ];
      })}
    </>;
    case 'comparison': return <>
      {_divider(7, 8)}
      {_headlineBlock(7, 12, 70, tok.fg)}
      {line('lL', 7, 44, 16, tok.muted)}
      {bar('lh', 7, 50, 30, 4, tok.fg)}
      {bar('lb1', 7, 58, 38, 1.5, tok.muted)}
      {bar('lb2', 7, 63, 32, 1.5, tok.muted)}
      {bar('div', 49, 44, 0.4, 38, tok.div)}
      {line('rL', 53, 44, 16, RED)}
      {bar('rh', 53, 50, 30, 4, tok.fg)}
      {bar('rb1', 53, 58, 38, 1.5, tok.muted)}
      {bar('rb2', 53, 63, 32, 1.5, tok.muted)}
    </>;
    case 'portrait': return <>
      {bar('img', 0, 0, 50, 100, '#2a2018')}
      {_divider(54, 10)}
      {_headlineBlock(54, 14, 42, tok.fg)}
      {line('dates', 54, 36, 24, RED)}
      {_bodyBlock(54, 44, 42, tok.muted)}
      {bar('qbar', 54, 70, 0.8, 18, RED)}
      {bar('q1', 57, 72, 38, 3, tok.fg)}
      {bar('q2', 57, 78, 32, 3, tok.fg)}
    </>;
    case 'timeline': return <>
      {_divider(7, 8)}
      {_headlineBlock(7, 12, 70, tok.fg)}
      {bar('axis', 14, 38, 0.8, 50, RED)}
      {[0,1,2].flatMap(i => {
        const y = 38 + i * 18;
        return [
          bar('dot'+i, 13, y, 3, 3, RED, { boxShadow: `0 0 0 2px ${tok.bg}` }),
          bar('date'+i, 22, y, 14, 5, RED),
          bar('h'+i, 22, y + 8, 30, 2.5, tok.fg),
          bar('b'+i, 22, y + 12, 60, 1.5, tok.muted),
        ];
      })}
    </>;
    case 'map': return <>
      {_divider(7, 8)}
      {_headlineBlock(7, 12, 70, tok.fg)}
      {bar('frame', 7, 38, 86, 50, '#1a1a1a', { border: `1px solid ${tok.div}` })}
      {bar('m1', 26, 50, 3, 3, RED, { borderRadius: '50%', boxShadow: '0 0 0 2px rgba(192,57,43,0.4)' })}
      {line('l1', 31, 50, 14, tok.fg)}
      {bar('m2', 52, 62, 3, 3, RED, { borderRadius: '50%', boxShadow: '0 0 0 2px rgba(192,57,43,0.4)' })}
      {line('l2', 57, 62, 14, tok.fg)}
      {bar('m3', 38, 76, 3, 3, RED, { borderRadius: '50%', boxShadow: '0 0 0 2px rgba(192,57,43,0.4)' })}
      {line('l3', 43, 76, 14, tok.fg)}
    </>;
    case 'did-you-know': return <>
      {bar('qmark', 78, 4, 16, 28, 'rgba(192,57,43,0.18)', { fontFamily: '"Bebas Neue"' })}
      {bar('mark', 7, 9, 3, 3, RED)}
      {line('eye', 13, 10, 32, tok.fg)}
      {_divider(7, 28)}
      {_headlineBlock(7, 32, 86, tok.fg)}
      {_bodyBlock(7, 60, 86, tok.muted)}
      {line('src', 7, 84, 28, tok.muted)}
    </>;
    case 'pie-chart': return <>
      {_divider(7, 8)}
      {_headlineBlock(7, 12, 70, tok.fg)}
      {bar('ring', 35, 40, 30, 22, 'transparent', { border: `7px solid ${RED}`, borderRadius: '50%', borderRightColor: tok.fg, borderBottomColor: tok.muted })}
      {bar('lg1c', 18, 74, 4, 3, RED)}
      {line('lg1', 24, 75, 24, tok.fg)}
      {bar('lg2c', 18, 82, 4, 3, tok.fg)}
      {line('lg2', 24, 83, 24, tok.muted)}
      {bar('lg3c', 56, 74, 4, 3, tok.muted)}
      {line('lg3', 62, 75, 24, tok.fg)}
    </>;
    case 'line-graph': return <>
      {_divider(7, 8)}
      {_headlineBlock(7, 12, 70, tok.fg)}
      {bar('axis', 12, 40, 0.6, 44, tok.div)}
      {bar('base', 12, 84, 80, 0.6, tok.div)}
      {bar('l1', 16, 70, 16, 0.8, RED, { transform: 'rotate(-18deg)', transformOrigin: 'left' })}
      {bar('l2', 32, 58, 16, 0.8, RED, { transform: 'rotate(-12deg)', transformOrigin: 'left' })}
      {bar('l3', 48, 50, 16, 0.8, RED, { transform: 'rotate(-22deg)', transformOrigin: 'left' })}
      {bar('l4', 64, 38, 16, 0.8, RED, { transform: 'rotate(-10deg)', transformOrigin: 'left' })}
      {bar('d1', 15, 69, 2.5, 2, RED, { borderRadius: '50%' })}
      {bar('d2', 31, 57, 2.5, 2, RED, { borderRadius: '50%' })}
      {bar('d3', 47, 49, 2.5, 2, RED, { borderRadius: '50%' })}
      {bar('d4', 79, 36, 2.5, 2, RED, { borderRadius: '50%' })}
    </>;
    case 'bar-chart': return <>
      {_divider(7, 8)}
      {_headlineBlock(7, 12, 70, tok.fg)}
      {bar('base', 10, 84, 82, 0.6, tok.div)}
      {bar('b1', 14, 60, 12, 24, RED)}
      {bar('b2', 32, 44, 12, 40, RED)}
      {bar('b3', 50, 70, 12, 14, RED)}
      {bar('b4', 68, 52, 12, 32, RED)}
    </>;
    case 'dynasty': return <>
      {_divider(7, 8)}
      {_headlineBlock(7, 12, 70, tok.fg)}
      {bar('n1', 38, 38, 24, 9, 'transparent', { border: `1px solid ${tok.fg}` })}
      {bar('c1', 49.5, 48, 1, 6, RED)}
      {bar('n2', 38, 56, 24, 9, 'transparent', { border: `1px solid ${RED}` })}
      {bar('c2', 49.5, 66, 1, 6, RED)}
      {bar('n3', 38, 74, 24, 9, 'transparent', { border: `1px solid ${tok.fg}` })}
    </>;
    case 'before-after': return <>
      {_divider(7, 8)}
      {_headlineBlock(7, 12, 70, tok.fg)}
      {bar('imgL', 8, 38, 84, 50, '#2a2018', { clipPath: 'polygon(0 0, 60% 0, 40% 100%, 0 100%)' })}
      {bar('imgR', 8, 38, 84, 50, '#3a3a3a', { clipPath: 'polygon(60% 0, 100% 0, 100% 100%, 40% 100%)' })}
      {bar('seam', 49, 38, 0.6, 50, RED, { transform: 'skewX(-12deg)' })}
      {bar('tagL', 12, 42, 16, 4, 'rgba(0,0,0,0.6)')}
      {bar('tagR', 72, 80, 16, 4, 'rgba(0,0,0,0.6)')}
    </>;
    case 'document': return <>
      {_divider(7, 8)}
      {_headlineBlock(7, 11, 60, tok.fg)}
      {bar('doc', 16, 30, 68, 38, '#2a2018', { border: `3px solid ${tok.muted}` })}
      {bar('qbar', 10, 74, 1.5, 16, RED)}
      {bar('q1', 14, 76, 60, 3, tok.fg)}
      {bar('q2', 14, 82, 48, 3, tok.fg)}
      {line('attr', 10, 92, 30, tok.muted)}
    </>;
    case 'annotated': return <>
      {_divider(7, 8)}
      {_headlineBlock(7, 11, 60, tok.fg)}
      {bar('img', 8, 28, 84, 40, '#2a2620', { border: `1px solid ${tok.div}` })}
      {bar('m1', 24, 38, 6, 4.5, RED, { borderRadius: '50%', border: '1px solid #fff' })}
      {bar('m2', 52, 50, 6, 4.5, RED, { borderRadius: '50%', border: '1px solid #fff' })}
      {bar('m3', 70, 40, 6, 4.5, RED, { borderRadius: '50%', border: '1px solid #fff' })}
      {bar('lg1', 9, 74, 5, 4, RED, { borderRadius: '50%' })}
      {line('lg1t', 17, 75, 60, tok.muted)}
      {bar('lg2', 9, 82, 5, 4, RED, { borderRadius: '50%' })}
      {line('lg2t', 17, 83, 52, tok.muted)}
      {bar('lg3', 9, 90, 5, 4, RED, { borderRadius: '50%' })}
      {line('lg3t', 17, 91, 56, tok.muted)}
    </>;
    case 'sources': return <>
      {line('eye', 7, 10, 18, RED)}
      {_divider(7, 16)}
      {_headlineBlock(7, 20, 50, tok.fg)}
      {bar('s1t', 7, 46, 60, 0.5, tok.div)}
      {line('s1a', 7, 48, 50, tok.fg)}
      {line('s1b', 7, 53, 30, tok.muted)}
      {bar('s2t', 7, 62, 60, 0.5, tok.div)}
      {line('s2a', 7, 64, 50, tok.fg)}
      {line('s2b', 7, 69, 30, tok.muted)}
      {bar('s3t', 7, 78, 60, 0.5, tok.div)}
      {line('s3a', 7, 80, 50, tok.fg)}
      {line('s3b', 7, 85, 30, tok.muted)}
    </>;
    case 'interior-light': return <>
      {bar('lb', 0, 0, 1.2, 100, RED)}
      {bar('num', 86, 6, 8, 6, RED)}
      {line('eye', 10, 30, 16, RED)}
      {_headlineBlock(10, 36, 70, tok.fg)}
      {_bodyBlock(10, 60, 80, tok.muted)}
    </>;
    case 'cta-red': return <>
      {line('eye', 8, 36, 30, tok.muted)}
      {_headlineBlock(8, 44, 84, tok.fg)}
      {line('cta', 8, 76, 36, tok.fg)}
    </>;
    case 'quote-card': return <>
      {bar('qbar', 12, 30, 1.5, 40, RED)}
      {line('eye', 17, 30, 30, RED)}
      {bar('q1', 17, 38, 65, 5, tok.fg)}
      {bar('q2', 17, 46, 55, 5, tok.fg)}
      {bar('q3', 17, 54, 40, 5, tok.fg)}
      {line('att', 17, 64, 30, tok.muted)}
    </>;
    case 'reel-title': return <>
      {line('eye', 12, 36, 30, RED)}
      {_divider(12, 42)}
      {_headlineBlock(12, 46, 76, tok.fg)}
      {line('sub', 12, 68, 50, tok.muted)}
      {bar('pill', 12, 80, 30, 4, '#000', { border: '1px solid #333' })}
      {line('hdl', 12, 92, 30, tok.muted)}
    </>;
    case 'youtube-thumbnail': return <>
      {line('eye', 8, 24, 24, RED)}
      {_headlineBlock(8, 32, 70, tok.fg)}
      {line('sub', 8, 60, 40, tok.muted)}
      {bar('stamp', 84, 84, 12, 8, RED, { opacity: 0.6 })}
    </>;
    case 'end-card': return <>
      {bar('wm', 30, 36, 40, 14, tok.fg)}
      {bar('underline', 44, 56, 12, 1.5, RED)}
      {line('tag', 38, 64, 24, tok.muted)}
      {bar('h1', 22, 78, 14, 3, tok.fg)}
      {bar('h2', 42, 78, 14, 3, tok.fg)}
      {bar('h3', 62, 78, 14, 3, tok.fg)}
    </>;
    default: return <>
      {_headlineBlock(8, 40, 84, tok.fg)}
      {_bodyBlock(8, 65, 84, tok.muted)}
    </>;
  }
}

function LayoutSchematic({ layout, width = 132 }) {
  const aspect = LAYOUT_ASPECT[layout] || (4/5);
  const H = Math.round(width / aspect);
  const tok = _schemaTokens(layout);
  return (
    <div style={{
      width, height: H, position: 'relative', overflow: 'hidden',
      background: tok.bg, flex: '0 0 auto',
    }}>
      {_schematicFor(layout)}
    </div>
  );
}

function LayoutPicker({ value, onPick, onClose }) {
  const all = Object.keys(window.MANIFEST);
  const handleBackdrop = e => { if (e.target === e.currentTarget) onClose(); };
  React.useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div onClick={handleBackdrop} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
      zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 32,
    }}>
      <div style={{
        background: '#0a0a0a', border: '1px solid #2c2c2c',
        width: 'min(960px, 92vw)', maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid #2c2c2c',
        }}>
          <div style={{
            fontFamily: '"Bebas Neue", Impact, sans-serif', fontSize: 22,
            letterSpacing: 2, color: '#E8DCC8',
          }}>Pick a layout</div>
          <button onClick={onClose} style={{
            background: 'transparent', color: '#888', border: 0, fontSize: 22,
            cursor: 'pointer', padding: 0, lineHeight: 1,
          }}>×</button>
        </div>
        <div style={{
          flex: 1, overflowY: 'auto', padding: 20,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14,
        }}>
          {all.map(key => {
            const def = window.MANIFEST[key];
            const selected = key === value;
            return (
              <button key={key} onClick={() => { onPick(key); onClose(); }} style={{
                background: '#0f0f0f',
                border: `1px solid ${selected ? '#C0392B' : '#2c2c2c'}`,
                padding: 12, cursor: 'pointer', textAlign: 'left',
                display: 'flex', flexDirection: 'column', gap: 8,
                outline: 'none',
              }}
              onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = '#444'; }}
              onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = '#2c2c2c'; }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 130 }}>
                  <LayoutSchematic layout={key} width={104} />
                </div>
                <div style={{
                  fontFamily: '"DM Sans", system-ui', fontSize: 12, fontWeight: 600,
                  color: selected ? '#C0392B' : '#E8DCC8', letterSpacing: 0.4,
                }}>{def.label}</div>
                <div style={{
                  fontFamily: '"DM Sans", system-ui', fontSize: 10.5, color: '#888',
                  lineHeight: 1.45,
                }}>{def.summary}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Slide form ────────────────────────────────────────────────

function SlideForm({ slide, slideIndex, onChange, content, setContent }) {
  const layoutKey = slide.layout;
  const layoutDef = window.MANIFEST[layoutKey] || window.MANIFEST.story;
  const allLayouts = Object.keys(window.MANIFEST);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const set = (key, v) => onChange({ ...slide, [key]: v });
  const setMeta = (key, v) => setContent({ ...content, [key]: v });

  return (
    <div>
      <Field label="Layout" help={layoutDef.summary}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
          <div style={{ flex: 1 }}>
            <SelectInput value={layoutKey} onChange={v => set('layout', v)} options={allLayouts} />
          </div>
          <button type="button" onClick={() => setPickerOpen(true)} style={{
            background: '#1a1a1a', color: '#E8DCC8', border: '1px solid #2c2c2c',
            padding: '0 14px', cursor: 'pointer',
            font: '10px "DM Sans", system-ui', letterSpacing: 1.5, textTransform: 'uppercase',
            fontWeight: 600, whiteSpace: 'nowrap',
          }} title="Browse layouts visually">Browse</button>
        </div>
      </Field>
      {pickerOpen && <LayoutPicker value={layoutKey} onPick={v => set('layout', v)} onClose={() => setPickerOpen(false)} />}
      <div style={{ height: 1, background: '#2c2c2c', margin: '4px 0 18px' }} />
      {layoutKey === 'cover' && content && setContent && (
        <div style={{ marginBottom: 22, padding: '14px 14px 4px', background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.35)' }}>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#d4a39a', marginBottom: 12, fontWeight: 600 }}>
            Post metadata · used on publish
          </div>
          <Field label="IG caption" help="Open with the hook; name the book + author for SEO when relevant. End with @itiha29 · itiha.info.">
            <FieldInput
              field={{ key: 'caption', type: 'textarea' }}
              value={content.caption}
              onChange={v => setMeta('caption', v)} />
            <LimitCounter current={(content.caption || '').length} max={2200} unit="chars" overLabel="too long for IG" />
          </Field>
          <Field label="Hashtags" help="6–10 space-separated #tags. Include topic + book/author + place tags. Appended to the caption on publish.">
            <FieldInput
              field={{ key: 'hashtags', type: 'textarea' }}
              value={content.hashtags}
              onChange={v => setMeta('hashtags', v)} />
            <LimitCounter current={((content.hashtags || '').match(/#\w+/g) || []).length} max={30} unit="hashtags" overLabel="IG silently drops > 30" />
          </Field>
        </div>
      )}
      {layoutDef.fields.map(f => (
        <Field key={f.key} label={f.label} help={f.help}>
          <FieldInput field={f} value={slide[f.key]} onChange={v => set(f.key, v)} slideIndex={slideIndex} />
        </Field>
      ))}
    </div>
  );
}

// ── Top-level (project) form ──────────────────────────────────

function MetaForm({ content, onChange }) {
  const set = (key, v) => onChange({ ...content, [key]: v });
  const setTweak = (key, v) => onChange({ ...content, tweaks: { ...(content.tweaks || {}), [key]: v } });
  return (
    <div>
      {window.MANIFEST_META.fields.map(f => (
        <Field key={f.key} label={f.label} help={f.help}>
          <FieldInput field={f} value={content[f.key]} onChange={v => set(f.key, v)} />
        </Field>
      ))}
      <div style={{ marginTop: 24, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#666', fontWeight: 600, borderBottom: '1px solid #2c2c2c', paddingBottom: 6, marginBottom: 14 }}>Tweaks</div>
      {window.MANIFEST_TWEAKS.fields.map(f => (
        <Field key={f.key} label={f.label} help={f.help}>
          <FieldInput field={f} value={(content.tweaks || {})[f.key]} onChange={v => setTweak(f.key, v)} />
        </Field>
      ))}
    </div>
  );
}

// ── Slide picker / structural controls ────────────────────────

// Mini live render of a slide at small width — the actual layout component
// scaled via CSS transform. Memoised so re-rendering one slide doesn't recompute
// all 20 in the strip. Pointer-events disabled so clicks fall through to the
// surrounding selection button.
const SlideThumb = React.memo(
  function SlideThumb({ slide, index, dims, width = 64 }) {
    const W = (dims && dims.width)  || 1080;
    const H = (dims && dims.height) || 1350;
    const scale = width / W;
    const h = Math.round(H * scale);
    const Comp = (window.LAYOUTS && slide && slide.layout) ? window.LAYOUTS[slide.layout] : null;
    return (
      <div style={{
        position: 'relative', width, height: h, overflow: 'hidden',
        flex: '0 0 auto', background: '#0d0d0d', pointerEvents: 'none',
      }}>
        {Comp && (
          <div style={{
            position: 'absolute', left: 0, top: 0, width: W, height: H,
            transform: `scale(${scale})`, transformOrigin: 'top left',
          }}>
            <Comp slide={slide} index={index} />
          </div>
        )}
      </div>
    );
  },
  (a, b) => a.slide === b.slide && a.index === b.index && a.width === b.width &&
           (a.dims && b.dims ? a.dims.width === b.dims.width && a.dims.height === b.dims.height : a.dims === b.dims)
);

function SlideStrip({ slides, current, dims, onPick, onAdd, onRemove, onMove, onDuplicate }) {
  // Thumb width scales gently with slide count so 20-slide carousels still fit.
  const thumbW = slides.length > 12 ? 48 : 60;
  return (
    <div style={{
      display: 'flex', gap: 6, padding: '10px 12px', background: '#0a0a0a',
      borderBottom: '1px solid #2c2c2c', overflowX: 'auto', alignItems: 'flex-start',
    }}>
      {slides.map((s, i) => (
        <button key={i} onClick={() => onPick(i)}
          title={`${String(i + 1).padStart(2, '0')} · ${s.layout || 'story'}`}
          style={{
            flex: '0 0 auto', padding: 0, position: 'relative',
            background: '#0d0d0d',
            border: `2px solid ${i === current ? '#C0392B' : '#2c2c2c'}`,
            cursor: 'pointer', borderRadius: 0,
            boxShadow: i === current ? '0 0 0 1px rgba(192,57,43,0.45)' : 'none',
          }}>
          <SlideThumb slide={s} index={i} dims={dims} width={thumbW} />
          <div style={{
            position: 'absolute', left: 3, top: 3,
            background: 'rgba(0,0,0,0.75)', color: '#fff',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
            padding: '2px 4px', letterSpacing: 1, fontWeight: 600, lineHeight: 1,
          }}>{String(i + 1).padStart(2, '0')}</div>
        </button>
      ))}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 'auto', alignSelf: 'center' }}>
        <button onClick={onAdd} style={btnSm} title="Add new slide">+ Slide</button>
        <button onClick={onDuplicate} style={btnSm} title="Duplicate current slide" disabled={slides.length === 0}>⎘</button>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => onMove(current, -1)} style={btnSm} disabled={current === 0} title="Move left">◀</button>
          <button onClick={() => onMove(current, +1)} style={btnSm} disabled={current === slides.length - 1} title="Move right">▶</button>
        </div>
        <button onClick={onRemove} style={{ ...btnSm, color: '#c0392b' }} disabled={slides.length <= 1} title="Delete slide">✕</button>
      </div>
    </div>
  );
}

// ── Paste tab: parse pasted Markdown / Claude output into slides ──

// One-time paste into Claude Projects → Custom instructions.
// All voice/format/layout/example rules live here so each chat in the project
// only needs a tiny topic prompt.
const PROJECT_INSTRUCTIONS = `You are the writer for ITIHA — a premium Indian-history documentary studio. Every reply produces a single Instagram carousel parsed by a strict YAML schema.

The project Knowledge file \`examples.yaml\` contains one complete worked carousel plus one annotated snippet per data-driven layout (timeline, map, pie-chart, line-graph, bar-chart, dynasty, did-you-know, document, annotated, sources). Read it whenever you're unsure about layout choice or field shapes. Don't guess shapes from training — read the file.

═══════════════════════════════════════════════════════
PART 0 — WRAP YOUR REPLY IN A CODE FENCE
═══════════════════════════════════════════════════════

Open with \`\`\`yaml. Close with \`\`\`. Everything goes INSIDE this single fence. claude.ai strips Markdown structure when the user copies; the fence preserves every character. Never produce output without the fence. Never use more than one fence. Never add prose outside it.

═══════════════════════════════════════════════════════
PART 1 — OUTPUT SHAPE (this is the entire schema; nothing else exists)
═══════════════════════════════════════════════════════

Inside the code fence, your content MUST look exactly like this skeleton. Field names, indentation, block-scalar pipes (\`|\`), and section headers are not suggestions — they are the schema.

---
name: <kebab-case slug>
format: instagram-portrait
caption: |
  Caption paragraph one — open with the hook, name the book + author if your sources are a specific work (this is the search-engine signal).

  Caption paragraph two — context, stakes, what the carousel argues. End with @itiha29 · itiha.info.
hashtags: |
  #IndianHistory #Itiha #<TopicTag> #<BookOrAuthorTag> #<PlaceOrPeriodTag>
tweaks:
  showChapterLabels: false
  showStamp: true
  showPageNum: true
  seriesLabel: <ALL-CAPS SHORT, e.g. SOMNATH>
---

## Slide 1
Layout: cover
Eyebrow: Series 01
Eyebrow-Meta: <topic> · <N> Parts
Headline: |
  Two Or Three
  Short Lines With *Accent*
Subline: One-line subtitle
Swipe-Meta: Swipe ▸ · <N> Slides · <duration> read

## Slide 2
Layout: story
Chapter: Chapter 02 · short theme
Headline: |
  Two Lines
  With *Accent*
Body: |
  Two or three sentences. [bracket key terms]. _italics for foreign words_.
  **bold sparingly**.

## Slide N
Layout: closing
Headline: |
  Final Lines
  With *Accent*
Body: |
  One declarative closing sentence.
Handle: Follow @itiha29 · itiha.info

═══════════════════════════════════════════════════════
PART 2 — ALLOWED FIELDS (closed list)
═══════════════════════════════════════════════════════

Front-matter only: name, format, caption, hashtags, tweaks
Tweaks block only: showChapterLabels, showStamp, showPageNum, seriesLabel

Slide fields only (depending on layout):
- Common:        Layout, Theme, Eyebrow, Eyebrow-Meta, Chapter, Headline, Subline, Swipe-Meta, Body
- Stats:         array of { Label, Value, Value-Red, Sublabel }                              — stat, closing
- Items:         array; shape varies by layout (see "When to pick which" below)              — numbered-list, dates-grid, timeline
- Quote, Attribution                                                                          — quote, portrait
- Name, Dates, Role                                                                           — portrait
- Left-Label, Left-Headline, Left-Body, Right-Label, Right-Headline, Right-Body              — comparison
- Markers:       array of { X, Y, Label, Sublabel }                                           — map
- Segments:      array of { Label, Value, Color? }                                            — pie-chart
- Points:        array of { Label, Value }  ·  Series: array of { Label, Points }             — line-graph
- Bars:          array of { Label, Value, Color? }  ·  Horizontal                             — bar-chart
- Nodes:         array of { Name, Dates, Note?, Generation?, Highlight? }                     — dynasty
- Image-Before, Image-After, Label-Before, Label-After, Split                                 — before-after
- Image, Quote, Translation, Attribution                                                      — document
- Image, Callouts: array of { X, Y, Label }                                                   — annotated
- Sources: array of { Title, Author, Detail }                                                 — sources
- Source                                                                                      — did-you-know
- Handle                                                                                      — closing

Theme: \`dark\` (default — off-white text on near-black) or \`light\` (near-black text on off-white). Use \`light\` for breather slides — typically a slide that's all-type (no image), often around the midpoint, to break up the dark rhythm. 1–2 light slides per 9-slide carousel max.

LAYOUTS (the only valid values for the Layout: field):
cover · story · split-story · quote · stat · dates-grid · closing · numbered-list · comparison · portrait · timeline · map · did-you-know · pie-chart · line-graph · bar-chart · dynasty · before-after · document · annotated · sources · interior-light · cta-red

When to pick which layout — and the exact field shapes for each — see \`examples.yaml\` in Project Knowledge. The picker table at the top of that file maps each argument-type to a layout in one line each.

═══════════════════════════════════════════════════════
PART 3 — FORBIDDEN OUTPUT (these are the failure modes we have seen — do not repeat them)
═══════════════════════════════════════════════════════

NEVER use these slide headers:
- \`Slide 1 — Title\`        (em-dash header, no \`##\`)
- \`Slide 1:\`                (colon header, no \`##\`)
- \`1. Cover\`                (numbered list)
ONLY use: \`## Slide 1\`  (exactly two hashes, space, the word Slide, the number — nothing else)

NEVER invent these fields. They are NOT in the schema and will be silently dropped:
- Kicker, Marker, Footer, Footer left, Footer right, Hook, Tagline, CTA, Title, Subtitle

NEVER use inline-quoted headlines:
- WRONG: \`Headline: "There is no Communist Party of India."\`
- RIGHT: \`Headline: |\` then indented multi-line block scalar.

NEVER prefix the reply with any of:
- "Here's your carousel:" / "Below is the markdown:" / any greeting outside the fence.
The very first characters of your reply must be \`\`\`yaml (the opening code fence — see PART 0). The first character INSIDE the fence must be \`-\` (the opening \`---\` of the front-matter).

NEVER end with sign-offs ("Let me know if…", "Hope this helps", "—\\nEnd"). The content inside the fence ends at the last slide's last field; the reply ends with the closing \`\`\` fence.

NEVER use citation footnotes ([1], (Source A), [Ref]). [square brackets] in body are RESERVED for red-emphasis key terms.

NEVER start a field value with a [bracket]. A line like \`Label: [Company] officers\` breaks the YAML parser (it reads \`[\` as a list). Put a word first: \`Label: Officers of the [Company]\`. This applies to every single-line value (Label, Subline, Attribution, etc.); block scalars (\`Body: |\`) are fine since the bracket isn't the first character on the value line.

═══════════════════════════════════════════════════════
PART 4 — VOICE (ITIHA documentary narrator)
═══════════════════════════════════════════════════════

Cinematic, archival, authoritative, unapologetic, editorial. Third person, past tense, stative sentences.

NEVER:
- First person ("I", "we") or second person ("you").
- Emoji, exclamation marks, question marks (unless the whole piece is built around one question).
- Clickbait ("you won't believe", "this changed everything", "guys", "hey", "watch this", "swipe to find out").
- Hedging ("perhaps", "maybe", "might be considered"). State the conclusion.

HEADLINES:
- Normal case in the source; renderer uppercases in Bebas Neue.
- 1–2 *accent words* per headline, each wrapped in *asterisks*. An accent must be a noun, name, place, date, or verb of consequence. Never a connector (the, and, of, a).
- 2–3 short lines via literal newlines inside the YAML block scalar.

BODY (sentence case):
- [word] → red-emphasis key term (a name, a number, a place, a verdict). 2+ per body slide.
- _word_ → italic (foreign words: _Ain-i-Akbari_, _kuli_, _ryotwari_; song/book titles).
- **word** → bold, sparingly (at most once per slide).

═══════════════════════════════════════════════════════
PART 5 — FACTUAL BASIS
═══════════════════════════════════════════════════════

Use the project's uploaded sources (books, PDFs, images, links) as the factual basis. Every claim must be supportable from those sources. Do not invent dates, names, or quantities. If a fact is unclear in the sources, omit it rather than guess.

═══════════════════════════════════════════════════════
PART 5.5 — CAPTION + HASHTAGS (the post's SEO surface)
═══════════════════════════════════════════════════════

The caption is the only text-indexable surface of the post — write it as a STANDALONE SUMMARY a reader can understand without opening the slides.

CAPTION (3–4 paragraphs, \`caption: |\`):
- Para 1 — hook. The central claim or surprise. If a book/author underpins the carousel, name them here (title + surname are the SEO signal).
- Para 2 — REQUIRED, the index. Substantive abstract: main claim, 2–3 key facts with dates/numbers/proper names, conclusion. If a reader only had this paragraph, they should understand the argument.
- Para 3 — optional stakes / why it matters.
- Last line: \`@itiha29 · itiha.info\`. No hashtags inside the caption.

HASHTAGS (\`hashtags: |\`, space-separated, 6–10 total):
- Always: \`#IndianHistory #Itiha\`.
- 1–2 topic tags (PascalCase, no spaces): \`#Somnath\`, \`#Plassey\`.
- 1–2 source tags if cited: \`#SitaRamGoel\`, \`#AlBiruni\`. Skip if no clear named source.
- 1–2 place/period/dynasty tags: \`#Gujarat\`, \`#11thCentury\`, \`#Mughals\`.

═══════════════════════════════════════════════════════
PART 6 — SELF-CHECK before sending (run through every item)
═══════════════════════════════════════════════════════

1. My reply opens with \`\`\`yaml on its own line and closes with \`\`\` on its own line (PART 0).
2. Inside the fence, the first line is \`---\` (front-matter opens).
3. Front-matter block has name / format / caption / hashtags / tweaks.seriesLabel.
3a. Caption is a STANDALONE SUMMARY of the carousel (3–4 paragraphs): hook + book/author, substantive abstract with dates/numbers/proper names, optional stakes, then @itiha29 · itiha.info. A reader who never opens the slides should understand the argument.
3b. Hashtags include the book/author tag plus topic + place/period tags. 6–10 hashtags total.
4. Every slide header is exactly \`## Slide N\` (no em-dash, no title suffix, no colon).
5. Every slide's first field is \`Layout:\` followed by one of the allowed layout names.
6. No forbidden fields anywhere (Kicker, Marker, Footer, Footer left, Footer right, Hook, Tagline, CTA, Title, Subtitle).
7. Every Headline uses block-scalar form: \`Headline: |\` then indented lines. No inline-quoted single-line headlines.
8. Every Headline has 1–2 *accent words* wrapped in *asterisks*.
9. Every Body has at least 2 [bracket terms] (key nouns/dates/places/verdicts).
10. First slide Layout is cover. Last slide Layout is closing.
11. The reply has exactly ONE opening fence and ONE closing fence. Nothing outside them.

If any check fails, fix it before sending.`;


// Per-chat message the user pastes into a new conversation inside the project.
const TOPIC_PROMPT = `Topic: <<<REPLACE WITH YOUR TOPIC>>>
Slides: 9
Series label (ALL CAPS, short — e.g. SOMNATH, PLASSEY, INDENTURE): <<<REPLACE>>>
Primary source(s) to cite (book + author, if applicable): <<<REPLACE — e.g. "The Story of Civilisation, Will Durant" — or leave blank>>>

Produce the carousel now in the EXACT schema from the project instructions.

Front-matter requirements (PART 5.5):
- \`caption: |\` — 3–4 paragraphs. Must function as a STANDALONE SUMMARY of the carousel — written so a reader (or a search algorithm) understands the argument without opening the slides. Paragraph 1: hook + central claim + name the book/author from the line above if applicable. Paragraph 2: the substantive summary — the main argument, 2–3 key facts with dates/numbers/proper names, the conclusion. This is the indexing signal. Paragraph 3 (optional): stakes / why it matters. Close with @itiha29 · itiha.info. No hashtags inside the caption.
- \`hashtags: |\` — 6–10 space-separated #tags. Always include #IndianHistory #Itiha. Include #<TopicTag>, the book/author tag (e.g. #SitaRamGoel, #AlBiruni), and place/period tag.

Before replying, run through the Part 7 self-check. In particular:
- Wrap the ENTIRE reply in a single \`\`\`yaml ... \`\`\` code fence (PART 0). This is critical — without the fence, claude.ai strips Markdown structure when I copy.
- Headers inside the fence are \`## Slide N\` (no em-dash, no titles after the number).
- No Kicker / Marker / Footer / Hook / CTA fields. Only the allowed schema fields.
- Headlines use \`Headline: |\` block scalars with 2–3 short lines and 1–2 *accent words*.
- Body has [bracket key terms]. Body uses _italics_ for foreign words.
- Content inside the fence starts with \`---\` and ends at the last slide's last field.`;


function PasteTab({ content, setContent, setCurrentIdx }) {
  const [text, setText] = React.useState('');
  const [status, setStatus] = React.useState(null);   // {type: 'ok'|'err', msg}
  const [busy, setBusy] = React.useState(false);

  const replace = async () => {
    if (!text.trim()) { setStatus({ type: 'err', msg: 'paste some Markdown first' }); return; }
    setBusy(true); setStatus(null);
    try {
      const r = await fetch('api/parse-markdown', {
        method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: text,
      });
      if (!r.ok) throw new Error(await r.text());
      const parsed = await r.json();
      setContent({
        ...content,
        name:     parsed.name     || content.name,
        format:   parsed.format   || content.format,
        caption:  parsed.caption  || content.caption,
        hashtags: parsed.hashtags || content.hashtags,
        tweaks:   { ...(content.tweaks || {}), ...(parsed.tweaks || {}) },
        slides:   parsed.slides,
      });
      setCurrentIdx(0);
      setStatus({ type: 'ok', msg: `loaded ${parsed.slides.length} slide(s) — switch to the Slide tab to refine` });
    } catch (e) {
      setStatus({ type: 'err', msg: String(e.message || e) });
    } finally { setBusy(false); }
  };

  const copyProjectInstructions = async () => {
    try {
      await navigator.clipboard.writeText(PROJECT_INSTRUCTIONS);
      setStatus({ type: 'ok', msg: 'project instructions copied — paste once into your Claude Project → Custom instructions' });
    } catch (e) {
      setStatus({ type: 'err', msg: 'clipboard blocked; copy the prompt below manually' });
    }
  };

  const copyTopic = async () => {
    try {
      await navigator.clipboard.writeText(TOPIC_PROMPT);
      setStatus({ type: 'ok', msg: 'topic prompt copied — paste into a new chat in your Claude Project and fill in the topic' });
    } catch (e) {
      setStatus({ type: 'err', msg: 'clipboard blocked; copy the prompt below manually' });
    }
  };

  return (
    <div>
      <div style={{ fontSize: 12, color: '#999', lineHeight: 1.6, marginBottom: 14 }}>
        Paste a Markdown carousel here and hit <b>Replace slides</b>. To generate one, set up a Claude Project once with <b>Project setup (1×)</b>, then use <b>New topic</b> for every carousel. Details below.
      </div>

      <Field label="Markdown" help="One front-matter block at the top, then `## Slide N` sections. Paste the full thing.">
        <textarea value={text} onChange={e => setText(e.target.value)} rows={14}
          placeholder="--- &#10;name: my-carousel&#10;format: instagram-portrait&#10;---&#10;&#10;## Slide 1&#10;Layout: cover&#10;Headline: |&#10;  My Big&#10;  *Headline*"
          style={{ ...inputBase, fontFamily: '"JetBrains Mono", monospace', fontSize: 12, lineHeight: 1.5, resize: 'vertical' }} />
      </Field>

      <div style={{ display: 'flex', gap: 8, marginTop: 4, marginBottom: 12 }}>
        <button onClick={replace} disabled={busy} style={{
          flex: 1, background: '#C0392B', color: '#fff', border: 0,
          padding: '11px 14px', cursor: busy ? 'wait' : 'pointer',
          font: '11px "DM Sans", system-ui', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600,
        }}>{busy ? 'Parsing…' : 'Replace slides'}</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <button onClick={copyProjectInstructions} title="One-time setup: paste into your Claude Project's Custom instructions." style={{
          flex: 1, background: '#1a1a1a', color: '#E8DCC8', border: '1px solid #2c2c2c',
          padding: '10px 12px', cursor: 'pointer',
          font: '10px "DM Sans", system-ui', letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 600,
        }}>Project setup (1×)</button>
        <a href="/examples.yaml" download="examples.yaml" title="One-time setup: upload as a Knowledge file in your Claude Project." style={{
          flex: 1, background: '#1a1a1a', color: '#E8DCC8', border: '1px solid #2c2c2c',
          padding: '10px 12px', cursor: 'pointer',
          font: '10px "DM Sans", system-ui', letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 600,
          textDecoration: 'none', textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>Examples (1×)</a>
        <button onClick={copyTopic} title="Per carousel: paste into a new chat inside your Claude Project, then fill in the topic." style={{
          flex: 1, background: '#1a1a1a', color: '#E8DCC8', border: '1px solid #2c2c2c',
          padding: '10px 12px', cursor: 'pointer',
          font: '10px "DM Sans", system-ui', letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 600,
        }}>New topic</button>
      </div>

      {status && (
        <div style={{
          padding: '10px 12px', marginBottom: 14,
          background: status.type === 'ok' ? 'rgba(90,168,127,0.12)' : 'rgba(192,57,43,0.15)',
          border: `1px solid ${status.type === 'ok' ? '#5a8' : '#C0392B'}`,
          color: status.type === 'ok' ? '#aef' : '#fbb', fontSize: 12, lineHeight: 1.5,
        }}>{status.msg}</div>
      )}

      <details style={{ marginTop: 6 }}>
        <summary style={{
          cursor: 'pointer', color: '#9a8f78', fontSize: 11,
          letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, padding: '6px 0',
        }}>Workflow · Claude Project → editor</summary>
        <div style={{ fontSize: 12, color: '#bbb', lineHeight: 1.7, marginTop: 8 }}>
          <p style={{ marginTop: 0 }}>Set up one Claude Project with the Itiha voice baked into custom instructions and your source books/PDFs uploaded as project knowledge. After that, every new carousel is one chat message → paste here.</p>

          <b style={{ color: '#E8DCC8' }}>One time — set up the Claude Project:</b>
          <ol style={{ paddingLeft: 18, marginTop: 4, marginBottom: 12 }}>
            <li>Open <a href="https://claude.ai" target="_blank" style={{ color: '#C0392B' }}>claude.ai</a> → <b>Projects</b> → <b>Create project</b> (name it e.g. "Itiha · Carousels").</li>
            <li>Click <b>Project setup (1×)</b> above. Paste into the project's <b>Custom instructions</b> field. Save.</li>
            <li>Upload your books, PDFs, screenshots, and reference docs into the project's <b>Knowledge</b>. (You can add more over time.)</li>
          </ol>

          <b style={{ color: '#E8DCC8' }}>Every carousel — one chat:</b>
          <ol style={{ paddingLeft: 18, marginTop: 4, marginBottom: 12 }}>
            <li>Open your Itiha project, click <b>New chat</b>.</li>
            <li>Click <b>New topic</b> above. Paste into the chat.</li>
            <li>Replace the two <code>&lt;&lt;&lt;REPLACE&gt;&gt;&gt;</code> placeholders with your topic and series label. Send.</li>
            <li>Claude returns Markdown grounded in your uploaded sources. <b>Copy the whole reply.</b></li>
          </ol>

          <b style={{ color: '#E8DCC8' }}>Editor:</b>
          <ol style={{ paddingLeft: 18, marginTop: 4, marginBottom: 0 }}>
            <li>Paste Claude's Markdown into the textarea above.</li>
            <li>Click <b>Replace slides</b>.</li>
            <li>Open the <b>Slide</b> tab — refine fields, upload images, then <b>Save</b> and <b>Render</b>.</li>
          </ol>

          <div style={{ marginTop: 12, fontSize: 11, color: '#888' }}>
            Parser tolerates code fences, leading prose, and trailing sign-offs if Claude slips. NotebookLM-style <code>### **Slide N**</code> headers also work.
          </div>
        </div>
      </details>
    </div>
  );
}


// ── Editor root ───────────────────────────────────────────────

function Editor({ content, setContent, currentIdx, setCurrentIdx, onSave, savedAt, dirty, error }) {
  const [tab, setTab] = React.useState('slide');

  // ── Resizable panel width ──────────────────────────────────
  // Persisted to localStorage. The body's --editor-w CSS variable is what the
  // preview / top-nav / bottom-toolbar use to shift left, so we keep that in
  // sync on every change.
  const W_MIN = 360, W_MAX = 800, W_DEFAULT = 460;
  const [panelWidth, setPanelWidth] = React.useState(() => {
    try {
      const v = parseInt(window.localStorage.getItem('itiha-editor-width') || '', 10);
      return Number.isFinite(v) && v >= W_MIN && v <= W_MAX ? v : W_DEFAULT;
    } catch { return W_DEFAULT; }
  });
  React.useEffect(() => {
    document.documentElement.style.setProperty('--editor-w', panelWidth + 'px');
    try { window.localStorage.setItem('itiha-editor-width', String(panelWidth)); } catch {}
  }, [panelWidth]);
  // On unmount, restore the default — otherwise closing the editor would leave
  // the preview shifted as if it were still open.
  React.useEffect(() => () => {
    document.documentElement.style.setProperty('--editor-w', W_DEFAULT + 'px');
  }, []);

  const startResize = (downEvt) => {
    downEvt.preventDefault();
    const startX = downEvt.clientX;
    const startW = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const move = (e) => {
      // Panel grows when we drag LEFT (clientX decreases).
      const next = Math.max(W_MIN, Math.min(W_MAX, startW + (startX - e.clientX)));
      setPanelWidth(next);
    };
    const up = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };  // 'slide' | 'project' | 'paste'

  const updateSlide = (i, next) => {
    const slides = content.slides.slice();
    slides[i] = next;
    setContent({ ...content, slides });
  };
  const addSlide = () => {
    const next = { layout: 'story', headline: 'New slide' };
    setContent({ ...content, slides: [...content.slides, next] });
    setCurrentIdx(content.slides.length);
  };
  const duplicateSlide = () => {
    if (!content.slides.length) return;
    const src = content.slides[currentIdx];
    // Deep-clone so subsequent edits don't mutate the original. JSON round-trip
    // is safe here — slide data is plain JSON (no functions, no Dates).
    const copy = JSON.parse(JSON.stringify(src));
    const slides = content.slides.slice();
    slides.splice(currentIdx + 1, 0, copy);
    setContent({ ...content, slides });
    setCurrentIdx(currentIdx + 1);
  };
  const removeSlide = () => {
    if (content.slides.length <= 1) return;
    const slides = content.slides.filter((_, i) => i !== currentIdx);
    setContent({ ...content, slides });
    setCurrentIdx(Math.min(currentIdx, slides.length - 1));
  };
  const moveSlide = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= content.slides.length) return;
    const slides = content.slides.slice();
    [slides[i], slides[j]] = [slides[j], slides[i]];
    setContent({ ...content, slides });
    setCurrentIdx(j);
  };

  const [renderState, setRenderState] = React.useState({ phase: 'idle' });
  // phase: 'idle' | 'saving' | 'rendering' | 'done' | 'error'

  const [autoRender, setAutoRender] = React.useState(() =>
    typeof localStorage !== 'undefined' && localStorage.getItem('itiha:autoRender') === '1'
  );
  React.useEffect(() => {
    try { localStorage.setItem('itiha:autoRender', autoRender ? '1' : '0'); } catch {}
  }, [autoRender]);

  // Keep render() callable from the auto-render effect without stale closures.
  const renderRef = React.useRef(null);

  const render = async () => {
    setRenderState({ phase: 'saving' });
    try {
      // Always save first; render reads content.yaml from disk.
      if (dirty || !savedAt) await onSave();
      setRenderState({ phase: 'rendering' });
      const r = await fetch('api/render', { method: 'POST' });
      if (!r.ok) throw new Error(await r.text());
      const result = await r.json();
      setRenderState({ phase: 'done', count: result.count, output_dir: result.output_dir });
    } catch (e) {
      setRenderState({ phase: 'error', msg: String(e.message || e) });
    }
  };
  renderRef.current = render;

  // Auto-render: 2.5s after the last save settles (dirty → false). Cancels
  // itself if you start typing again or kick off a manual render.
  const renderBusyFlag = renderState.phase === 'saving' || renderState.phase === 'rendering';
  React.useEffect(() => {
    if (!autoRender) return;
    if (dirty || !savedAt || renderBusyFlag) return;
    const t = setTimeout(() => { renderRef.current && renderRef.current(); }, 2500);
    return () => clearTimeout(t);
  }, [autoRender, savedAt, dirty, renderBusyFlag]);

  const openFolder = async () => {
    try { await fetch('api/open-folder', { method: 'POST' }); } catch {}
  };

  const savedLabel = error ? `error: ${error}`
                   : dirty ? 'auto-saving…'
                   : savedAt ? `saved · ${new Date(savedAt).toLocaleTimeString()}` : 'no changes yet';

  const renderBusy = renderState.phase === 'saving' || renderState.phase === 'rendering';
  const renderLabel = renderState.phase === 'saving'    ? 'Saving…'
                    : renderState.phase === 'rendering' ? 'Rendering…'
                    : 'Render';

  return (
    <div style={{
      width: panelWidth, height: '100vh', position: 'fixed', right: 0, top: 0,
      background: '#0a0a0a', borderLeft: '1px solid #2c2c2c',
      color: '#E8DCC8', fontFamily: '"DM Sans", system-ui',
      display: 'flex', flexDirection: 'column', zIndex: 9999,
    }}>
      {/* Drag handle — sits over the left border. */}
      <div onMouseDown={startResize}
        title="Drag to resize panel"
        style={{
          position: 'absolute', left: -4, top: 0, bottom: 0, width: 8,
          cursor: 'col-resize', zIndex: 10000,
        }} />
      <div style={{ display: 'flex', borderBottom: '1px solid #2c2c2c' }}>
        {['slide', 'project', 'paste'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '14px 16px', background: tab === t ? '#0a0a0a' : '#050505',
            color: tab === t ? '#E8DCC8' : '#666',
            border: 0, borderBottom: tab === t ? '2px solid #C0392B' : '2px solid transparent',
            font: '11px "DM Sans", system-ui', letterSpacing: 2, textTransform: 'uppercase',
            fontWeight: 600, cursor: 'pointer',
          }}>{t === 'slide' ? `Slide ${currentIdx + 1}` : t === 'project' ? 'Project' : 'Paste'}</button>
        ))}
      </div>

      {tab === 'slide' && (
        <SlideStrip slides={content.slides} current={currentIdx} dims={content.format_dims}
          onPick={setCurrentIdx} onAdd={addSlide} onDuplicate={duplicateSlide}
          onRemove={removeSlide} onMove={moveSlide} />
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
        {tab === 'slide' && (
          <SlideForm slide={content.slides[currentIdx]} slideIndex={currentIdx}
            onChange={s => updateSlide(currentIdx, s)}
            content={content} setContent={setContent} />
        )}
        {tab === 'project' && <MetaForm content={content} onChange={setContent} />}
        {tab === 'paste' && (
          <PasteTab content={content} setContent={setContent} setCurrentIdx={setCurrentIdx} />
        )}
      </div>

      {renderState.phase === 'done' && (
        <div style={{
          padding: '10px 14px', background: 'rgba(90,168,127,0.10)',
          borderTop: '1px solid #2c2c2c', display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 12, color: '#aef', letterSpacing: 0.5,
        }}>
          <span style={{ color: '#5a8', fontWeight: 600 }}>✓</span>
          <span>Rendered {renderState.count} slide{renderState.count === 1 ? '' : 's'}</span>
          <a
            href="api/download-zip"
            download
            style={{ ...btnSm, marginLeft: 'auto', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          >Download ZIP</a>
          <button onClick={openFolder} style={btnSm}>Open in Finder</button>
        </div>
      )}
      {renderState.phase === 'error' && (
        <div style={{
          padding: '10px 14px', background: 'rgba(192,57,43,0.15)',
          borderTop: '1px solid #2c2c2c', fontSize: 12, color: '#fbb', letterSpacing: 0.5,
          maxHeight: 120, overflowY: 'auto', whiteSpace: 'pre-wrap',
        }}>{renderState.msg}</div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px',
        background: '#050505', borderTop: '1px solid #2c2c2c',
      }}>
        <button onClick={onSave} disabled={!dirty} style={{
          background: dirty ? '#C0392B' : '#1a1a1a', color: dirty ? '#fff' : '#666',
          border: 0, padding: '10px 18px', cursor: dirty ? 'pointer' : 'default',
          font: '11px "DM Sans", system-ui', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600,
        }}>Save</button>
        <button onClick={render} disabled={renderBusy} style={{
          background: renderBusy ? '#1a1a1a' : '#0f0f0f',
          color: renderBusy ? '#888' : '#E8DCC8',
          border: '1px solid #2c2c2c',
          padding: '10px 18px', cursor: renderBusy ? 'wait' : 'pointer',
          font: '11px "DM Sans", system-ui', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600,
        }}>{renderLabel}</button>
        <label
          title="Re-render automatically 2.5s after every save settles. Costs CPU on each edit."
          style={{
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600,
            color: autoRender ? '#E8DCC8' : '#6f6957', userSelect: 'none',
          }}>
          <input type="checkbox" checked={autoRender} onChange={e => setAutoRender(e.target.checked)}
                 style={{ accentColor: '#C0392B', cursor: 'pointer' }} />
          Auto
        </label>
        <div style={{ fontSize: 11, color: error ? '#c0392b' : '#666', letterSpacing: 1, marginLeft: 'auto', textAlign: 'right' }}>
          {savedLabel}
        </div>
      </div>
    </div>
  );
}

window.Editor = Editor;
