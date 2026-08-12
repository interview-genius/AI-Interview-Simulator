import csv
import json
import time
from datetime import datetime, timezone

import feedparser
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

TAG_FEEDS = [
    "https://medium.com/feed/tag/technical-interview",
    "https://medium.com/feed/tag/interview-preparation",
    "https://medium.com/feed/tag/coding-interviews",
    "https://medium.com/feed/tag/interview-questions",
]

KNOWN_COMPANIES = [
    "Google", "Amazon", "Microsoft", "Meta", "Facebook", "Apple", "Netflix",
    "Uber", "Airbnb", "Adobe", "Oracle", "Salesforce", "LinkedIn", "PayPal",
    "Goldman Sachs", "JPMorgan", "Atlassian", "Stripe", "Anthropic", "Two Sigma",
    "Datadog",
]
KNOWN_ROLES = [
    "SDE-1", "SDE-2", "SDE-3", "SDE1", "SDE2", "SDE3", "SWE", "Software Engineer",
    "SDE", "Senior Software Engineer", "Data Scientist", "ML Engineer",
]


def guess_company(text: str) -> str | None:
    for c in KNOWN_COMPANIES:
        if c.lower() in text.lower():
            return c
    return None


def guess_role(text: str) -> str | None:
    for r in KNOWN_ROLES:
        if r.lower() in text.lower():
            return r
    return None


def normalize_date(entry) -> str:
    if getattr(entry, "published_parsed", None):
        dt = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
        return dt.isoformat()
    return datetime.now(timezone.utc).isoformat()


def looks_like_interview_experience(title: str, summary: str) -> bool:
    """Cheap pre-filter run BEFORE the expensive full-page fetch.

    The tag feeds are topic-tagged, not content-verified -- anyone can tag a
    generic "JS engine internals" post under 'technical-interview'. This
    heuristic isn't perfect (that's what Step 2's manual review is for), but
    it cuts obvious noise (listicles, prep-tip roundups, unrelated tech posts)
    before we spend a real browser page-load fetching them.
    """
    text = f"{title} {summary}".lower()

    # Strong positive signals: first-person narrative language
    narrative_signals = [
        "my interview", "i interviewed", "interview experience",
        "onsite", "phone screen", "interview process", "got rejected",
        "received an offer", "interview journey", "interview round",
        " oa ", "online assessment",
    ]
    # Negative signals: generic listicle/prep-content, not a personal story
    generic_signals = [
        "questions every", "questions to know", "questions with solutions",
        "topics every", "guide to", "how to prepare", "advanced sql",
        "coding problems every",
    ]

    has_narrative = any(s in text for s in narrative_signals)
    looks_generic = any(s in text for s in generic_signals)

    return has_narrative and not looks_generic


def fetch_full_article_text(page, url: str) -> str | None:
    try:
        page.goto(url, timeout=25000, wait_until="domcontentloaded")
        # Medium is a React app -- the <article> body renders in AFTER initial
        # HTML loads, via JS. Wait explicitly for real paragraph content to
        # show up, instead of guessing a fixed delay is long enough.
        page.wait_for_selector("article p", timeout=10000)
    except Exception as e:
        print(f"    [warn] page/content never loaded for {url}: {e}")
        return None

    html = page.content()
    soup = BeautifulSoup(html, "html.parser")
    article = soup.find("article")
    if not article:
        print(f"    [warn] no <article> tag found for {url}")
        return None

    parts = []
    for tag in article.find_all(["h1", "h2", "h3", "p", "li"]):
        text = tag.get_text(strip=True)
        if text:
            parts.append(text)

    body = "\n\n".join(parts)

    # A real article body should be a few hundred+ chars. If we got much
    # less, this is almost certainly a paywall teaser or a render that
    # didn't finish -- treat it as a failure rather than silently keeping
    # a near-empty result.
    if len(body) < 200:
        print(f"    [warn] extracted body suspiciously short ({len(body)} chars) for {url}")
        return None

    return body


def clean_html_summary(raw_summary: str) -> str:
    """RSS <summary> fields often contain raw, unstripped HTML (tags, entities,
    a 'Continue reading on Medium »' link). Strip that down to plain text
    before using it as a fallback, so it doesn't end up looking like garbage
    in raw_text."""
    if not raw_summary:
        return ""
    soup = BeautifulSoup(raw_summary, "html.parser")
    # drop the "Continue reading..." link itself -- it's not article content
    for link in soup.find_all("a", class_="medium-feed-link"):
        link.decompose()
    return soup.get_text(separator=" ", strip=True)


def fetch_tag_feed(page, feed_url: str) -> list[dict]:
    parsed = feedparser.parse(feed_url)
    if parsed.bozo:
        print(f"  [warn] feed may be malformed: {feed_url} -> {parsed.bozo_exception}")

    rows = []
    for entry in parsed.entries:
        title = entry.get("title", "")
        url = entry.get("link", "")
        summary = entry.get("summary", "")

        print(f"  Fetching full article: {title[:60]}")
        full_text = fetch_full_article_text(page, url)
        time.sleep(2)

        is_full_text = full_text is not None
        if not full_text:
            print(f"    -> falling back to (cleaned) RSS summary for: {title[:60]}")
            full_text = clean_html_summary(summary)

        combined_text = f"{title}\n\n{full_text}".strip()

        rows.append({
            "source": "medium",
            "source_url": url,
            "raw_text": combined_text,
            "company_guess": guess_company(combined_text),
            "role_guess": guess_role(combined_text),
            "submitted_at": normalize_date(entry),
            "is_full_text": is_full_text,
        })
    return rows


def main():
    all_rows = []
    seen_urls = set()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            )
        )
        page = context.new_page()

        for feed_url in TAG_FEEDS:
            print(f"\nFetching feed: {feed_url}")
            rows = fetch_tag_feed(page, feed_url)
            for row in rows:
                if row["source_url"] and row["source_url"] not in seen_urls:
                    seen_urls.add(row["source_url"])
                    all_rows.append(row)
            time.sleep(1)

        browser.close()

    print(f"\nCollected {len(all_rows)} unique articles with full text.")
    full_count = sum(1 for r in all_rows if r["is_full_text"])
    print(f"  {full_count}/{len(all_rows)} got real full-article text; "
          f"{len(all_rows) - full_count} fell back to (cleaned) RSS summary.")

    with open("medium_raw_full.json", "w", encoding="utf-8") as f:
        json.dump(all_rows, f, indent=2, ensure_ascii=False)

    with open("medium_raw_full.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "source", "source_url", "raw_text", "company_guess",
            "role_guess", "submitted_at", "is_full_text",
        ])
        writer.writeheader()
        writer.writerows(all_rows)

    lens = [len(r["raw_text"]) for r in all_rows]
    if lens:
        print(f"raw_text length -> min: {min(lens)}, max: {max(lens)}, avg: {sum(lens)//len(lens)}")
    print("Saved medium_raw_full.json and medium_raw_full.csv")


if __name__ == "__main__":
    main()