import os
from google import genai

env_path = r"c:\Users\jiro-\cursor 作業\08_SEO_LLMO戦略\geo-explorer-app\.env.local"
api_key = None
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("GEMINI_API_KEY="):
                api_key = line.strip().split("=", 1)[1].strip('"').strip("'")
                break

client = genai.Client(api_key=api_key)
for m in client.models.list():
    if "flash" in m.name.lower() or "2.0" in m.name.lower() or "gemini" in m.name.lower():
        print(m.name)
