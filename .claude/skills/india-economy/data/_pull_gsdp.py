import json,time,urllib.request,sys
from concurrent.futures import ThreadPoolExecutor
B="https://api.mospi.gov.in/api/nas/getNASData?frequency_code=Annually&Format=JSON&limit=200"
R="/Users/mohan/Instagram Itiha Renders/_data-raw/state-gsdp/"
def get(q):
    err=None
    for a in range(5):
        try:
            r=urllib.request.Request(B+q,headers={"User-Agent":"Mozilla/5.0"})
            return json.load(urllib.request.urlopen(r,timeout=60))
        except Exception as e:
            err=e; time.sleep(2*(a+1))
    return {"error":str(err)}
jobs=[]
for ind in (23,25,26,27,29):
    for sc in range(1,41):
        if ind==29:
            for yr in ("2023-24","2024-25"): jobs.append((f"{ind}_{sc}_{yr}",f"&base_year=2011-12&series=Current&indicator_code={ind}&state_code={sc}&year={yr}"))
        else: jobs.append((f"{ind}_{sc}",f"&base_year=2011-12&series=Current&indicator_code={ind}&state_code={sc}"))
for ind in (5,22):
    for by in ("2011-12","2022-23"):
        for se in ("Current","Back"):
            jobs.append((f"nat_{ind}_{by}_{se}",f"&base_year={by}&series={se}&indicator_code={ind}"))
with ThreadPoolExecutor(6) as ex: res=list(ex.map(lambda j:get(j[1]),jobs))
json.dump({k:v for (k,_),v in zip(jobs,res)},open(R+"mospi_nas_raw.json","w"))
print(len(jobs))
