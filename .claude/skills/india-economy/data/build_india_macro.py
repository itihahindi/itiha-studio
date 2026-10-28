"""Builds india_macro.csv from the raw files in RAW (nothing typed by hand except the
PIB/Budget-document figures marked HAND, which are copied from the saved PDFs' text)."""
import json,csv,re,sys
RAW="/Users/mohan/Instagram Itiha Renders/_data-raw/india-macro/"
OUT="/Users/mohan/itiha-studio/.claude/skills/india-economy/data/india_macro.csv"
rows=[]
def add(year,metric,value,unit,base,basis,source,url,rel=""):
    rows.append(dict(year=year,metric=metric,value=value,unit=unit,base_year=base,basis=basis,source=source,source_url=url,release_date=rel))
def yrs(a,b): return [f"{y}-{str(y+1)[2:]}" for y in range(a,b+1)]
def table(fn):
    d={}
    for l in open(RAW+fn):
        c=[x.strip() for x in l.split(' | ')]
        d[c[0]]=c[1:]
    return d
# ---------- MoSPI API, base 2011-12
api=json.load(open(RAW+'mospi_nas_api_base2011-12_gdp_ndp_gni_growth.json'))
back=json.load(open(RAW+'mospi_nas_api_base2011-12_BACKSERIES_2009-12.json'))
order=['First Advance Estimates','Second Advance Estimates','Provisional Estimates','First Revised Estimates','Second Revised Estimates','Third Revised Estimates','Final Estimates','Additional Revision']
best={}
for r in api:
    k=(r['year'],r['indicator']); rk=order.index(r['revision'])
    if k not in best or rk>best[k][0]: best[k]=(rk,r)
lab={'First Advance Estimates':'AE (First Advance)','Second Advance Estimates':'AE (Second Advance)','Provisional Estimates':'PE','First Revised Estimates':'RE (First Revised)','Second Revised Estimates':'RE (Second Revised)','Third Revised Estimates':'RE (Third Revised)','Final Estimates':'Actual (Final)','Additional Revision':'RE (Additional revision after Third Revised)'}
API="https://api.mospi.gov.in/api/nas/getNASData?base_year=2011-12&series=Current&frequency_code=Annually&indicator_code=5&year=%s&Format=JSON"
BAPI="https://api.mospi.gov.in/api/nas/getNASData?base_year=2011-12&series=Back&frequency_code=Annually&indicator_code=5&year=%s&Format=JSON"
B="2011-12"; SRC="MoSPI NAS eSankhyiki API (latest revision per year)"
bk={r['year']:r for r in back if r['indicator']=='Gross Domestic Product'}
gdp_cur={};gdp_con={}
for y in yrs(2010,2025):
    if y=='2010-11':
        r=bk[y]; basis='Back series (2011-12 base, no revision label)'; src="MoSPI NAS eSankhyiki API, Back series"; url=BAPI%y
    else:
        r=best[(y,'Gross Domestic Product')][1]; basis=lab[r['revision']]; src=SRC; url=API%y
        if y=='2025-26': basis='AE (First Advance, 7 Jan 2026; old 2011-12 series discontinued after this)'
    gdp_cur[y]=int(r['current_price']); gdp_con[y]=int(r['constant_price'])
    add(y,'gdp_current_cr',gdp_cur[y],'Rs crore',B,basis,src,url)
    add(y,'gdp_constant_cr',gdp_con[y],'Rs crore (2011-12 prices)',B,basis,src,url)
# growth: published in API for 2012-13..2022-23; PIB 7 Jan 2026 for 2024-25 & 2025-26; derived elsewhere
for y in yrs(2012,2022):
    g=best[(y,'GDP Growth Rate')][1]
    add(y,'real_growth_pct',float(g['constant_price']),'%',B,lab[g['revision']],SRC+' (indicator GDP Growth Rate)',API.replace('indicator_code=5','indicator_code=22')%y)
    add(y,'nominal_growth_pct',float(g['current_price']),'%',B,lab[g['revision']],SRC+' (indicator GDP Growth Rate)',API.replace('indicator_code=5','indicator_code=22')%y)
bg={}
def der(y,p,store):
    return round((store[y]/store[p]-1)*100,1)
