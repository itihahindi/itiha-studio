# Indian data sources: what works

Fetch status was probed from this machine on **2026-10-27** with a browser
User-Agent. Re-probe before trusting an old "fails". Rows marked ✅ produced
data used in a published graphic.

## Trade

| What | Where | Level | Status / notes |
|---|---|---|---|
| ✅ Exports by **state** of origin | `https://trade-analytics.commerce.gov.in/public/indiaTrade/getStateWiseTableData?year=2024-25&type=Export&currency=USD` (`INR`, other years, `type=Import`) | state | JSON: STATE, VALUE1 (year), VALUE2 (prior), GROWTH, SHARE. DGCI&S data on the Commerce Ministry's TIA portal. Credit: "DGCI&S, via Dept of Commerce TIA portal". |
| ✅ Exports by **district** of origin | `…/getDistrictWiseTableData?year=2024-25&type=Export&currency=USD&state=Gujarat` | district | JSON per state: DISTRICT, VALUE, PREVVAL, GROWTH, SHARE. Loop all 36 states. Includes "Unspecified" rows and stray zero rows. District sums match state totals exactly. |
| niryat.gov.in (same dashboard) | `https://niryat.gov.in/…` | | **TLS certificate is issued for *.commerce.gov.in → hostname mismatch.** Do not bypass; use the trade-analytics host above, which serves the same endpoints with a valid certificate. |
| DGCI&S quarterly review (QRMFT) | `https://www.dgciskol.gov.in/CI_Quarterly_Review.aspx` → PDFs | top-10 districts, commodity | Table 8 top-10 districts per quarter; Table 8a commodity mix (e.g. Jamnagar ~90% HS-27 fuel). Q3 FY25 PDF has a shifted share column: use values, not shares. |
| DGCI&S Selected Statistics of Foreign Trade (SSFTI) | dgciskol.gov.in downloads | India | All-India totals in ₹ and US$. |
| PIB monthly trade release | pib.gov.in | India | Revised annual totals (e.g. FY25 US$ 437.70 bn, 15 Apr 2026). |
| **Don't**: RBI Handbook Table 181 "State-wise Exports", FY 2024-25 column | rbi.org.in | state | Broken for 9 northern states (Haryana 2,493 vs 19,102 actual): an early, incomplete download. |

## Industry and state economy

| What | Where | Level | Status / notes |
|---|---|---|---|
| ✅ Annual Survey of Industries | MoSPI ASI factsheet → Annexure-II **Table 4** xlsx (`mospi.gov.in/uploads/documents/documents/…-Table_4.xlsx`) | state | Factories, workers, persons engaged, output, inputs (GVA = output − inputs). Source spells "Keralam", "Chattisgarh", "A & N. Island"; DNH&DD one row; Lakshadweep not published. Registered factories only; "factories" includes units not operating. ASI 2024-25 released 30 Sep 2026. |
| ✅ GSVA by industry (state accounts) | MoSPI eSankhyiki API: `https://api.mospi.gov.in/api/nas/getNASData?base_year=2011-12&series=Current&frequency_code=Annually&indicator_code=29&state_code=N&year=2023-24&limit=200&Format=JSON` (state_code 1–40) | state | JSON rows per industry ("Manufacturing", "TOTAL GSVA…"), ₹ lakh. Also per-state xlsx files on the NAS product page. Mixed vintages (most 15 Apr 2026; Assam, Haryana, Nagaland, Ladakh 1 Aug 2025). 2024-25 figures are state-supplied, not NSO-vetted. 2011-12 base; moving to 2022-23. |
| **Don't**: RBI Handbook GSVA tables, latest edition | rbi.org.in | state | Gujarat blank for 2023-24 and 2024-25; older vintage than MoSPI. |
| Index of Industrial Production | mospi.gov.in | India | Monthly. |
| DPIIT FDI factsheet | dpiit.gov.in | state (by RBI regional office) | Fetches (200). |
| Udyam (MSME) registrations | udyamregistration.gov.in | state, district | Dashboard. |

## Elections

| What | Where | Level | Status / notes |
|---|---|---|---|
| Results | results.eci.gov.in | PC, AC | Fetches (200), small JS shell; results pages per state. |
| ECI main site, statistical reports | eci.gov.in | | **406 to scripted fetch.** Find the report PDF link via search and fetch the PDF directly, or ask the user. |
| Seats per state | Wikipedia "List of constituencies of the Lok Sabha" | state | Fine for locating; fixed by the Delimitation Order 2008 (Assam re-delimited 2023, same seat count). |

## Money, banking, markets

| What | Where | Level | Status / notes |
|---|---|---|---|
| RBI DBIE | data.rbi.org.in | state, district | Fetches (200); bank credit/deposits by state and district (BSR). |
| RBI Handbook of Statistics on Indian States | rbi.org.in → Publications | state | Fetches (200). Good for long series; **check the latest year against the primary source** (two broken columns found in Oct 2026). |
| Union Budget | indiabudget.gov.in | India | Fetches (200). |
| State budgets | prsindia.org | state | Fetches (200). PRS state budget analyses. |
| GST collections by state | gstcouncil.gov.in, PIB monthly release | state | Fetches (200). |
| Mutual fund AUM by state | amfiindia.com | state, district (top) | Fetches (200). |
| NSE | nseindia.com | | **403 to scripted fetch.** Use NSE Market Pulse PDFs found via search, or BSE. |
| BSE | bseindia.com | | Fetches (200). |
| CAG audit reports | cag.gov.in | state | Fetches (200). |

