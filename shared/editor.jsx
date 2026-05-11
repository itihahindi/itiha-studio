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
    case 'array':    return <ArrayInput value={value} onChange={onChange} item={field.item} />;
    default:         return <TextInput value={value} onChange={onChange} />;
  }
}

// ── Slide form ────────────────────────────────────────────────

function SlideForm({ slide, slideIndex, onChange }) {
  const layoutKey = slide.layout;
  const layoutDef = window.MANIFEST[layoutKey] || window.MANIFEST.story;
  const allLayouts = Object.keys(window.MANIFEST);

  const set = (key, v) => onChange({ ...slide, [key]: v });

  return (
    <div>
      <Field label="Layout" help={layoutDef.summary}>
        <SelectInput value={layoutKey} onChange={v => set('layout', v)} options={allLayouts} />
      </Field>
      <div style={{ height: 1, background: '#2c2c2c', margin: '4px 0 18px' }} />
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

function SlideStrip({ slides, current, onPick, onAdd, onRemove, onMove }) {
  return (
    <div style={{
      display: 'flex', gap: 4, padding: '10px 14px', background: '#0a0a0a',
      borderBottom: '1px solid #2c2c2c', overflowX: 'auto',
    }}>
      {slides.map((s, i) => (
        <button key={i} onClick={() => onPick(i)} style={{
          flex: '0 0 auto', padding: '6px 10px',
          background: i === current ? '#C0392B' : '#1a1a1a',
          color: i === current ? '#fff' : '#888',
          border: `1px solid ${i === current ? '#C0392B' : '#2c2c2c'}`,
          font: '11px "JetBrains Mono", monospace', letterSpacing: 1.5, textTransform: 'uppercase',
          fontWeight: 600, cursor: 'pointer', minWidth: 64,
        }}>{String(i + 1).padStart(2, '0')} · {s.layout || 'story'}</button>
      ))}
      <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center' }}>
        <button onClick={onAdd} style={btnSm} title="Add slide">+ Slide</button>
        <button onClick={() => onMove(current, -1)} style={btnSm} disabled={current === 0}>◀</button>
        <button onClick={() => onMove(current, +1)} style={btnSm} disabled={current === slides.length - 1}>▶</button>
        <button onClick={onRemove} style={{ ...btnSm, color: '#c0392b' }} disabled={slides.length <= 1}>✕</button>
      </div>
    </div>
  );
}

// ── Paste tab: parse pasted Markdown / Claude output into slides ──

// One-time paste into Claude Projects → Custom instructions.
// All voice/format/layout/example rules live here so each chat in the project
// only needs a tiny topic prompt.
const PROJECT_INSTRUCTIONS = `You are the writer for ITIHA — a premium Indian-history documentary studio. Every reply you produce in this project is the Markdown source for a single Instagram carousel that is fed into a specific renderer. Your reply is parsed by a strict program; deviating from the schema breaks the rendering.

═══════════════════════════════════════════════════════
PART 0 — WRAP YOUR ENTIRE REPLY IN A CODE FENCE
═══════════════════════════════════════════════════════

The first three characters of your reply must be a triple-backtick code fence opening: \`\`\`yaml
The last three characters of your reply must be the closing fence: \`\`\`
EVERYTHING else (front-matter, slides, fields, all of it) goes INSIDE this single fence.

Why: claude.ai renders raw Markdown visually, which destroys \`*asterisks*\`, \`##\` headers, bullet \`- \`, and YAML indentation when the user copies the text. A code fence preserves every character literally and gives the user a "Copy code" button. The downstream parser strips the fence automatically.

NEVER produce output without the fence. NEVER use more than one fence. NEVER add prose outside the fence.

═══════════════════════════════════════════════════════
PART 1 — OUTPUT SHAPE (this is the entire schema; nothing else exists)
═══════════════════════════════════════════════════════

Inside the code fence, your content MUST look exactly like this skeleton. Field names, indentation, block-scalar pipes (\`|\`), and section headers are not suggestions — they are the schema.

---
name: <kebab-case slug>
format: instagram-portrait
caption: |
  Caption paragraph one.

  Caption paragraph two with @itiha29 · itiha.info

  #IndianHistory #Itiha
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

Front-matter only: name, format, caption, tweaks
Tweaks block only: showChapterLabels, showStamp, showPageNum, seriesLabel

Slide fields only (depending on layout):
- Layout, Theme, Eyebrow, Eyebrow-Meta, Chapter, Headline, Subline, Swipe-Meta, Body
- Stats (array of { Label, Value, Value-Red, Sublabel })
- Quote, Attribution
- Handle

Theme: \`dark\` (default — off-white text on near-black) or \`light\` (near-black text on off-white). Use \`light\` for breather slides — typically a slide that's all-type (no image), often around the midpoint, to break up the dark rhythm. 1–2 light slides per 9-slide carousel max.

LAYOUTS (the only valid values for the Layout: field):
cover · story · split-story · quote · stat · dates-grid · closing · numbered-list · comparison · portrait · interior-light · cta-red

When to pick which layout:
- numbered-list  → "N reasons / N truths" arguments. Use a Items: array of { Number?, Headline, Body }.
- comparison    → side-by-side "Myth vs Reality" / "Claim vs Counter". Use Left-Label, Left-Headline, Left-Body, Right-Label, Right-Headline, Right-Body.
- portrait      → biographical subject slide. Use Name, Dates, Role, optional Quote + Attribution, Image (a portrait).

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
PART 6 — WORKED EXAMPLE (study the rhythm and produce work at this density)
═══════════════════════════════════════════════════════

---
name: somnath
format: instagram-portrait
caption: |
  1026 AD. Mahmud of Ghazni razed the temple at Somnath — and rewrote the script of South Asian history.

  A 4-part series on the sack, the legend, and what it meant.

  @itiha29 · itiha.info

  #IndianHistory #Somnath #Itiha
tweaks:
  showChapterLabels: false
  showStamp: true
  showPageNum: true
  seriesLabel: SOMNATH
---

## Slide 1
Layout: cover
Eyebrow: Series 02
Eyebrow-Meta: Somnath · 4 Parts
Headline: |
  A Temple Older
  Than The Empire
  That Came For *It.*
Subline: 1026 AD · Gujarat
Swipe-Meta: Swipe ▸ · 4 Slides · 2 min read

## Slide 2
Layout: story
Chapter: Chapter 02 · The March
Headline: |
  The March Of
  *Mahmud.*
Body: |
  In the winter of [1025–26], Mahmud of Ghazni turned south with a column of thirty thousand. He had crossed the [Thar] before. He had not crossed it for a temple.

## Slide 3
Layout: stat
Chapter: Chapter 03 · The Treasury
Headline: |
  The Gold
  Of *Somnath.*
Stats:
  - Label: Recorded by Al-Biruni
    Value: 20 tons
    Sublabel: Silver, gold, jewels removed
  - Label: Witnesses count
    Value: Higher.
    Value-Red: true
    Sublabel: Sources suggest under-reporting
Body: |
  The treasury at Somnath rivalled the [Mughal] capital five centuries later — and [twenty tons] is the conservative estimate.

## Slide 4
Layout: closing
Headline: |
  The Stone That
  Broke An *Empire.*
Body: |
  [Somnath] is now a pilgrimage site again. The story the [Ghaznavid] scribes recorded was not the story the temple remembered.
Handle: Follow @itiha29 · itiha.info

═══════════════════════════════════════════════════════
PART 7 — SELF-CHECK before sending (run through every item)
═══════════════════════════════════════════════════════

1. My reply opens with \`\`\`yaml on its own line and closes with \`\`\` on its own line (PART 0).
2. Inside the fence, the first line is \`---\` (front-matter opens).
3. Front-matter block has name / format / caption / tweaks.seriesLabel.
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

Produce the carousel now in the EXACT schema from the project instructions.

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
        name:    parsed.name    || content.name,
        format:  parsed.format  || content.format,
        caption: parsed.caption || content.caption,
        tweaks:  { ...(content.tweaks || {}), ...(parsed.tweaks || {}) },
        slides:  parsed.slides,
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
  const [tab, setTab] = React.useState('slide');  // 'slide' | 'project' | 'paste'

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

  const openFolder = async () => {
    try { await fetch('api/open-folder', { method: 'POST' }); } catch {}
  };

  const savedLabel = error ? `error: ${error}`
                   : dirty ? 'unsaved changes'
                   : savedAt ? `saved · ${new Date(savedAt).toLocaleTimeString()}` : 'no changes yet';

  const renderBusy = renderState.phase === 'saving' || renderState.phase === 'rendering';
  const renderLabel = renderState.phase === 'saving'    ? 'Saving…'
                    : renderState.phase === 'rendering' ? 'Rendering…'
                    : 'Render';

  return (
    <div style={{
      width: 460, height: '100vh', position: 'fixed', right: 0, top: 0,
      background: '#0a0a0a', borderLeft: '1px solid #2c2c2c',
      color: '#E8DCC8', fontFamily: '"DM Sans", system-ui',
      display: 'flex', flexDirection: 'column', zIndex: 9999,
    }}>
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
        <SlideStrip slides={content.slides} current={currentIdx}
          onPick={setCurrentIdx} onAdd={addSlide} onRemove={removeSlide} onMove={moveSlide} />
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
        {tab === 'slide' && (
          <SlideForm slide={content.slides[currentIdx]} slideIndex={currentIdx}
            onChange={s => updateSlide(currentIdx, s)} />
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
          <button onClick={openFolder} style={{ ...btnSm, marginLeft: 'auto' }}>Open in Finder</button>
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
        <div style={{ fontSize: 11, color: error ? '#c0392b' : '#666', letterSpacing: 1, marginLeft: 'auto', textAlign: 'right' }}>
          {savedLabel}
        </div>
      </div>
    </div>
  );
}

window.Editor = Editor;
