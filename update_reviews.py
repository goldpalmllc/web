#!/usr/bin/env python3
"""
Pulls current reviews from the Gold Palm Angi listing and writes reviews.json.
Runs weekly via .github/workflows/update-reviews.yml — you shouldn't need to
run this by hand, but you can with:  python3 scripts/update_reviews.py

IMPORTANT — read this if reviews ever stop updating:
Angi does not offer a public reviews API, so this script reads the same
public review page a browser would and parses the text. Angi can change
their page layout at any time, which would make the text pattern below
stop matching. That's why the script is defensive: if it can't confidently
parse at least a few reviews, it leaves your existing reviews.json alone
instead of overwriting it with something broken or empty. Check the
"Update Angi Reviews" tab under your repo's Actions tab if you want to see
whether a run found new reviews or skipped.
"""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

LISTING_URL = "https://www.angi.com/companylist/us/fl/fort-pierce/gold-palm-lawn-and-landscape-corp-reviews-161920782.htm"
MAX_PAGES = 6
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "reviews.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}

MONTHS = {
    "jan": "01", "feb": "02", "mar": "03", "apr": "04", "may": "05", "jun": "06",
    "jul": "07", "aug": "08", "sep": "09", "oct": "10", "nov": "11", "dec": "12",
}

# Matches a review "card" in the flattened page text, in the order Angi prints it:
#   Reviewer Name
#   Mon YYYY
#   X.X   (rating, e.g. 5.0 or 4.5)
#   ... freeform recommend / comment text until the next review or end ...
REVIEW_BLOCK = re.compile(
    r"([A-Z][A-Za-z.'\- ]{1,40})\s*\n+"
    r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+20\d{2})\s*\n+"
    r"(\d\.\d)\s*\n+"
    r"(.*?)(?=\n[A-Z][A-Za-z.'\- ]{1,40}\s*\n(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+20\d{2}|\Z)",
    re.DOTALL,
)

SUMMARY_RE = re.compile(r"(\d\.\d)\s*\((\d+)\)")


def fetch(url: str) -> str | None:
    try:
        req = Request(url, headers=HEADERS)
        with urlopen(req, timeout=20) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    except (URLError, HTTPError, TimeoutError) as exc:
        print(f"  fetch failed for {url}: {exc}", file=sys.stderr)
        return None


def strip_tags(html: str) -> str:
    html = re.sub(r"<script.*?</script>", " ", html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r"<style.*?</style>", " ", html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r"<(br|p|div|li|tr)\b[^>]*>", "\n", html, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", html)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&#39;|&rsquo;", "'", text)
    text = re.sub(r"&quot;", '"', text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n", text)
    return text


def parse_reviews(text: str):
    found = []
    for m in REVIEW_BLOCK.finditer(text):
        name, date_raw, rating, body = m.groups()
        name = name.strip()
        if len(name.split()) > 4 or len(name) < 3:
            continue
        mon, year = date_raw.split()
        date_iso = f"{year}-{MONTHS.get(mon[:3].lower(), '01')}"
        rating_val = float(rating)
        if not (0.5 <= rating_val <= 5.0):
            continue

        body = body.strip()
        recommend = "yes, i recommend this pro" in body.lower()
        # drop the boilerplate recommend line and stray price lines, keep real comment text
        lines = [
            ln.strip() for ln in body.split("\n")
            if ln.strip()
            and "recommend this pro" not in ln.lower()
            and not re.fullmatch(r"\$[\d,]+", ln.strip())
        ]
        review_text = " ".join(lines).strip()

        found.append({
            "name": name,
            "date": date_iso,
            "rating": rating_val,
            "recommend": recommend,
            "text": review_text,
        })
    return found


def parse_summary(text: str):
    m = SUMMARY_RE.search(text)
    if m:
        return {"rating": float(m.group(1)), "count": int(m.group(2))}
    return None


def main():
    print("Fetching Angi review page...")
    all_reviews = []
    seen = set()
    summary = None

    for page in range(1, MAX_PAGES + 1):
        url = LISTING_URL if page == 1 else f"{LISTING_URL}?page={page}"
        html = fetch(url)
        if not html:
            break
        text = strip_tags(html)

        if summary is None:
            summary = parse_summary(text)

        page_reviews = parse_reviews(text)
        new_count = 0
        for r in page_reviews:
            key = (r["name"], r["date"], r["rating"], r["text"][:40])
            if key not in seen:
                seen.add(key)
                all_reviews.append(r)
                new_count += 1

        print(f"  page {page}: parsed {len(page_reviews)} reviews, {new_count} new")
        if new_count == 0:
            break

    if len(all_reviews) < 3:
        print("Too few reviews parsed — Angi's page layout may have changed. "
              "Leaving the existing reviews.json untouched.", file=sys.stderr)
        sys.exit(0)

    existing = {}
    if OUTPUT_PATH.exists():
        try:
            existing = json.loads(OUTPUT_PATH.read_text())
        except json.JSONDecodeError:
            existing = {}

    data = {
        "source": "Angi",
        "source_url": LISTING_URL,
        "summary": summary or existing.get("summary", {"rating": None, "count": len(all_reviews)}),
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "reviews": all_reviews,
    }

    OUTPUT_PATH.write_text(json.dumps(data, indent=2) + "\n")
    print(f"Wrote {len(all_reviews)} reviews to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
