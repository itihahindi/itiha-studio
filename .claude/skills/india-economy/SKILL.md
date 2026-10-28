---
name: india-economy
description: Ready-made, verified datasets on India's economy and public finances (state debt-to-GSDP, state GSDP / growth / per capita income / sector shares, national GDP growth and size, government debt, fiscal deficit, CPI, Minority Affairs budget, defence exports and arms buyers, Jio telecom and IPO) plus a menu of chart ideas that combine them. Use when asked for economic data, state-wise economy / debt / growth comparisons, "economic charts", a series of economy posts, or before hunting for any of these numbers from scratch.
---

# India economy datasets

Collected 2026-10-28 for a VAQ economy series (user: "state debt to GDP, debt
taken by each state, growth state-wise, all economics-related data… try
permutations and combinations… then the country as well"). The tidy CSVs in
`data/` are the single place these numbers live. Charts built from them are in
`infographics/` (list below), all queued in the outbox.

Finding *new* data is the **india-data** skill. Drawing is **data-infographic**
and **india-map**. This skill is what was already found, how far it can be
trusted, and what to make with it.

## 1. Datasets

| File | What | Source | Coverage |
|---|---|---|---|
| `data/state_finances.csv` | debt_to_gsdp, gfd / gfd_to_gsdp, revenue_receipts, interest_payments, interest_to_rr (derived) | PRS *State of State Finances* (Oct 2025) Annexure Table 4; PRS state budget analyses 2026-27 | 28 states; debt/GSDP 2020-21 to 2024-25 (whole %), 2025-26 RE / 2026-27 BE for most |
| `data/state_gsdp.csv` | gsdp_current / _constant, real / nominal growth, per_capita_nsdp_current, share_agri / industry / services | MoSPI eSankhyiki NAS API (`api.mospi.gov.in/api/nas/getNASData`, indicators 23, 25, 26, 29) | 30 states/UTs 2011-12 to 2024-25; 15 have 2025-26. 2011-12 base only |
| `data/india_macro.csv` | GDP current / constant, real / nominal growth, per capita NNI, centre fiscal deficit, centre / states / general-govt debt % GDP, CPI | MoSPI API + NSO press notes (7 Jan, 5 Jun 2026), Union Budget 2026-27, RBI Handbook HTML tables | 2010-11 to 2025-26 (2026-27 BE for budget items); both bases, never mixed |
| `data/budget/moma-budget.csv` | Ministry of Minority Affairs BE / RE / actual net / gross | Union Budget Notes on Demands for Grants | 2010-11 to 2026-27 |
| `data/defence/defence-exports.csv` | defence exports ₹ crore | MoD (PIB 2 Apr 2026), Parliament replies | FY14 to FY26 |
| `data/defence/recip_*.csv`, `defence_buyers.csv` | buyers of Indian major arms (SIPRI TIV), deals | SIPRI Arms Transfers DB (pulled 28 Oct 2026), PIB | 2015-2025 |
| `data/jio/*.csv`, `jio_ipo.md` | Jio customers, TRAI market share, ARPU, revenue / EBITDA / PAT, IPO terms | RIL annual reports + results releases, TRAI, Jio Platforms DRHP (SEBI Jun 2026) | Dec 2016 to Jun 2026 (TRAI Aug 2026) |

Rebuild scripts sit next to the data (`_pull_gsdp.py`, `_build_gsdp_csv.py`,
`build_india_macro.py`). Raw downloads are outside the repo in
`~/Instagram Itiha Renders/_data-raw/` (state-gsdp, india-macro, jio).

## 2. Traps (learned the hard way)

- **Two GDP bases.** MoSPI moved national accounts to a **2022-23 base** on
  27 Feb 2026; the new series starts in 2022-23. **States are still 2011-12
  base.** Compare a state with India on the *same* base (India 2024-25 real
  growth: 6.5% old base, 7.1% new). Long national runs stay on the old base.
- **The API's own growth rows can be stale.** India 2024-25 old-base growth
  shows 6.4 in the API; the levels and the NSO press note say **6.5**. Prefer
  the dated press note; recompute growth from levels when they disagree.
- **RBI files are CAPTCHA-walled** to scripts (`rbidocs.rbi.org.in`). RBI's
  *HTML* tables on rbi.org.in fetch fine. Never work around the CAPTCHA; ask
  the user to download the XLSX (State Finances Statements 19/20 give ₹ crore
  liabilities and the 2015-16 onward debt series PRS lacks).
- **State debt definitions differ.** Some states exclude 50-year interest-free
  central capex loans, off-budget borrowings are outside the headline, and
  PRS rounds to whole %. Use the PRS Table 4 "actual" column (the other
  column is the 15th FC path) for one consistent cross-state series.
- **State GSDP 2024-25 / 2025-26 is state-supplied**, not NSO-vetted; say so.
  Rank states within one year only (latest years differ by state).
- **General-government debt nets out centre-state holdings**, so it is less
  than centre + states. Debt ratios in `india_macro.csv` are *derived* (RBI
  stocks ÷ MoSPI GDP) except rows marked `_official`; label them as ours.
- **SIPRI TIV is not money** and excludes parts and ammunition; MoD's rupee
  total includes them. The two never reconcile.
- **Jio**: company customer counts (all RJIL) exceed TRAI's wireless count;
  Jio Platforms financials ≠ RJIL. Listing-day price was unconfirmed on
  28 Oct 2026; don't publish press-only prices.

## 3. Chart menu (built ✓, or ready to build)

State finances and economies
- ✓ Debt-to-GSDP map, only 3 states under the 20% FRBM-review ceiling (`state-debt-map`)
- ✓ Debt change 2020-21 → 2024-25, 26 of 28 fell (`state-debt-change`)
- ✓ Per capita income map, Sikkim 9× Bihar (`state-income-map`)
- ✓ Real growth ranking vs India (`state-growth-ranking`)
- ✓ Five states ≈ half of GDP, waffle (`state-gdp-top5`)
- ✓ Debt × growth scatter, Punjab / Himachal / Kerala quadrant (`state-debt-vs-growth`)
- Interest as % of revenue receipts (needs RBI Statement 13 for full coverage)
- Fiscal deficit % GSDP vs the 3% limit, 2026-27 BE (in `state_finances.csv`, 24 states)
- Sector mix: services vs industry vs agriculture share by state (`share_*`)
- Per capita income growth 2011-12 → 2024-25 (convergence or divergence)
- Debt per person (needs population projections, MoHFW technical group)

India
- ✓ Real growth since 2010-11, one negative year (`india-gdp-growth`)
- ✓ Real GDP 2.4× its 2010-11 size (`india-gdp-size`)
- ✓ Government debt, Covid peak 89% → 82% (`india-govt-debt`)
- ✓ Centre's fiscal deficit halved since Covid (`india-fiscal-deficit`)
- Nominal vs real growth (the inflation gap), CPI line

Sector stories
- ✓ Minority Affairs budget and scholarships by community (`minority-affairs-budget`, `minority-scholarships-by-community`)
- ✓ Defence exports 56× in 12 years; who buys (`india-defence-exports`, `india-arms-buyers`)
- ✓ Jio customers, market share, IPO card (`jio-subscribers`, `jio-market-share`, `jio-ipo-numbers`)

## 4. House rules for this series

- Alternate grounds post to post (haldi / coal). Every number in headline or
  dek is recomputed in `checks()`.
- House type sizes (data-infographic styles.md §2): dek 40, labels 36,
  values 40, secondary 31, source 23. State lists are cut to the top / bottom
  few, and maps are pattern maps with heroes.
- Whitepill where the data supports it (user, 2026-10-28: "something
  positive… built this much, plans more"), never at the cost of accuracy:
  name the caveat in the dek or footer.
- Finished pieces go to the outbox with a caption (CLAUDE.md, Outbox).
- Delegate refreshes and new hunts to a Sonnet agent; verify headline numbers
  against the raw file yourself before publishing.
