"""
Spot-checks Person B's extraction accuracy against ground truth already
present in the Form data's raw_text (the "What kind of round was it?" line),
the same manual check done during initial validation -- just automated here
so it can be re-run after any prompt/schema change instead of eyeballing by
hand each time.

This does NOT replace reading results yourself -- it's a fast first pass to
flag rows worth a closer look, not a final accuracy verdict.
"""

import json
import re


def extract_ground_truth_tags(raw_text: str) -> list[str] | None:
    match = re.search(r"What kind of round was it\?:\s*(.+)", raw_text)
    if not match:
        return None
    return [t.strip() for t in match.group(1).split(",")]


def main():
    with open("results/rounds_tone_form.json", encoding="utf-8") as f:
        results = json.load(f)

    matches, partial, misses = 0, 0, 0

    for r in results:
        raw_text = r.get("_raw_text_for_eval", "")  # optional, see note below
        extracted_types = set()
        for rd in r["extraction"]["rounds"]:
            extracted_types.update(t.lower() for t in rd["type"])

        gt = extract_ground_truth_tags(raw_text) if raw_text else None
        if gt is None:
            print(f"id={r['raw_report_id']}: no ground-truth tag line found, skipping")
            continue

        gt_set = {t.lower() for t in gt}
        overlap = gt_set & extracted_types

        if overlap == gt_set:
            matches += 1
            verdict = "FULL MATCH"
        elif overlap:
            partial += 1
            verdict = f"PARTIAL -- missing {gt_set - overlap}"
        else:
            misses += 1
            verdict = f"MISS -- expected {gt_set}, got {extracted_types}"

        print(f"id={r['raw_report_id']}: {verdict}")

    print(f"\n{matches} full matches, {partial} partial, {misses} misses "
          f"out of {len(results)} rows.")


if __name__ == "__main__":
    main()
