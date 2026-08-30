import urllib.request
import json

url = "https://wpxmzrspzeoaarnoddgs.supabase.co"
key = "sb_publishable_XPmcMHPVuwMdDQL1Bi0MCw_KVYYk1VG"

req_url = f"{url}/rest/v1/organizations?select=*"
req = urllib.request.Request(req_url, headers={
    "apikey": key,
    "Authorization": f"Bearer {key}",
}, method="GET")

try:
    with urllib.request.urlopen(req) as resp:
        orgs = json.loads(resp.read().decode("utf-8"))
        print("Orgs:", orgs)
        for org in orgs:
            org_id = org["id"]
            patch_url = f"{url}/rest/v1/organizations?id=eq.{org_id}"
            patch_data = json.dumps({"used_credits": 0}).encode("utf-8")
            p_req = urllib.request.Request(patch_url, data=patch_data, headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            }, method="PATCH")
            with urllib.request.urlopen(p_req) as p_resp:
                print(f"Reset org {org_id} used_credits to 0 successfully!")
except Exception as e:
    print("Error resetting credits:", e)
