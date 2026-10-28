// VAQ POSTER chart kit. Pairs with poster.css. A page sets window.POST and a
// draw(svg, box, PK) function; PK.run() fills the frame, measures the space
// left for the chart, runs POST.checks, calls draw, and sets __ready.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const MINUS = '−';

  const PK = {
    // Indian grouping (1,01,684), true minus, fixed decimals.
    num(v, dp = 0) {
      const s = Math.abs(v).toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp });
      return (v < 0 ? MINUS : '') + s;
    },
    signed(v, dp = 1) { return (v > 0 ? '+' : v < 0 ? MINUS : '') + PK.num(Math.abs(v), dp); },
    el(parent, tag, attrs = {}, text) {
      const e = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) if (v != null) e.setAttribute(k, v);
      if (text != null) e.textContent = text;
      if (parent) parent.appendChild(e);
      return e;
    },
    // Linear scale.
    scale(d0, d1, r0, r1) { const f = (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0); f.domain = [d0, d1]; return f; },
    // Throw if a number in the copy disagrees with the data.
    check(ok, msg) { if (!ok) throw new Error('copy check failed: ' + msg); },
    css(name) { return getComputedStyle(document.getElementById('canvas')).getPropertyValue(name).trim(); },

    run() {
      const P = window.POST, c = document.getElementById('canvas');
      if (P.ratio) c.classList.add('r-' + P.ratio);
      if (P.look === 'broadsheet') c.classList.add('look-broadsheet');
      c.classList.add('ground-' + (P.ground || 'haldi'));
      if (P.hSize) c.style.setProperty('--h-size', P.hSize + 'px');
      c.insertAdjacentHTML('afterbegin', `
        <div class="pk-slug"><span class="pk-tag"></span><span class="pk-issue"></span></div>
        <h1 class="pk-h1"></h1><p class="pk-dek"></p><div class="pk-chart"><svg></svg></div>
        <footer class="pk-footer"><div class="pk-source"></div><div class="pk-mark">VAQ <span>HQ</span></div></footer>`);
      c.querySelector('.pk-tag').textContent = P.tag;
      c.querySelector('.pk-issue').textContent = P.issue || '@vaq_hq';
      c.querySelector('.pk-h1').innerHTML = P.headline;
      c.querySelector('.pk-dek').innerHTML = P.dek || '';
      c.querySelector('.pk-source').innerHTML = P.source;
      if (P.dekWidth) c.querySelector('.pk-dek').style.width = P.dekWidth + 'px';
      document.fonts.ready.then(() => {
        const h1 = c.querySelector('.pk-h1'), dek = c.querySelector('.pk-dek');
        dek.style.top = h1.offsetTop + h1.offsetHeight + 22 + 'px';
        const top = (P.dek ? dek.offsetTop + dek.offsetHeight : h1.offsetTop + h1.offsetHeight) + (P.gap || 40);
        const foot = c.querySelector('.pk-footer');
        const bottom = foot.offsetTop - (P.gapBottom || 30);
        const chart = c.querySelector('.pk-chart');
        chart.style.top = top + 'px'; chart.style.height = bottom - top + 'px';
        const box = { w: chart.clientWidth, h: bottom - top };
        const svg = chart.querySelector('svg');
        svg.setAttribute('width', box.w); svg.setAttribute('height', box.h);
        svg.setAttribute('viewBox', `0 0 ${box.w} ${box.h}`);
        if (P.checks) P.checks(P.data, PK);
        window.draw(svg, box, PK, chart);
        window.__ready = true;
      });
    },
  };
  window.PK = PK;
  window.__ready = false;
})();