# derived: 2010-11 (2009-10 back level), 2011-12 (back 2011-12 level), 2023-24
b09=bk['2009-10']; b10=bk['2010-11']; b11=bk['2011-12']
add('2010-11','real_growth_pct',round((int(b10['constant_price'])/int(b09['constant_price'])-1)*100,1),'%',B,'derived from Back-series levels','MoSPI NAS API Back series (derived)',BAPI%'2010-11')
add('2010-11','nominal_growth_pct',round((int(b10['current_price'])/int(b09['current_price'])-1)*100,1),'%',B,'derived from Back-series levels','MoSPI NAS API Back series (derived)',BAPI%'2010-11')
add('2011-12','real_growth_pct',round((int(b11['constant_price'])/int(b10['constant_price'])-1)*100,1),'%',B,'derived from Back-series levels','MoSPI NAS API Back series (derived)',BAPI%'2011-12')
add('2011-12','nominal_growth_pct',round((int(b11['current_price'])/int(b10['current_price'])-1)*100,1),'%',B,'derived from Back-series levels','MoSPI NAS API Back series (derived)',BAPI%'2011-12')
add('2023-24','real_growth_pct',der('2023-24','2022-23',gdp_con),'%',B,'derived from latest-vintage levels (API row published 9.1 at FRE time against an earlier 2022-23 level)','MoSPI NAS API (derived)',API%'2023-24')
add('2023-24','nominal_growth_pct',float(best[('2023-24','GDP Growth Rate')][1]['current_price']),'%',B,'RE (First Revised)',SRC,API.replace('indicator_code=5','indicator_code=22')%'2023-24')
PIB1="https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/jan/doc202617752701.pdf"
for y,rg,ng,bs in [('2024-25',6.5,9.8,'PE'),('2025-26',7.4,8.0,'AE (First Advance)')]:   # HAND: PIB 7 Jan 2026 key highlights / Annexure A
    add(y,'real_growth_pct',rg,'%',B,bs,'MoSPI/NSO Press Note, First Advance Estimates 2025-26 (7 Jan 2026)',PIB1,'2026-01-07')
    add(y,'nominal_growth_pct',ng,'%',B,bs,'MoSPI/NSO Press Note, First Advance Estimates 2025-26 (7 Jan 2026)',PIB1,'2026-01-07')
# ---------- per capita NNI, 2011-12 base (RBI Handbook reproduces NSO)
H="https://rbi.org.in/scripts/PublicationsView.aspx?id=%d"
pc=[('2013-14',79118,'RE (Third Revised)',19734,'2020-09-18'),('2014-15',86647,'RE (Third Revised)',19734,'2020-09-18'),('2015-16',94797,'RE (Third Revised)',19734,'2020-09-18'),('2016-17',104880,'RE (Third Revised)',20406,'2021-09-15'),
    ('2017-18',115224,'RE (Third Revised)',22475,'2024-09-13'),('2018-19',125946,'RE (Third Revised)',22475,'2024-09-13'),('2019-20',132341,'RE (Third Revised)',22475,'2024-09-13'),
    ('2020-21',127244,'RE (Third Revised)',23826,'2026-07-31'),('2021-22',150906,'RE (Second Revised)',23826,'2026-07-31'),('2022-23',169145,'Actual (Final)',23826,'2026-07-31')]
for y,v,bs,i,rd in pc:
    add(y,'per_capita_nni_current_rs',v,'Rs',B,bs,'RBI Handbook of Statistics on the Indian Economy, Table 1 (source NSO)',H%i,rd)