## People, health, education, everything else

| What | Where | Level | Status / notes |
|---|---|---|---|
| Census, SRS bulletins | censusindia.gov.in | state, district | Fetches (200). SRS = birth/death/IMR by state. |
| NFHS-5 | rchiips.org/nfhs | state, district | **Timed out** from here. NFHS state/district factsheets are mirrored on ndap.niti.gov.in and data.gov.in. |
| NITI Aayog NDAP | ndap.niti.gov.in | state, district | Fetches (200), JS app; datasets have download links. |
| data.gov.in (OGD) | data.gov.in | varies | **Timed out** from here. API needs a key. |
| UDISE+ (schools) | udiseplus.gov.in | state, district | Fetches (200). |
| Power: CEA / renewables: MNRE | cea.nic.in, mnre.gov.in | state | Fetch (200). MNRE: installed RE capacity by state. |
| Petroleum: PPAC | ppac.gov.in | state | Fetches (200). |
| Vehicles / EVs: Vahan | vahan.parivahan.gov.in | state, RTO | **Timed out** (dashboard, JS). Ask the user for an export, or use PIB / ministry replies. |
| Crime: NCRB | ncrb.gov.in | state, city | Fetches (200). "Crime in India" PDFs/xlsx. |
| Agriculture: UPAg, DES | upag.gov.in, desagri.gov.in | state, district | Fetches (200). |
| District codes: LGD | lgdirectory.gov.in | district | Fetches (200). The LGD code is the reliable join key for district maps. |
| Parliament answers | sansad.in (200); eparlib.nic.in / eparlib.sansad.in (**unreachable** from here) | state, district | Unstarred-question annexures are often the only all-states table. Search for the question number, then try the PDF; ask the user if it won't fetch. |
| PIB press releases | pib.gov.in | India, state | Fetches (200). |

## Walled for scripted fetches (use something else)

ThePrint, News18, NDTV, WION, Britannica, Olympics.com, Scroll (Akamai /
Cloudflare): use wire carriers (PTI via Business Standard, ANI) or the
government source. X articles are login-walled. Business Standard fetches.
Wikimedia Commons needs the contact User-Agent (fetch.py sends it).

## Beyond government

Probed 2026-10-27. Government is one kind of source; these fill the gaps.
Use the **trust tiers** in SKILL.md §3 to decide how a number from each can
be used.

| What | Where | Tier | Status / notes |
|---|---|---|---|
| World Bank indicators | `https://api.worldbank.org/v2/country/IND/indicator/<code>?format=json` (e.g. NY.GDP.PCAP.CD); data.worldbank.org | 1 | ✅ JSON API, no key. Country comparisons ("Bihar earns like …"). |
| IMF World Economic Outlook | imf.org datamapper API | 1 | **403 to scripted fetch.** Use the WEO xlsx download found via search, or World Bank. |
| UN Comtrade | `https://comtradeapi.un.org/public/v1/preview/…` | 1 | ✅ preview API without a key (small pulls); full API needs a key. India = reporter 699. |
| Our World in Data | `https://ourworldindata.org/grapher/<chart>.csv?country=IND`; github.com/owid/* raw CSVs | 2 | ✅ CSV per chart. Cite OWID **and** its underlying source (shown on the chart page). |
| Company filings | bseindia.com corporate announcements; company annual reports (PDF); MCA | 1 | ✅ BSE fetches. NSE 403. A statutory filing is primary for that company. |
| Mutual funds, demat | amfiindia.com; NSDL / CDSL; NSE Market Pulse (PDF) | 1–2 | ✅ AMFI. State-wise AUM and investor counts. |
| Candidates' assets, cases | myneta.info, adrindia.org (ADR, from sworn affidavits) | 2 | ✅ Both fetch. Say "self-declared in affidavits, compiled by ADR". |
| Parliament performance | prsindia.org (MP Track, bills, state budgets) | 2 | ✅ |
| Opinion surveys | lokniti.org (Lokniti-CSDS); Pew; C-Voter, Axis (polls) | 2 | ✅ Lokniti fetches. Always give sample size, dates, and who ran it; never present a poll as a count. |
| Cricket stats | stats.espncricinfo.com (Statsguru) | 2 | ✅ stats engine fetches; espncricinfo.com main site 403. |
| Data journalism | indiaspend.com, The Hindu Data, Mint's data stories | 3 | ✅ Use to find the dataset; cite their primary source if they name it. |
| Business press | economictimes, livemint, thehindubusinessline, business-standard, indianexpress, thehindu, hindustantimes, indiatoday | 3 | ✅ All fetch. moneycontrol 403, reuters 401. Locate, then go to the filing / release they quote. |
| Aggregators | tradingeconomics.com, ceicdata.com, statista.com, ibef.org | 3 | ✅ fetch, but mostly teasers or paywalled. Never cite as the source; follow to the original. |
| CMIE (CPHS, Prowess) | cmie.com | 1–2 | ✅ site fetches; data is paid. Cite only figures CMIE published openly (press, reports), attributed. |
| Wikipedia | en.wikipedia.org (API: `w/api.php?action=parse`) | locate | ✅ Tables are good finders; cite the reference they footnote, never Wikipedia. |
