#!/usr/bin/env python3
"""
Extract the WHG Team Handbook PDF into cleanly structured sections using
font-size + boldness + indentation signals from the original document.

Output: scripts/handbook_parsed.json

Font hierarchy in the PDF:
  18pt Bold @ x0=72  = SECTION N: TITLE (may span two lines)
  14pt Bold @ x0=72  = major heading  (e.g. "Our Culture", "At-Will Employment")
  12pt Bold @ x0=72  = label / sub-sub heading (e.g. "1. Accountability")
  12pt Bold @ x0=90  = bullet item first line ("• Full-Time — ...")
  12pt reg  @ x0=108 = bullet soft-wrap continuation
  12pt reg  @ x0=72  = body paragraph
   9pt reg           = running page header (drop)
"""

import json
import re
import sys
from collections import defaultdict

import pdfplumber

PDF_PATH = (
    "/sessions/compassionate-happy-tesla/mnt/"
    "Wong Hospitality Group (Manuals, operations, Financials, etc.)/"
    "WHG_Team_Handbook_MASTER_3_5_2026_Final.pdf"
)
OUT_PATH = (
    "/sessions/compassionate-happy-tesla/mnt/"
    "Wong Hospitality Group (Manuals, operations, Financials, etc.)/"
    "whg-team-portal/scripts/handbook_parsed.json"
)

SPANISH_MARKER = "UN MENSAJE DE LA DIRECCIÓN"


def group_lines(page):
    lines = defaultdict(list)
    for ch in page.chars:
        y_key = round(ch["top"] / 1.5) * 1.5
        lines[y_key].append(ch)
    result = []
    for k in sorted(lines.keys()):
        chars = sorted(lines[k], key=lambda c: c["x0"])
        text = "".join(c["text"] for c in chars).strip()
        if not text:
            continue
        max_size = max(c["size"] for c in chars)
        bold_count = sum(1 for c in chars if "Bold" in c.get("fontname", ""))
        # A line is "bold" only if the overwhelming majority of its chars are
        # bold — otherwise inline emphasis (e.g. a bolded phrase inside a
        # sentence) would get promoted to a heading.
        bold_ratio = bold_count / max(len(chars), 1)
        is_bold = bold_ratio >= 0.85
        result.append({
            "text": text,
            "size": max_size,
            "bold": is_bold,
            "bold_ratio": bold_ratio,
            "x0": chars[0]["x0"],
        })
    return result


def classify(line):
    size = line["size"]
    bold = line["bold"]  # now means >=85% bold chars
    x0 = line["x0"]
    text = line["text"]

    # Drop running header (9pt) and page numbers
    if size < 10:
        return "skip"

    # Section title (18pt bold)
    if size >= 16.5 and bold:
        return "section"

    # Major heading (14pt bold) — must be fully bold AND short enough to be a
    # heading (some 14pt-sized text in the PDF is inline). A heading also
    # doesn't end in sentence-ending punctuation.
    if size >= 13.5 and bold and len(text) <= 80 and not re.search(r"[.!?]\s*$", text):
        return "h2"

    # Bullet line — starts with • regardless of bold. Prior version required
    # bold and missed bullets whose first-line label was only partially bold.
    if re.match(r"^[•·●▪]", text):
        return "bullet"

    # Bullet soft-wrap continuation (deeply indented)
    if x0 >= 95:
        return "bullet_cont"

    # 12pt bold label (e.g. "1. Accountability", "Core Values") — must be
    # mostly bold AND short (< 70 chars) AND not end with sentence punctuation.
    # This is the guard against mid-sentence bold emphasis ("Dead Hours
    # Exception: ...") being promoted to a heading.
    if bold and size >= 11 and x0 < 85 and len(text) <= 70 and not re.search(r"[.!?]\s*$", text):
        return "h3"

    # Body
    if size >= 10.5:
        return "body"

    return "skip"


def pretty_title(s):
    """ALL CAPS → Title Case, keeping small words lowercase mid-phrase."""
    s = re.sub(r"\s+", " ", s).strip()
    small = {"and", "or", "of", "the", "a", "an", "to", "for", "in", "on"}
    words = s.lower().split()
    out = []
    for idx, w in enumerate(words):
        if w == "&":
            out.append("&")
        elif idx > 0 and w in small:
            out.append(w)
        else:
            out.append(w[:1].upper() + w[1:])
    return " ".join(out)


