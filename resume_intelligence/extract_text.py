"""
Step 7 -- Person B: PDF text extraction.

pdfplumber's default extract_text() reads left-to-right, top-to-bottom per
page -- it does NOT detect columns. A genuinely multi-column resume will
come out with lines from both columns interleaved mid-sentence. That's a
known, expected failure mode we're testing FOR (per the spec: "log where
extraction breaks -- multi-column layouts, tables, etc."), not something
this function tries to fix at the baseline stage.
"""

import pdfplumber


def extract_text_from_pdf(file_path: str) -> str:
    pages_text = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            pages_text.append(page.extract_text() or "")
    return "\n".join(pages_text)
