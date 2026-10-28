# Builds state_gsdp.csv from the raw MoSPI NAS API pull (see _pull_gsdp.py). Run: python3 -I _build_gsdp_csv.py
import json,csv,collections
d=json.load(open("/Users/mohan/Instagram Itiha Renders/_data-raw/state-gsdp/mospi_nas_raw.json"))
API="https://api.mospi.gov.in/api/nas/getNASData?base_year=%s&series=Current&frequency_code=Annually&indicator_code=%s"
ASON="API pulled 2026-10-28 (API prints no as-on date)"
rows=[]
def add(st,y,m,v,u,by,pb,src,ason=ASON):
    if v is None: return
    rows.append([st,y,m,v,u,by,pb,ason,src])
num=lambda s: None if s is None else float(s)
for k,v in d.items():
    if k.startswith(('23_','25_','26_','27_')):
        ind=k.split('_')[0]
        for x in v.get('data',[]):
            st,y=x['state'],x['year']; s=API%('2011-12',ind)
            cp,kp=num(x['current_price']),num(x['constant_price'])
            if ind=='23':
                add(st,y,'gsdp_current',cp,'INR crore','2011-12','current',s); add(st,y,'gsdp_constant',kp,'INR crore','2011-12','constant (2011-12)',s)
            elif ind=='25': add(st,y,'per_capita_nsdp_current',cp,'INR','2011-12','current',s)
            elif ind=='26':
                add(st,y,'nominal_growth',cp,'percent','2011-12','current',s); add(st,y,'real_growth',kp,'percent','2011-12','constant (2011-12)',s)
agri='Agriculture, Livestock, Forestry and Fishing'
ind_set={'Mining and Quarrying','Manufacturing','Electricity, Gas, Water Supply & Other Utility Services','Construction'}
acc=collections.defaultdict(dict)
for k,v in d.items():
    if k.startswith('29_'):
        for x in v.get('data',[]):
            if x['subindustry'] is None and x['current_price']: acc[(x['state'],x['year'])][x['industry']]=float(x['current_price'])
for (st,y),m in sorted(acc.items()):
    t=m.get('Total Gross State Value Added'); parts={k:v for k,v in m.items() if k!='Total Gross State Value Added'}
    if not t or len(parts)!=11 or abs(sum(parts.values())-t)>10: print("skip",st,y); continue
    a=parts[agri]; i=sum(v for k,v in parts.items() if k in ind_set); s=t-a-i
    for n,val in (('share_agri',a),('share_industry',i),('share_services',s)):
        add(st,y,n,round(100*val/t,2),'percent of GSVA','2011-12','current',API%('2011-12','29'))
rank=['First Advance Estimates','Second Advance Estimates','Provisional Estimates','First Revised Estimates','Second Revised Estimates','Third Revised Estimates','Additional Revision','Final Estimates']
for by in ('2011-12','2022-23'):
    best={}
    for ind in ('5','22'):
        for x in d[f'nat_{ind}_{by}_Current'].get('data',[]):
            key=(ind,x['year']); r=rank.index(x['revision'])
            if key not in best or r>best[key][0]: best[key]=(r,x)
    for (ind,y),(r,x) in sorted(best.items()):
        s=API%(by,ind); ason=f"{x['revision']}; "+ASON; cp,kp=num(x['current_price']),num(x['constant_price'])
        if ind=='5':
            add('India',y,'gsdp_current',cp,'INR crore',by,'current',s,ason); add('India',y,'gsdp_constant',kp,'INR crore',by,'constant (%s)'%by,s,ason)
        else:
            add('India',y,'nominal_growth',cp,'percent',by,'current',s,ason); add('India',y,'real_growth',kp,'percent',by,'constant (%s)'%by,s,ason)
rows.sort(key=lambda r:(r[0],r[2],r[5],r[1]))
with open("/Users/mohan/itiha-studio/.claude/skills/india-economy/data/state_gsdp.csv",'w',newline='') as f:
    w=csv.writer(f);w.writerow("state year metric value unit base_year price_basis as_on source_url".split());w.writerows(rows)
print(len(rows))
S=[r for r in rows if r[0]!='India']
for m in ('real_growth','per_capita_nsdp_current','gsdp_current'):
    for yr in ('2024-25','2025-26'):
        sub=sorted(((r[3],r[0]) for r in S if r[2]==m and r[1]==yr),reverse=True)
        print(m,yr,len(sub),'TOP',sub[:5],'BOT',sub[-5:])
print("states w/ share 2024-25:",sorted(r[0] for r in S if r[2]=='share_agri' and r[1]=='2024-25'))
print("share only 2023-24:",sorted(set(r[0] for r in S if r[2]=='share_agri' and r[1]=='2023-24')-set(r[0] for r in S if r[2]=='share_agri' and r[1]=='2024-25')))
print("no GSDP:",sorted(set(r[0] for r in S)-set(r[0] for r in S if r[2]=='gsdp_current')))
print([(r[1],r[3],r[7][:25]) for r in rows if r[0]=='India' and r[2]=='gsdp_current' and r[5]=='2011-12'][-4:])