def parse():
    all_lines = []
    with pdfplumber.open(PDF_PATH) as pdf:
        for page in pdf.pages:
            for ln in group_lines(page):
                cls = classify(ln)
                if cls == "skip":
                    continue
                all_lines.append({**ln, "cls": cls})

    # Trim at Spanish marker
    for i, ln in enumerate(all_lines):
        if SPANISH_MARKER in ln["text"]:
            all_lines = all_lines[:i]
            break

    sections = []
    current = None
    pending = None  # {"kind": "paragraph", "lines": [...]} or {"kind": "list", "items": [...]}

    def flush():
        nonlocal pending
        if pending and current is not None:
            if pending["kind"] == "paragraph":
                text = " ".join(pending["lines"]).strip()
                text = re.sub(r"\s+", " ", text)
                if text:
                    current["blocks"].append({"kind": "paragraph", "text": text})
            elif pending["kind"] == "list":
                items = [re.sub(r"\s+", " ", i).strip() for i in pending["items"] if i.strip()]
                if items:
                    current["blocks"].append({"kind": "list", "items": items})
        pending = None

    i = 0
    while i < len(all_lines):
        ln = all_lines[i]
        text = ln["text"]
        cls = ln["cls"]

        if cls == "section":
            m = re.match(r"^SECTION\s+(\d+)\s*:?\s*(.*)$", text)
            if m:
                flush()
                num = int(m.group(1))
                parts = [m.group(2).strip()] if m.group(2).strip() else []
                j = i + 1
                while j < len(all_lines) and all_lines[j]["cls"] == "section":
                    nxt = all_lines[j]["text"].strip()
                    if re.match(r"^SECTION\s+\d+", nxt):
                        break
                    parts.append(nxt)
                    j += 1
                current = {
                    "number": num,
                    "title": pretty_title(" ".join(parts)),
                    "blocks": [],
                }
                sections.append(current)
                i = j
                continue
            # Section-classed line that's not a real section header — skip
            i += 1
            continue

        if current is None:
            i += 1
            continue

        if cls == "h2":
            flush()
            # h2 may span two lines — merge consecutive h2 lines
            j = i + 1
            parts = [text]
            while j < len(all_lines) and all_lines[j]["cls"] == "h2":
                parts.append(all_lines[j]["text"])
                j += 1
            current["blocks"].append({
                "kind": "heading",
                "level": 2,
                "text": " ".join(parts).rstrip(":").strip(),
            })
            i = j
            continue

        if cls == "h3":
            flush()
            # Strip leading "1.  " numbering but keep the label
            clean = re.sub(r"^\d+\.\s+", "", text).strip()
            current["blocks"].append({
                "kind": "heading",
                "level": 3,
                "text": clean,
            })
            i += 1
            continue

        if cls == "bullet":
            if not pending or pending["kind"] != "list":
                flush()
                pending = {"kind": "list", "items": []}
            bullet_text = re.sub(r"^[•·●▪]\s*", "", text).strip()
            pending["items"].append(bullet_text)
            i += 1
            continue

        if cls == "bullet_cont":
            # Continuation of the previous bullet's wrap
            if pending and pending["kind"] == "list" and pending["items"]:
                pending["items"][-1] += " " + text
            elif pending and pending["kind"] == "paragraph":
                pending["lines"].append(text)
            i += 1
            continue

        # body
        if not pending or pending["kind"] != "paragraph":
            flush()
            pending = {"kind": "paragraph", "lines": []}
        pending["lines"].append(text)
        i += 1

    flush()
    return sections


if __name__ == "__main__":
    result = parse()
    print(f"Parsed {len(result)} sections:", file=sys.stderr)
    for s in result:
        total = sum(
            len(b.get("text", "")) + sum(len(i) for i in b.get("items", []))
            for b in s["blocks"]
        )
        print(
            f"  {s['number']}. {s['title']}  ({len(s['blocks'])} blocks, {total} chars)",
            file=sys.stderr,
        )
    with open(OUT_PATH, "w") as f:
        json.dump(result, f, indent=2)
    print(f"\nWrote {OUT_PATH}", file=sys.stderr)