add('2023-24','per_capita_nni_current_rs',188892,'Rs',B,'RE (First Revised)','MoSPI/NSO Press Note 7 Jan 2026, Annexure A Statement 4',PIB1,'2026-01-07')
add('2024-25','per_capita_nni_current_rs',205324,'Rs',B,'PE','MoSPI/NSO Press Note 7 Jan 2026, Annexure A Statement 4',PIB1,'2026-01-07')
add('2025-26','per_capita_nni_current_rs',219575,'Rs',B,'AE (First Advance)','MoSPI/NSO Press Note 7 Jan 2026, Annexure A Statement 4',PIB1,'2026-01-07')
# ---------- new series, base 2022-23 (PIB 5 Jun 2026, Statements 1-2, copied from pe.txt)
PIB2="https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/jun/doc202665884801.pdf"; N="2022-23"
S2="MoSPI/NSO Press Note, Provisional Estimates 2025-26 (5 Jun 2026), Statements 1-2"
newb={'2022-23':'Actual (series base year; label not stated in note)','2023-24':'Revised (label not stated in note)','2024-25':'RE (First Revised)','2025-26':'PE'}
cur={'2022-23':26117627,'2023-24':28983909,'2024-25':31807309,'2025-26':34635638}
con={'2022-23':26117627,'2023-24':28000767,'2024-25':29988619,'2025-26':32312034}
pcn={'2022-23':159557,'2023-24':176465,'2024-25':192774,'2025-26':208090}
rg={'2023-24':7.2,'2024-25':7.1,'2025-26':7.7}; ng={'2023-24':11.0,'2024-25':9.7,'2025-26':8.9}
for y in cur:
    add(y,'gdp_current_cr',cur[y],'Rs crore',N,newb[y],S2,PIB2,'2026-06-05')
    add(y,'gdp_constant_cr',con[y],'Rs crore (2022-23 prices)',N,newb[y],S2,PIB2,'2026-06-05')
    add(y,'per_capita_nni_current_rs',pcn[y],'Rs',N,newb[y],S2,PIB2,'2026-06-05')
    if y in rg:
        add(y,'real_growth_pct',rg[y],'%',N,newb[y],S2,PIB2,'2026-06-05'); add(y,'nominal_growth_pct',ng[y],'%',N,newb[y],S2,PIB2,'2026-06-05')
# ---------- fiscal: RBI Handbook T86 (Budget documents)
t86=table('rbi_hb_t86_central_deficits_id23911.txt'); t104=table('rbi_hb_t104_central_liabilities_id23929.txt')
t105=table('rbi_hb_t105_state_liabilities_id23930.txt'); t106=table('rbi_hb_t106_combined_liabilities_id23931.txt'); t34=table('rbi_hb_t34_cpi_id23859.txt')
def basis_fy(y): return 'BE' if y=='2026-27' else 'RE' if y=='2025-26' else 'Actual'
RH="RBI Handbook 2025-26 (Jul 2026), Table %s (from Union Budget documents)"
for y in yrs(2010,2026):
    add(y,'centre_fiscal_deficit_cr',int(t86[y][0]),'Rs crore','n/a',basis_fy(y),RH%'86',H%23911,'2026-07-31')
    add(y,'centre_outstanding_liabilities_cr',int(t104[y][9]),'Rs crore (end-March; external at current exchange rate)','n/a',basis_fy(y),RH%'104',H%23929,'2026-07-31')
BAG="https://www.indiabudget.gov.in/doc/Budget_at_Glance/bag1.pdf"
for y,v,bs in [('2024-25',4.8,'Actual'),('2025-26',4.4,'RE'),('2026-27',4.3,'BE')]:
    add(y,'centre_fiscal_deficit_pct_gdp',v,'% of GDP','2011-12 (Budget GDP projection)',bs,'Budget at a Glance 2026-27 (denominator: GDP 33,068,145 / 35,713,886 AE / 39,300,393 projected, all old-base)',BAG,'2026-02-01')
FR="https://www.indiabudget.gov.in/doc/frbm1.pdf"
add('2025-26','centre_debt_pct_gdp_official',56.1,'% of GDP','2011-12 (Budget GDP projection)','RE','Statements of Fiscal Policy (FRBM), Feb 2026: Central Government Debt (external at current rate, public account, EBR)',FR,'2026-02-01')
add('2026-27','centre_debt_pct_gdp_official',55.6,'% of GDP','2011-12 (Budget GDP projection)','BE','Statements of Fiscal Policy (FRBM), Feb 2026',FR,'2026-02-01')
RB="https://www.indiabudget.gov.in/doc/rec/allrec.pdf"
for y,v,bs in [('2021-22',13545914.98,'Actual'),('2022-23',15223687.59,'Actual'),('2023-24',16978099.75,'Actual'),('2024-25',18295932.57,'Actual'),('2025-26',19718316.00,'RE'),('2026-27',21482350.41,'BE')]:
    add(y,'centre_outstanding_liabilities_budget_stmt_cr',round(v),'Rs crore (external at historical rate)','n/a',bs,'Receipt Budget 2026-27, Statement of Liabilities of the Central Government',RB,'2026-02-01')
