import os
import json
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENSHOTS_DIR = os.path.join(WORKSPACE_DIR, "screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

# SVG Favicon Data URIs for crisp offline rendering
FAVICONS = {
    "github": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'><path fill-rule='evenodd' clip-rule='evenodd' d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z'/></svg>",
    "react": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='-11.5 -10.23174 23 20.46348' fill='none' stroke='%2361dafb' stroke-width='1'><circle cx='0' cy='0' r='2.05' fill='%2361dafb'/><ellipse rx='11' ry='4.2'/><ellipse rx='11' ry='4.2' transform='rotate(60)'/><ellipse rx='11' ry='4.2' transform='rotate(120)'/></svg>",
    "gemini": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23818cf8'><path d='M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z'/></svg>",
    "nextjs": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180' width='180' height='180'><circle cx='90' cy='90' r='90' fill='%23000'/><path fill='%23fff' d='M149.508 157.438L69.147 54H54v71.979h11.976V69.937l72.247 92.812a89.444 89.444 0 0 0 11.285-5.311z'/><rect fill='%23fff' x='115' y='54' width='12' height='46'/></svg>",
    "supabase": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2324b47e'><path d='M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L.194 13.62a.792.792 0 0 0 .616 1.286H10v8.698a.396.396 0 0 0 .716.233l11.09-13.456a.792.792 0 0 0-.444-1.027z'/></svg>",
    "tailwind": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2338bdf8'><path d='M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z'/></svg>",
    "huggingface": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffd21e'><circle cx='12' cy='12' r='10'/><circle cx='8.5' cy='9.5' r='1.5' fill='%23000'/><circle cx='15.5' cy='9.5' r='1.5' fill='%23000'/><path d='M8 15s1.5 2 4 2 4-2 4-2' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round'/></svg>",
    "arxiv": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ef4444'><rect width='24' height='24' rx='4'/><text x='12' y='17' font-family='sans-serif' font-size='11' font-weight='bold' fill='white' text-anchor='middle'>aX</text></svg>",
    "airplane": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f59e0b'><path d='M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z'/></svg>",
    "figma": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ec4899'><circle cx='12' cy='12' r='10'/><path d='M8 6h4a2 2 0 0 1 0 4H8zm0 4h4a2 2 0 0 1 0 4H8zm0 4h4a2 2 0 0 1 0 4H8z' fill='%23fff'/></svg>"
}

MOCK_SESSIONS = [
    {
        "id": "sess_1",
        "name": "🚀 Full-Stack AI App Architecture",
        "color": "#6366f1",
        "createdAt": int((time.time() - 3600 * 2) * 1000),
        "tabs": [
            {"id": 101, "title": "Google AI Studio - Gemini 2.0 Flash Prototyping", "url": "https://aistudio.google.com", "favIconUrl": FAVICONS["gemini"], "pinned": False},
            {"id": 102, "title": "Next.js 15 Documentation: App Router & Server Actions", "url": "https://nextjs.org/docs", "favIconUrl": FAVICONS["nextjs"], "pinned": True},
            {"id": 103, "title": "GitHub - vercel/ai: Build AI-powered applications with React", "url": "https://github.com/vercel/ai", "favIconUrl": FAVICONS["github"], "pinned": False},
            {"id": 104, "title": "Supabase: The Open Source Firebase Alternative", "url": "https://supabase.com", "favIconUrl": FAVICONS["supabase"], "pinned": False},
            {"id": 105, "title": "Tailwind CSS - Rapidly build modern websites", "url": "https://tailwindcss.com", "favIconUrl": FAVICONS["tailwind"], "pinned": False}
        ]
    },
    {
        "id": "sess_2",
        "name": "📚 LLM Reasoning & Transformer Research",
        "color": "#10b981",
        "createdAt": int((time.time() - 3600 * 24) * 1000),
        "tabs": [
            {"id": 201, "title": "Attention Is All You Need - arXiv:1706.03762", "url": "https://arxiv.org/abs/1706.03762", "favIconUrl": FAVICONS["arxiv"], "pinned": False},
            {"id": 202, "title": "Hugging Face - The AI community building models & datasets", "url": "https://huggingface.co", "favIconUrl": FAVICONS["huggingface"], "pinned": False},
            {"id": 203, "title": "GitHub - huggingface/transformers: State-of-the-art ML", "url": "https://github.com/huggingface/transformers", "favIconUrl": FAVICONS["github"], "pinned": False},
            {"id": 204, "title": "DeepSeek-R1 Technical Report - Reasoning & RL", "url": "https://arxiv.org/abs/2501.12948", "favIconUrl": FAVICONS["arxiv"], "pinned": False}
        ]
    },
    {
        "id": "sess_3",
        "name": "🏖️ Tokyo & Kyoto Autumn 2026 Itinerary",
        "color": "#f59e0b",
        "createdAt": int((time.time() - 3600 * 48) * 1000),
        "tabs": [
            {"id": 301, "title": "Google Flights: SFO to NRT Non-stop Deals", "url": "https://www.google.com/travel/flights", "favIconUrl": FAVICONS["airplane"], "pinned": False},
            {"id": 302, "title": "Japan Rail Pass Official Reservations & Shinkansen Routes", "url": "https://japanrailpass.net", "favIconUrl": FAVICONS["airplane"], "pinned": False},
            {"id": 303, "title": "Top 10 Hidden Cafes & Ramen Spots in Shibuya & Shinjuku", "url": "https://www.timeout.com/tokyo", "favIconUrl": FAVICONS["airplane"], "pinned": False}
        ]
    },
    {
        "id": "sess_4",
        "name": "🎨 Design System & UI Kit Specs",
        "color": "#ec4899",
        "createdAt": int((time.time() - 3600 * 72) * 1000),
        "tabs": [
            {"id": 401, "title": "Figma - Dark Mode Design System v3.2", "url": "https://figma.com", "favIconUrl": FAVICONS["figma"], "pinned": False},
            {"id": 402, "title": "React Component Library Architecture & Token Guidelines", "url": "https://github.com/facebook/react", "favIconUrl": FAVICONS["react"], "pinned": False},
            {"id": 403, "title": "Lucide Icons - Clean & Consistent Iconography", "url": "https://lucide.dev", "favIconUrl": FAVICONS["tailwind"], "pinned": False}
        ]
    }
]

MOCK_CURRENT_TABS = [
    {"id": 1, "title": "GitHub - facebook/react: The library for web and native UIs", "url": "https://github.com/facebook/react", "favIconUrl": FAVICONS["github"], "pinned": False, "active": True},
    {"id": 2, "title": "Gemini API Overview | Google AI for Developers", "url": "https://ai.google.dev/gemini-api/docs", "favIconUrl": FAVICONS["gemini"], "pinned": False, "active": False},
    {"id": 3, "title": "Next.js by Vercel - The React Framework for the Web", "url": "https://nextjs.org", "favIconUrl": FAVICONS["nextjs"], "pinned": False, "active": False},
    {"id": 4, "title": "Tailwind CSS - Modern Utility-First CSS Framework", "url": "https://tailwindcss.com", "favIconUrl": FAVICONS["tailwind"], "pinned": False, "active": False},
    {"id": 5, "title": "Supabase Docs - Database, Auth, Realtime & Storage", "url": "https://supabase.com/docs", "favIconUrl": FAVICONS["supabase"], "pinned": False, "active": False},
    {"id": 6, "title": "Hugging Face - Open Source AI Ecosystem", "url": "https://huggingface.co", "favIconUrl": FAVICONS["huggingface"], "pinned": False, "active": False}
]

def get_injection_script(sessions, current_tabs):
    return f"""
    const mockStorage = {{
        'tably_sessions': {json.dumps(sessions)},
        'tably_settings': {{ defaultRestoreMode: 'new_window', closeTabsAfterSave: true }},
        'tably_stats': {{ totalSaved: 48, totalRestored: 32 }},
        'tab_vault_sessions': {json.dumps(sessions)},
        'tab_vault_settings': {{ defaultRestoreMode: 'new_window', closeTabsAfterSave: true }},
        'tab_vault_stats': {{ totalSaved: 48, totalRestored: 32 }}
    }};
    const mockTabs = {json.dumps(current_tabs)};

    window.chrome = {{
        storage: {{
            local: {{
                get: function(keys, cb) {{
                    let res = {{}};
                    if (Array.isArray(keys)) {{
                        keys.forEach(k => {{ res[k] = mockStorage[k]; }});
                    }} else if (typeof keys === 'string') {{
                        res[keys] = mockStorage[keys];
                    }} else if (typeof keys === 'object') {{
                        Object.keys(keys).forEach(k => {{ res[k] = mockStorage[k] ?? keys[k]; }});
                    }}
                    if (cb) cb(res);
                    return Promise.resolve(res);
                }},
                set: function(obj, cb) {{
                    Object.assign(mockStorage, obj);
                    if (cb) cb();
                    return Promise.resolve();
                }}
            }}
        }},
        windows: {{
            getCurrent: function() {{ return Promise.resolve({{ id: 1 }}); }},
            getAll: function() {{ return Promise.resolve([{{ id: 1 }}]); }},
            create: function(opts) {{ return Promise.resolve({{ id: 2 }}); }}
        }},
        tabs: {{
            query: function() {{ return Promise.resolve(mockTabs); }},
            create: function(opts) {{ return Promise.resolve(Object.assign({{ id: 999 }}, opts)); }},
            remove: function() {{ return Promise.resolve(); }},
            group: function() {{ return Promise.resolve(10); }}
        }},
        tabGroups: {{
            update: function() {{ return Promise.resolve(); }}
        }},
        runtime: {{
            sendMessage: function(msg, cb) {{ if (cb) cb(); }},
            getURL: function(path) {{ return path; }},
            lastError: null
        }}
    }};
    """

def run():
    opts = Options()
    opts.add_argument('--headless=new')
    opts.add_argument('--disable-gpu')
    opts.add_argument('--force-device-scale-factor=2')
    opts.add_argument('--hide-scrollbars')

    driver = webdriver.Chrome(options=opts)

    injection = get_injection_script(MOCK_SESSIONS, MOCK_CURRENT_TABS)
    driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {'source': injection})

    # 1. Capture Dashboard Overview (1200x780)
    print("Capturing Dashboard Overview...")
    driver.set_window_size(1260, 840)
    dashboard_url = "file:///" + os.path.join(WORKSPACE_DIR, "dashboard.html").replace("\\", "/")
    driver.get(dashboard_url)
    time.sleep(1)
    driver.save_screenshot(os.path.join(SCREENSHOTS_DIR, "dashboard-overview.png"))
    print("Saved screenshots/dashboard-overview.png")

    # 2. Capture Popup Interface (440x620)
    print("Capturing Popup Interface...")
    driver.set_window_size(440, 620)
    popup_url = "file:///" + os.path.join(WORKSPACE_DIR, "popup.html").replace("\\", "/")
    driver.get(popup_url)
    time.sleep(1)
    
    # Clip only the popup app container
    app_container = driver.find_element(By.CLASS_NAME, "app-container")
    app_container.screenshot(os.path.join(SCREENSHOTS_DIR, "popup-interface.png"))
    print("Saved screenshots/popup-interface.png")

    # 3. Capture Popup with Expanded Tab Selection Drawer
    print("Capturing Popup with Expanded Tabs Selection...")
    driver.execute_script("document.getElementById('tabSelectToggle').click();")
    time.sleep(0.5)
    app_container.screenshot(os.path.join(SCREENSHOTS_DIR, "popup-expanded-tabs.png"))
    print("Saved screenshots/popup-expanded-tabs.png")

    # 4. Capture Dashboard with Search / Filter Active
    print("Capturing Dashboard Search Filtering...")
    driver.set_window_size(1260, 840)
    driver.get(dashboard_url)
    time.sleep(0.5)
    search_input = driver.find_element(By.ID, "dashSearchInput")
    search_input.send_keys("AI")
    time.sleep(0.5)
    driver.save_screenshot(os.path.join(SCREENSHOTS_DIR, "dashboard-search.png"))
    print("Saved screenshots/dashboard-search.png")

    driver.quit()
    print("All screenshots generated successfully!")

if __name__ == "__main__":
    run()
