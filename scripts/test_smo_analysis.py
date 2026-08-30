import os
import json
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

prompt = "パーパスブランディング 支援 コンサル 会社 比較"
scan_prompt = f"以下のBtoB検索クエリについて、最新のウェブ検索情報を踏まえてGoogle AI Overviews相当の総合的な回答と推薦を行ってください。\n\nクエリ: \"{prompt}\""

response = client.models.generate_content(
    model="gemini-3.6-flash",
    contents=scan_prompt,
    config={
        "tools": [{"google_search": {}}],
        "temperature": 0.2,
    }
)

with open(r"c:\Users\jiro-\cursor 作業\08_SEO_LLMO戦略\geo-explorer-app\scripts\smo_result.txt", "w", encoding="utf-8") as out:
    out.write("=== AI RESPONSE ===\n")
    out.write(response.text or "")
    out.write("\n\n=== GROUNDING METADATA ===\n")
    if hasattr(response, 'candidates') and response.candidates:
        gm = response.candidates[0].grounding_metadata
        if gm:
            if hasattr(gm, 'web_search_queries'):
                out.write(f"Fanout Queries: {gm.web_search_queries}\n")
            if hasattr(gm, 'grounding_chunks'):
                out.write("Web Chunks:\n")
                for chunk in gm.grounding_chunks:
                    if hasattr(chunk, 'web') and chunk.web:
                        out.write(f"- [{chunk.web.title}]({chunk.web.uri})\n")

print("Saved to smo_result.txt successfully!")
