"""Generate PDF / CSV artifacts from agent output."""
import csv
import io
from pathlib import Path

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

ARTIFACTS_DIR = Path("/tmp/discoverse_artifacts")
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)


def make_pdf(title: str, body_md: str, filename: str) -> Path:
    out = ARTIFACTS_DIR / filename
    doc = SimpleDocTemplate(str(out), pagesize=LETTER)
    styles = getSampleStyleSheet()
    story = [Paragraph(title, styles["Title"]), Spacer(1, 12)]
    for para in body_md.split("\n\n"):
        story.append(Paragraph(para.replace("\n", "<br/>"), styles["BodyText"]))
        story.append(Spacer(1, 8))
    doc.build(story)
    return out


def make_csv(rows: list[list[str]], filename: str) -> Path:
    out = ARTIFACTS_DIR / filename
    with open(out, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    return out