# derived ratios
def ratio(metric,num,denom,base,label,src,yrs_,note_basis=lambda y:''):
    bf=(lambda y:'RE' if y=='2024-25' else 'BE' if y=='2025-26' else 'Actual') if metric.startswith('states') else basis_fy
    for y in yrs_:
        v=round(num(y)/denom[y]*100,1)
        add(y,metric,v,'% of GDP (derived)',base,bf(y),src,'')
D1="derived: RBI Handbook stock or Budget deficit / MoSPI nominal GDP (base %s)"
for base,gd,yy in [('2011-12',gdp_cur,[y for y in yrs(2010,2025) if y<='2025-26']),('2022-23',cur,yrs(2022,2025))]:
    ys=[y for y in yy if not (base=='2011-12' and y=='2024-25')]
    ratio('centre_fiscal_deficit_pct_gdp',lambda y:int(t86[y][0]),gd,base,'',D1%base+' (Table 86)',ys)
    ratio('centre_outstanding_liabilities_pct_gdp',lambda y:int(t104[y][9]),gd,base,'',D1%base+' (Table 104)',yy)
    ratio('general_govt_debt_to_gdp_pct',lambda y:int(t106[y][5]),gd,base,'',D1%base+' (Table 106 combined centre+states total liabilities; centre 2024-25/2025-26 not yet updated in this table vs Table 104)',yy)
    ratio('states_combined_debt_to_gdp_pct',lambda y:int(t105[y][13]),gd,base,'',D1%base+' (Table 105 total outstanding liabilities of states; 2024-25 RE, 2025-26 BE)',yy)
for y in yrs(2010,2025):
    add(y,'states_combined_liabilities_cr',int(t105[y][13]),'Rs crore (end-March)','n/a','RE' if y=='2024-25' else 'BE' if y=='2025-26' else 'Actual',RH%'105',H%23930,'2026-07-31')
    add(y,'general_govt_combined_liabilities_cr',int(t106[y][5]),'Rs crore (end-March; intra-govt loans netted)','n/a','as published',RH%'106',H%23931,'2026-07-31')
add('2025-26','states_combined_debt_to_gdp_pct_official',29.2,'% of GDP','RBI (GDP basis per report)','BE','RBI State Finances: A Study of Budgets of 2025-26 (23 Jan 2026), outstanding liabilities of states - figure read from RBI press release summary via search, not fetched','https://website.rbi.org.in/documents/d/rbi/pr1982sfr23012026','2026-01-23')
# CPI (derived from RBI Handbook Table 34 annual-average combined index, base 2012=100)
idx={y:float(t34[y][5]) for y in yrs(2011,2024)}
for y in yrs(2012,2024):
    p=f"{int(y[:4])-1}-{y[4:] if False else str(int(y[:4]))[2:]}"
    add(y,'cpi_inflation_pct',round((idx[y]/idx[p]-1)*100,1),'%','2012=100','derived from annual-average CPI-Combined index (index rounded to 0.1)','RBI Handbook 2025-26 Table 34 (source MoSPI)',H%23859,'2026-07-31')
# IMF cross-check (relayed)
imf={2010:67.7,2011:68.7,2012:68.1,2013:68.0,2014:67.6,2015:69.7,2016:69.7,2017:70.7,2018:71.6,2019:76.5,2020:90.4,2021:85.5,2022:84.4,2023:84.7,2024:84.8,2025:84.3}
for k,v in imf.items():
    add(f"{k}-{str(k+1)[2:]}",'general_govt_debt_to_gdp_pct_imf_crosscheck',v,'% of GDP','IMF WEO (vintage unstated)','IMF WEO as relayed by statisticsoftheworld.com (tier 3; IMF site 403; year labels assumed = fiscal year starting that calendar year; a second relay gave 81.4 for 2025 - treat as unreliable)','https://statisticsoftheworld.com/country/india/government-debt','')
cols=['year','metric','value','unit','base_year','basis','source','source_url','release_date']
rows.sort(key=lambda r:(r['metric'],r['base_year'],r['year']))
with open(OUT,'w',newline='') as f:
    w=csv.DictWriter(f,cols); w.writeheader(); w.writerows(rows)
print(len(rows),'rows')
