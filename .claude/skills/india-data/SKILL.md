---
name: india-data
description: Find, fetch and verify data about India from any source (government ministries, MoSPI, RBI, DGCI&S trade, ECI, Census, NFHS, Parliament answers, World Bank / UN, company filings, markets, ADR affidavits, surveys, OWID, sports stats) by state, district or constituency, with provenance a published post can stand on. Use whenever a VAQ / Itiha post, map or infographic needs real numbers, or when asked to "find the data", "get state-wise / district-wise figures", or check a statistic.
---

# Indian data

Numbers that go on a VAQ or Itiha post have to survive a hostile reader.
Government is one kind of source; international bodies, company filings,
affidavit compilations, surveys and data projects are others (user,
2026-10-27). The trust tiers in §3 say how each can be used. This
skill is how they get found, checked and recorded. The catalogue of sources
(what's where, what fetches, what's broken) is **[sources.md](sources.md)**:
read the relevant section first.

## 1. Find the primary table

- Go to the body that **produces** the number: DGCI&S for trade, MoSPI for
  ASI and state accounts, ECI for elections, RGI for SRS / Census, IIPS for
  NFHS, RBI for banking. Aggregators (RBI Handbook, NDAP, data.gov.in,
  Wikipedia, news stories) are for **finding** the table, not citing it.
- Prefer machine-readable: a JSON endpoint behind a government dashboard, an
  xlsx annexure, then a PDF table. Dashboards usually have a JSON endpoint:
  look at the page's network requests, or its script for `get…Data` URLs.
- Parliament answers (Lok Sabha / Rajya Sabha unstarred questions) are often
  the only place a ministry publishes an all-states or all-districts table.

## 2. Fetch

```bash
python3 .claude/skills/india-data/fetch.py "<url>" --out infographics/<slug>/<name>.<ext>
```

It prints the JSON records, every row of an xlsx (no openpyxl needed), or a
PDF's page count. Read PDFs with the Read tool (`pages: "1-5"`); use the
`anthropic-skills:pdf` skill for awkward tables.

- **Never disable TLS verification** or otherwise get around a block. A
  certificate error or a wall means: find the same data on another host (the
  Commerce Ministry's trade data is on both niryat.gov.in, whose certificate is
  wrong, and trade-analytics.commerce.gov.in, whose certificate is fine), find
  a published file, or ask the user to download it.
- For many similar calls (36 states × an endpoint), loop in Python with a short
  pause and retries, and save the raw responses together as one JSON.

## 3. Verify

**Trust tiers.**

| Tier | What | How it can be used |
|---|---|---|
| 1 | The body that produced the number: ministries, MoSPI, RBI, ECI, courts, a company's statutory filing, World Bank / UN / IMF | Cite directly. Headline-grade after a cross-check. |
| 2 | Curated from tier 1 with a stated method: OWID, PRS, ADR / MyNeta (affidavits), Lokniti-CSDS and other surveys, NDAP, Statsguru | Cite **with** attribution ("compiled by ADR from affidavits", "Lokniti-CSDS survey, n = …"). Polls: sample, dates, pollster, never as a count. |
| 3 | News, data journalism, aggregators (Trading Economics, CEIC, Statista, IBEF), Wikipedia | Locate only. Follow to tier 1 or 2. If a figure exists only here, attribute it in the copy ("as reported by Mint") and keep it out of the headline. |

- **Cross-check every number that will be in a headline** against a second
  official vintage or publication (the state total vs the sum of its
  districts, the quarterly report vs the annual table, the API vs the xlsx).
  Write down what was checked.
- **Watch for broken columns.** Sum the units and compare with the official
  total; a gap far bigger than other years means an incomplete download (this
  caught the RBI Handbook's FY25 exports column, Oct 2026).
- **Record the vintage.** Provisional numbers get revised (Jamnagar's FY25
  exports moved $6.5 bn between versions). Put "provisional, as of <month>" on
  the post.
- **State the denominator.** "Share of India" vs "share of the state-attributed
  sum" differ by the unattributed slice; say which.
- **Name the coverage.** ASI = registered factories only; exports by "state of
  origin" ≠ port; state GSVA ≠ ASI GVA. One line in the footnote.
- **Delegating?** Brief research agents with the exact state names, the unit
  and year wanted, "mark missing, never estimate", and "show the arithmetic".
  Then re-fetch the key table yourself before publishing. Agents' numbers
  were right in Oct 2026, but the check is what makes them publishable.

## 4. Keep the provenance with the post

Save the raw source file next to the page
(`infographics/<slug>/<source>-<year>.json|xlsx`), and build the page's data
from it in a script, never by retyping. The page's `checks()` recomputes every
number in the headline and dek from that data. The footer names the source,
the year, the vintage date, and any coverage caveat.

## 5. Units and formats

- ₹: lakh / crore with Indian grouping (`toLocaleString('en-IN')` → 1,01,684).
  US$: million / billion. Never mix in one graphic.
- Fiscal years as `FY 2024-25` (April to March).
- State names: the IndiaMap names (see the india-map skill); its resolver
  handles "Orissa", "J&K", "Keralam", "Dadra,NH,Daman,Diu" etc.
- Districts: join on the **LGD code** when the source has one; otherwise
  names plus a crosswalk (india-map ships one for DGCI&S).
