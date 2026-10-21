"""Tiny static-site builder: fills {{TOKENS}} from config.json and {{> partial}} includes.

Usage:  python build.py
Output: dist/   (upload this folder to Cloudflare Pages, Netlify or any static host)
"""
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
DIST = ROOT / "dist"

cfg = {k: v for k, v in json.loads((ROOT / "config.json").read_text(encoding="utf-8")).items() if not k.startswith("_")}

warnings = []

# Safe fallbacks so the site works before every tool is set up.
if not cfg.get("BOOKING_URL"):
    cfg["BOOKING_URL"] = "contact.html#inquiry"
    warnings.append("BOOKING_URL empty: 'Book a call' buttons point to the inquiry form. Set it once your scheduler exists.")
if not cfg.get("INTENSIVE_BOOKING_URL"):
    cfg["INTENSIVE_BOOKING_URL"] = cfg["BOOKING_URL"]
    warnings.append("INTENSIVE_BOOKING_URL empty: intensive planning-call buttons use BOOKING_URL.")
if not cfg.get("FORM_ACTION"):
    cfg["FORM_ACTION"] = "mailto:" + cfg["EMAIL"]
    cfg["FORM_ENCTYPE"] = 'enctype="text/plain"'
else:
    cfg["FORM_ENCTYPE"] = ""
cfg.setdefault("PATIENT_PORTAL_URL", "")
cfg["PORTAL_LINK"] = (
    f'<a href="{cfg["PATIENT_PORTAL_URL"]}">Client portal</a>' if cfg.get("PATIENT_PORTAL_URL") else ""
)
cfg["PHONE_LINE"] = f'<p>Phone: {cfg["PHONE"]}</p>' if cfg.get("PHONE") else ""
cfg["PT_LINK"] = (
    f'<a href="{cfg["PSYCHOLOGY_TODAY_URL"]}" rel="noopener">Psychology Today</a>' if cfg.get("PSYCHOLOGY_TODAY_URL") else ""
)
cfg["LI_LINK"] = (
    f'<a href="{cfg["LINKEDIN_URL"]}" rel="noopener">LinkedIn</a>' if cfg.get("LINKEDIN_URL") else ""
)

partials = {p.stem: p.read_text(encoding="utf-8") for p in (SRC / "_partials").glob("*.html")}


def render(text: str, page_vars: dict) -> str:
    text = re.sub(r"\{\{>\s*(\w+)\s*\}\}", lambda m: partials[m.group(1)], text)
    merged = {**cfg, **page_vars}

    def sub(m):
        key = m.group(1)
        if key not in merged:
            warnings.append(f"Unknown token {{{{{key}}}}}")
            return m.group(0)
        return str(merged[key])

    return re.sub(r"\{\{(\w+)\}\}", sub, text)


def page_vars(text: str):
    """Pages start with <!--title: ...|desc: ...|path: ...|nav: ... -->"""
    m = re.match(r"\s*<!--(.*?)-->", text, re.S)
    vars_ = {"TITLE": "", "DESC": "", "PATH": "", "NAV": ""}
    if m:
        for part in m.group(1).split("|"):
            if ":" in part:
                k, v = part.split(":", 1)
                vars_[k.strip().upper()] = v.strip()
        text = text[m.end():]
    return vars_, text


if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir()

pages = []
for f in sorted(SRC.glob("*.html")):
    raw = f.read_text(encoding="utf-8")
    vars_, body = page_vars(raw)
    nav = vars_["NAV"]
    for name in ("work", "intensives", "mentorship", "about", "faq", "contact"):
        vars_[f"ON_{name.upper()}"] = ' aria-current="page"' if nav == name else ""
    vars_["CANONICAL"] = cfg["DOMAIN"] + "/" + ("" if f.name == "index.html" else f.name)
    out = render(body, vars_)
    (DIST / f.name).write_text(out, encoding="utf-8")
    if f.name not in ("404.html", "thanks.html") and not f.name.startswith("welcome"):
        pages.append(f.name)

for f in SRC.iterdir():
    if f.is_file() and f.suffix not in (".html",):
        shutil.copy(f, DIST / f.name)
for sub in ("img",):
    if (SRC / sub).exists():
        shutil.copytree(SRC / sub, DIST / sub)

# sitemap + robots
urls = "".join(
    f"<url><loc>{cfg['DOMAIN']}/{'' if p == 'index.html' else p}</loc></url>" for p in pages
)
(DIST / "sitemap.xml").write_text(
    f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>',
    encoding="utf-8",
)
(DIST / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {cfg['DOMAIN']}/sitemap.xml\n", encoding="utf-8")

print(f"Built {len(pages)} pages into {DIST}")
for w in dict.fromkeys(warnings):
    print("  note:", w)
if any(w.startswith("Unknown token") for w in warnings):
    sys.exit(1)
