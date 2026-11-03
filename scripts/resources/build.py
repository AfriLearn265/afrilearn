"""Builds AfriLearn's free downloadable PDFs into the website's public/resources folder."""
import random
import re
import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont as RLTTFont
from reportlab.pdfgen import canvas as rlcanvas
from reportlab.platypus import (BaseDocTemplate, Flowable, Frame, KeepTogether, NextPageTemplate, PageBreak,
                                PageTemplate, Paragraph, Spacer, Table, TableStyle)

sys.path.insert(0, str(Path(__file__).parent))
import content as C  # noqa: E402

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "out")
OUT.mkdir(parents=True, exist_ok=True)
FONTS = Path(__file__).parent / "fonts"

INK = colors.HexColor("#10153F")
INDIGO_900 = colors.HexColor("#1A225C")
INDIGO_700 = colors.HexColor("#2B3A9F")
INDIGO_600 = colors.HexColor("#3743B5")
INDIGO_100 = colors.HexColor("#E1E5FD")
WASH = colors.HexColor("#EEF1FF")
SUN = colors.HexColor("#F6B93B")
SUN_100 = colors.HexColor("#FFF3D6")
LEAF = colors.HexColor("#1C8C5E")
MUTED = colors.HexColor("#5B6185")
LINE = colors.HexColor("#DADDEB")

pdfmetrics.registerFont(RLTTFont("Figtree", str(FONTS / "Figtree-Regular.ttf")))
pdfmetrics.registerFont(RLTTFont("Figtree-SemiBold", str(FONTS / "Figtree-SemiBold.ttf")))
pdfmetrics.registerFont(RLTTFont("Figtree-Bold", str(FONTS / "Figtree-Bold.ttf")))
pdfmetrics.registerFont(RLTTFont("Bricolage", str(FONTS / "Bricolage-ExtraBold.ttf")))
pdfmetrics.registerFont(RLTTFont("DejaVu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(RLTTFont("DejaVu-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFontFamily("Figtree", normal="Figtree", bold="Figtree-Bold", italic="Figtree", boldItalic="Figtree-Bold")
pdfmetrics.registerFontFamily("DejaVu", normal="DejaVu", bold="DejaVu-Bold", italic="DejaVu", boldItalic="DejaVu-Bold")

FIGTREE_CHARS = set(TTFont(str(FONTS / "Figtree-Regular.ttf")).getBestCmap())


def fix(text: str) -> str:
    """Draw any character Figtree lacks (√, π, ≈, ₦ …) with DejaVu Sans, leaving markup tags alone."""
    parts = re.split(r"(<[^>]+>)", text)
    out = []
    for p in parts:
        if p.startswith("<"):
            out.append(p)
            continue
        out.append("".join(c if ord(c) in FIGTREE_CHARS or c in "\n" else f'<font name="DejaVu">{c}</font>' for c in p))
    return "".join(out)


def P(text, style):
    return Paragraph(fix(text), style)


body = ParagraphStyle("body", fontName="Figtree", fontSize=10.5, leading=15.5, textColor=INK)
small = ParagraphStyle("small", parent=body, fontSize=9, leading=13, textColor=MUTED)
qstyle = ParagraphStyle("q", parent=body, fontSize=11, leading=16, spaceAfter=3)
opt = ParagraphStyle("opt", parent=body, fontSize=10.5, leading=14.5)
h2 = ParagraphStyle("h2", fontName="Bricolage", fontSize=15, leading=19, textColor=INDIGO_700, spaceBefore=10, spaceAfter=6)
h3 = ParagraphStyle("h3", fontName="Figtree-Bold", fontSize=11.5, leading=16, textColor=INK, spaceBefore=6, spaceAfter=3)
cell = ParagraphStyle("cell", parent=body, fontSize=9.5, leading=13)
cellb = ParagraphStyle("cellb", parent=cell, fontName="Figtree-Bold")
big = ParagraphStyle("big", parent=body, fontSize=15, leading=21)


class NumberedCanvas(rlcanvas.Canvas):
    """Canvas that writes 'Page x of y' once the total page count is known."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved = []

    def showPage(self):
        self._saved.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._saved)
        for state in self._saved:
            self.__dict__.update(state)
            self.setFont("Figtree", 8)
            self.setFillColor(MUTED)
            self.drawRightString(A4[0] - 18 * mm, 10 * mm, f"Page {self._pageNumber} of {total}")
            super().showPage()
        super().save()


def draw_logo(c, x, y, size=9 * mm, light=True):
    c.setFillColor(INDIGO_700 if light else INDIGO_700)
    c.roundRect(x, y, size, size, size * 0.28, stroke=0, fill=1)
    c.setStrokeColor(colors.white)
    c.setLineWidth(size * 0.09)
    c.setLineCap(1)
    p = c.beginPath()
    s = size / 32
    p.moveTo(x + 8 * s, y + 9 * s)
    p.lineTo(x + 14 * s, y + 9 * s)
    p.lineTo(x + 14 * s, y + 15 * s)
    p.lineTo(x + 20 * s, y + 15 * s)
    p.lineTo(x + 20 * s, y + 21 * s)
    c.drawPath(p, stroke=1, fill=0)
    c.setFillColor(SUN)
    c.circle(x + 23.5 * s, y + 24.5 * s, 3.4 * s, stroke=0, fill=1)


def adire(c, x0, y0, w, h, color, step=16 * mm):
    """A light repeat of rings, stitched crosses and diamonds, after adire eleko cloth."""
    c.saveState()
    p = c.beginPath()
    p.rect(x0, y0, w, h)
    c.clipPath(p, stroke=0, fill=0)
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(0.8)
    yy = y0
    row = 0
    while yy < y0 + h + step:
        xx = x0 + (step / 2 if row % 2 else 0)
        col = 0
        while xx < x0 + w + step:
            kind = (row + col) % 3
            if kind == 0:
                c.circle(xx, yy, step * 0.26, stroke=1, fill=0)
                c.circle(xx, yy, step * 0.13, stroke=1, fill=0)
                c.circle(xx, yy, step * 0.035, stroke=0, fill=1)
            elif kind == 1:
                c.setDash(1.5, 2)
                c.line(xx - step * 0.25, yy, xx + step * 0.25, yy)
                c.line(xx, yy - step * 0.25, xx, yy + step * 0.25)
                c.setDash()
            else:
                d = step * 0.22
                q = c.beginPath()
                q.moveTo(xx, yy + d); q.lineTo(xx + d, yy); q.lineTo(xx, yy - d); q.lineTo(xx - d, yy); q.close()
                c.drawPath(q, stroke=1, fill=0)
            xx += step
            col += 1
        yy += step
        row += 1
    c.restoreState()


def make_doc(filename, title, subtitle, kind_label):
    path = OUT / filename
    W, H = A4
    band = 76 * mm

    def first(c, doc):
        c.saveState()
        c.setFillColor(INDIGO_900)
        c.rect(0, H - band, W, band, stroke=0, fill=1)
        adire(c, W * 0.45, H - band, W * 0.55, band, colors.Color(0.22, 0.27, 0.62, alpha=0.9))
        c.setFillColor(SUN)
        c.circle(W - 22 * mm, H - 8 * mm, 17 * mm, stroke=0, fill=1)
        draw_logo(c, 18 * mm, H - 21 * mm)
        c.setFillColor(colors.white)
        c.setFont("Bricolage", 15)
        c.drawString(30 * mm, H - 18.2 * mm, "AfriLearn")
        tag = Paragraph(fix(kind_label), ParagraphStyle("tag", fontName="Figtree-SemiBold", fontSize=9, leading=12, textColor=INK))
        tw = pdfmetrics.stringWidth(kind_label, "Figtree-SemiBold", 9) + 8 * mm
        c.setFillColor(SUN)
        c.roundRect(18 * mm, H - 33 * mm, tw, 6.5 * mm, 3.2 * mm, stroke=0, fill=1)
        tag.wrapOn(c, tw, 8 * mm)
        tag.drawOn(c, 22 * mm, H - 31.4 * mm)
        t = Paragraph(fix(title), ParagraphStyle("t", fontName="Bricolage", fontSize=22, leading=25, textColor=colors.white))
        tw2, th = t.wrap(W * 0.62, 30 * mm)
        t.drawOn(c, 18 * mm, H - 38 * mm - th)
        s = Paragraph(fix(subtitle), ParagraphStyle("s", fontName="Figtree", fontSize=10.5, leading=14, textColor=INDIGO_100))
        sw, sh = s.wrap(W * 0.62, 14 * mm)
        s.drawOn(c, 18 * mm, H - 41 * mm - th - sh)
        footer(c)
        c.restoreState()

    def later(c, doc):
        c.saveState()
        draw_logo(c, 18 * mm, H - 15 * mm, size=6 * mm)
        c.setFont("Bricolage", 10)
        c.setFillColor(INK)
        c.drawString(26 * mm, H - 13.2 * mm, "AfriLearn")
        c.setFont("Figtree", 8.5)
        c.setFillColor(MUTED)
        c.drawRightString(W - 18 * mm, H - 13 * mm, re.sub(r"<[^>]+>", "", title))
        c.setStrokeColor(LINE)
        c.setLineWidth(0.6)
        c.line(18 * mm, H - 18 * mm, W - 18 * mm, H - 18 * mm)
        footer(c)
        c.restoreState()

    def footer(c):
        c.setFont("Figtree", 8)
        c.setFillColor(MUTED)
        c.drawString(18 * mm, 10 * mm, "Original AfriLearn material. Free to print and share for study. afrilearn-ng.vercel.app")

    doc = BaseDocTemplate(str(path), pagesize=A4, title=re.sub(r"<[^>]+>", "", title), author="AfriLearn",
                          subject=subtitle, creator="AfriLearn", leftMargin=18 * mm, rightMargin=18 * mm)
    f1 = Frame(18 * mm, 16 * mm, W - 36 * mm, H - band - 24 * mm, id="f1", showBoundary=0)
    f2 = Frame(18 * mm, 16 * mm, W - 36 * mm, H - 40 * mm, id="f2", showBoundary=0)
    doc.addPageTemplates([PageTemplate(id="first", frames=[f1], onPage=first),
                          PageTemplate(id="later", frames=[f2], onPage=later)])
    return doc, path


def info_strip(pairs):
    cells = [[P(f'<font color="#5B6185" size="8.5">{k}</font><br/><b>{v}</b>', cell) for k, v in pairs]]
    t = Table(cells, colWidths=[(A4[0] - 36 * mm) / len(pairs)] * len(pairs))
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), WASH), ("BOX", (0, 0), (-1, -1), 0, WASH),
        ("LEFTPADDING", (0, 0), (-1, -1), 9), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LINEAFTER", (0, 0), (-2, -1), 0.6, colors.white), ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    return t


def boxed(flowables, bg=WASH, pad=10):
    t = Table([[flowables]], colWidths=[A4[0] - 36 * mm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), bg), ("LEFTPADDING", (0, 0), (-1, -1), pad),
                           ("RIGHTPADDING", (0, 0), (-1, -1), pad), ("TOPPADDING", (0, 0), (-1, -1), pad - 2),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), pad), ("ROUNDEDCORNERS", [6, 6, 6, 6])]))
    return t


def shuffle_options(items, seed):
    """Fix each correct option at a varied, repeatable position. Returns (options, correct_letter)."""
    rng = random.Random(seed)
    out = []
    for i, (q, options, expl) in enumerate(items):
        order = list(range(len(options)))
        rng.shuffle(order)
        opts = [options[j] for j in order]
        out.append((q, opts, "ABCD"[order.index(0)], expl))
    return out


def question_block(n, q, opts):
    flow = [P(f'<font name="Figtree-Bold" color="#2B3A9F">{n}.</font>  {q}', qstyle)]
    short = all(len(re.sub(r"<[^>]+>", "", o)) <= 26 for o in opts)
    letters = "ABCD"
    if short:
        rows = [[P(f'<font name="Figtree-Bold" color="#2B3A9F">{letters[i]}</font>   {opts[i]}', opt),
                 P(f'<font name="Figtree-Bold" color="#2B3A9F">{letters[i + 1]}</font>   {opts[i + 1]}', opt)] for i in (0, 2)]
        widths = [(A4[0] - 46 * mm) / 2] * 2
    else:
        rows = [[P(f'<font name="Figtree-Bold" color="#2B3A9F">{letters[i]}</font>   {o}', opt)] for i, o in enumerate(opts)]
        widths = [A4[0] - 46 * mm]
    t = Table(rows, colWidths=widths, hAlign="LEFT")
    t.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 1.5),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5)]))
    ind = Table([[t]], colWidths=[A4[0] - 36 * mm])
    ind.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 8 * mm), ("TOPPADDING", (0, 0), (-1, -1), 0)]))
    return KeepTogether(flow + [ind, Spacer(1, 7)])


def answer_section(answers, start=1):
    story = [PageBreak(), P("Answers and explanations", h2),
             P("Mark your paper first, then read the explanation for every question you missed.", small), Spacer(1, 8)]
    grid, row = [], []
    for i, (letter, _) in enumerate(answers):
        row.append(P(f'<font color="#5B6185">{i + start}.</font>  <b>{letter}</b>', cell))
        if len(row) == 5:
            grid.append(row); row = []
    if row:
        grid.append(row + [""] * (5 - len(row)))
    t = Table(grid, colWidths=[(A4[0] - 36 * mm) / 5] * 5)
    t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.6, LINE), ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                           ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 6), ("LEFTPADDING", (0, 0), (-1, -1), 8)]))
    story += [t, Spacer(1, 12)]
    for i, (letter, expl) in enumerate(answers):
        story.append(P(f'<b>{i + start}. {letter}.</b>  {expl}', ParagraphStyle("ex", parent=body, fontSize=10, leading=14.5, spaceAfter=5)))
    return story


def practice_paper(filename, title, subtitle, info, instructions, items, seed, passage=None, passage_qs=None):
    doc, path = make_doc(filename, title, subtitle, "Original practice paper")
    story = [NextPageTemplate("later"), info_strip(info), Spacer(1, 10),
             boxed([P("<b>Instructions</b>", body)] + [P(f"•  {x}", body) for x in instructions]), Spacer(1, 14)]
    answers = []
    n = 1
    if passage:
        pq = shuffle_options(passage_qs, seed + 1)
        story += [P(f"Read the passage below and answer questions 1 to {len(pq)}.", h3),
                  boxed([P(passage, ParagraphStyle("pass", parent=body, fontSize=10.5, leading=16.5))], bg=SUN_100), Spacer(1, 10)]
        for q, opts, letter, expl in pq:
            story.append(question_block(n, q, opts)); answers.append((letter, expl)); n += 1
        story.append(P("Lexis and structure", h2))
    for q, opts, letter, expl in shuffle_options(items, seed):
        story.append(question_block(n, q, opts)); answers.append((letter, expl)); n += 1
    story += answer_section(answers)
    doc.build(story, canvasmaker=NumberedCanvas)
    return path


def notes_quadratics():
    doc, path = make_doc("ss1-mathematics-quadratic-equations-notes.pdf", "Quadratic Equations: Lesson Notes",
                         "SS 1 Mathematics. Five short lessons with worked examples, exercises and answers.", "Lesson notes")
    story = [NextPageTemplate("later"), info_strip([("Subject", "Mathematics"), ("Class", "SS 1"), ("Topic", "Quadratic equations"), ("Lessons", "5")]), Spacer(1, 8)]
    for i, (heading, paras, example) in enumerate(C.QUADRATICS_NOTES, 1):
        story.append(P(f"{i}. {heading}", h2))
        story += [P(x, ParagraphStyle("np", parent=body, spaceAfter=5)) for x in paras]
        if example:
            story += [Spacer(1, 3), boxed([P("<b>Worked example</b>", body), P(example, body)], bg=SUN_100), Spacer(1, 4)]
    story += [P("Exercises", h2)]
    story += [P(f"<b>{i}.</b>  {q}", ParagraphStyle("e", parent=body, spaceAfter=6)) for i, (q, _) in enumerate(C.QUADRATICS_EXERCISES, 1)]
    story += [PageBreak(), P("Answers", h2)]
    story += [P(f"<b>{i}.</b>  {a}", ParagraphStyle("a", parent=body, spaceAfter=6)) for i, (_, a) in enumerate(C.QUADRATICS_EXERCISES, 1)]
    doc.build(story, canvasmaker=NumberedCanvas)
    return path


def notes_parts_of_speech():
    doc, path = make_doc("jss2-english-parts-of-speech-notes.pdf", "Parts of Speech: Notes and Exercises",
                         "JSS 2 English Language. The eight parts of speech, with examples and a ten-question exercise.", "Lesson notes")
    story = [NextPageTemplate("later"), info_strip([("Subject", "English Language"), ("Class", "JSS 2"), ("Topic", "Parts of speech"), ("Exercise", "10 questions")]), Spacer(1, 10),
             P("Every word in a sentence does a job. The job a word does is its part of speech. The same word can do different jobs in different sentences, so always look at how the word is used.", body),
             Spacer(1, 10)]
    rows = [[P("<b>Part of speech</b>", cellb), P("<b>What it does</b>", cellb), P("<b>Examples</b>", cellb)]]
    rows += [[P(f"<b>{a}</b>", cell), P(b[0].upper() + b[1:], cell), P(c, cell)] for a, b, c in C.PARTS_OF_SPEECH]
    w = A4[0] - 36 * mm
    t = Table(rows, colWidths=[w * 0.22, w * 0.45, w * 0.33], repeatRows=1)
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), WASH), ("GRID", (0, 0), (-1, -1), 0.6, LINE),
                           ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                           ("LEFTPADDING", (0, 0), (-1, -1), 7)]))
    story += [t, Spacer(1, 12), boxed([P("<b>Tip</b>", body), P("Ask a question about the word. If it answers who or what, it is usually a noun or pronoun. If it answers how, when or where, it is usually an adverb.", body)], bg=SUN_100),
              P("Exercise", h2), P("Name the part of speech of the word in bold.", small), Spacer(1, 4)]
    story += [P(f"<b>{i}.</b>  {s}", ParagraphStyle("e", parent=body, spaceAfter=7)) for i, (s, _) in enumerate(C.PARTS_EXERCISES, 1)]
    story += [Spacer(1, 10), P("Answers", h2)]
    story += [P(f"<b>{i}.</b>  {a}", ParagraphStyle("a", parent=body, spaceAfter=4)) for i, (_, a) in enumerate(C.PARTS_EXERCISES, 1)]
    doc.build(story, canvasmaker=NumberedCanvas)
    return path


class AnswerLine(Flowable):
    def __init__(self, width=110 * mm):
        super().__init__(); self.width = width; self.height = 9 * mm

    def draw(self):
        self.canv.setStrokeColor(LINE); self.canv.setLineWidth(0.8)
        self.canv.line(8 * mm, 2 * mm, 8 * mm + self.width, 2 * mm)


def worksheet_fractions():
    doc, path = make_doc("primary-4-mathematics-fractions-worksheet.pdf", "Fractions and Decimals Worksheet",
                         "Primary 4 Mathematics. Twelve questions to do in class or at home. Answers for parents and teachers at the end.", "Worksheet")
    story = [NextPageTemplate("later"), info_strip([("Subject", "Mathematics"), ("Class", "Primary 4"), ("Questions", "12"), ("Time", "30 minutes")]), Spacer(1, 10),
             P("Name: ______________________________     Date: ______________", body), Spacer(1, 10)]
    for i, (q, _) in enumerate(C.FRACTIONS_WORKSHEET, 1):
        story.append(KeepTogether([P(f'<font name="Figtree-Bold" color="#2B3A9F">{i}.</font>  {q}', ParagraphStyle("w", parent=big, fontSize=13, leading=18)), AnswerLine(), Spacer(1, 4)]))
    story += [PageBreak(), P("Answers for parents and teachers", h2)]
    story += [P(f"<b>{i}.</b>  {a}", ParagraphStyle("a", parent=body, spaceAfter=5)) for i, (_, a) in enumerate(C.FRACTIONS_WORKSHEET, 1)]
    doc.build(story, canvasmaker=NumberedCanvas)
    return path


class CountRow(Flowable):
    """N friendly shapes to count, and a box to write the number in."""
    SHAPES = ["circle", "star", "square", "heart"]
    FILLS = [SUN, colors.HexColor("#E2554F"), LEAF, INDIGO_600]

    def __init__(self, n, kind):
        super().__init__(); self.n = n; self.kind = kind; self.width = A4[0] - 36 * mm; self.height = 22 * mm

    def draw(self):
        c = self.canv
        fill = self.FILLS[self.SHAPES.index(self.kind)]
        c.setFillColor(fill); c.setStrokeColor(fill)
        for i in range(self.n):
            x = 8 * mm + i * 12.5 * mm
            y = 12 * mm
            r = 4.6 * mm
            if self.kind == "circle":
                c.circle(x, y, r, stroke=0, fill=1)
            elif self.kind == "square":
                c.roundRect(x - r, y - r, 2 * r, 2 * r, 1.6 * mm, stroke=0, fill=1)
            elif self.kind == "star":
                import math
                p = c.beginPath()
                for k in range(10):
                    ang = math.pi / 2 + k * math.pi / 5
                    rr = r * 1.15 if k % 2 == 0 else r * 0.48
                    px, py = x + rr * math.cos(ang), y + rr * math.sin(ang)
                    (p.moveTo if k == 0 else p.lineTo)(px, py)
                p.close(); c.drawPath(p, stroke=0, fill=1)
            else:
                p = c.beginPath()
                p.moveTo(x, y - r * 0.9)
                p.curveTo(x - r * 1.6, y + r * 0.1, x - r * 0.7, y + r * 1.3, x, y + r * 0.45)
                p.curveTo(x + r * 0.7, y + r * 1.3, x + r * 1.6, y + r * 0.1, x, y - r * 0.9)
                c.drawPath(p, stroke=0, fill=1)
        c.setStrokeColor(INDIGO_700); c.setLineWidth(1.4)
        c.roundRect(self.width - 20 * mm, 3 * mm, 18 * mm, 18 * mm, 3 * mm, stroke=1, fill=0)


class TraceNumbers(Flowable):
    def __init__(self, numbers):
        super().__init__(); self.numbers = numbers; self.width = A4[0] - 36 * mm; self.height = 30 * mm

    def draw(self):
        c = self.canv
        c.setStrokeColor(INDIGO_700); c.setLineWidth(1)
        gap = self.width / len(self.numbers)
        for i, n in enumerate(self.numbers):
            t = c.beginText()
            t.setTextRenderMode(1)  # outline only, for tracing
            t.setFont("Bricolage", 54)
            t.setTextOrigin(i * gap + 4 * mm, 6 * mm)
            t.textOut(str(n))
            c.drawText(t)


class BiggerPair(Flowable):
    def __init__(self, pairs):
        super().__init__(); self.pairs = pairs; self.width = A4[0] - 36 * mm; self.height = 22 * mm

    def draw(self):
        c = self.canv
        gap = self.width / len(self.pairs)
        for i, (a, b) in enumerate(self.pairs):
            x = i * gap
            c.setFillColor(WASH); c.roundRect(x + 2 * mm, 2 * mm, gap - 6 * mm, 18 * mm, 4 * mm, stroke=0, fill=1)
            c.setFillColor(INK); c.setFont("Bricolage", 24)
            c.drawCentredString(x + gap * 0.3, 7.5 * mm, str(a)); c.drawCentredString(x + gap * 0.66, 7.5 * mm, str(b))


def worksheet_counting():
    doc, path = make_doc("nursery-2-counting-1-to-20-worksheet.pdf", "Counting 1 to 20: Activity Sheet",
                         "Nursery 2 Number Work. Count, trace and compare, with a grown-up close by.", "Activity sheet")
    tip = ParagraphStyle("tip", parent=body, fontSize=10, leading=14)
    story = [NextPageTemplate("later"), info_strip([("Subject", "Number Work"), ("Class", "Nursery 2"), ("Activities", "3"), ("Time", "15 minutes")]), Spacer(1, 10),
             boxed([P("<b>For parents</b>", tip), P("Point to each picture as your child counts out loud. Praise every try. Short and happy is better than long and tired.", tip)], bg=SUN_100),
             P("1. Count and write the number in the box", h2)]
    for n, kind in [(3, "circle"), (5, "star"), (7, "square"), (4, "heart"), (9, "circle")]:
        story.append(CountRow(n, kind))
    story += [PageBreak(), P("2. Trace the numbers", h2), TraceNumbers([1, 2, 3, 4, 5]), Spacer(1, 6), TraceNumbers([6, 7, 8, 9, 10]),
              Spacer(1, 6), TraceNumbers([11, 12, 13, 14, 15]), Spacer(1, 6), TraceNumbers([16, 17, 18, 19, 20]),
              P("3. Circle the bigger number", h2), BiggerPair([(3, 7), (12, 9), (15, 18), (20, 11)]), Spacer(1, 10),
              P("Answers: 1. 3, 5, 7, 4, 9.   3. 7, 12, 18, 20.", small)]
    doc.build(story, canvasmaker=NumberedCanvas)
    return path


def scheme_of_work():
    doc, path = make_doc("ss1-mathematics-first-term-scheme-of-work.pdf", "SS 1 Mathematics: First Term Scheme of Work",
                         "A sample 12-week plan for teachers, linked to AfriLearn lessons and CBT practice. Adapt it to your school's curriculum.", "Teacher resource")
    rows = [[P("<b>Week</b>", cellb), P("<b>Topic</b>", cellb), P("<b>Students should be able to</b>", cellb), P("<b>On AfriLearn</b>", cellb)]]
    link = {3: "CBT practice: Indices", 4: "CBT practice: Logarithms", 5: "CBT practice: Sets", 7: "Classroom test from the question bank",
            8: "Quadratic Equations Made Simple, lessons 1 and 2", 9: "Quadratic Equations Made Simple, lessons 3 and 4",
            10: "Quadratic Equations Made Simple, lesson 5", 11: "Timed mock in the CBT Centre", 1: "CBT practice: Number bases"}
    for wk, topic, aim in C.SCHEME_OF_WORK:
        rows.append([P(str(wk), cell), P(f"<b>{topic}</b>", cell), P(aim, cell), P(link.get(wk, ""), cell)])
    w = A4[0] - 36 * mm
    t = Table(rows, colWidths=[w * 0.09, w * 0.24, w * 0.39, w * 0.28], repeatRows=1)
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), WASH), ("GRID", (0, 0), (-1, -1), 0.6, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 7), ("LEFTPADDING", (0, 0), (-1, -1), 6)]))
    story = [NextPageTemplate("later"), info_strip([("Subject", "Mathematics"), ("Class", "SS 1"), ("Term", "First term"), ("Weeks", "12")]), Spacer(1, 12), t,
             Spacer(1, 12), P("This is a sample plan. Check it against your state's approved curriculum and your school calendar before use.", small)]
    doc.build(story, canvasmaker=NumberedCanvas)
    return path


if __name__ == "__main__":
    built = [
        practice_paper("jamb-utme-mathematics-practice-paper-1.pdf", "JAMB UTME Mathematics: Practice Paper 1",
                       "Twenty original questions in the style of the UTME, with answers and worked explanations.",
                       [("Exam", "JAMB UTME"), ("Subject", "Mathematics"), ("Questions", "20"), ("Time", "25 minutes")],
                       ["Answer every question. Each has one correct option.", "Calculators are not allowed, as in the real UTME.",
                        "Time yourself: aim for just over a minute per question.", "Check your answers on the last pages when you finish."],
                       C.JAMB_MATHS, seed=11),
        practice_paper("jamb-utme-use-of-english-practice-paper-1.pdf", "JAMB UTME Use of English: Practice Paper 1",
                       "A short comprehension passage and sixteen lexis and structure questions, all original, with explanations.",
                       [("Exam", "JAMB UTME"), ("Subject", "Use of English"), ("Questions", "20"), ("Time", "20 minutes")],
                       ["Read the passage carefully before you answer questions 1 to 4.", "Choose the option that best completes or answers each question.",
                        "Answers and explanations are on the last pages."],
                       C.JAMB_ENGLISH, seed=21, passage=C.UOE_PASSAGE, passage_qs=C.JAMB_ENGLISH_PASSAGE_QS),
        practice_paper("waec-biology-objective-practice-1.pdf", "WAEC Biology: Objective Practice 1",
                       "Fifteen original objective questions in the style of the WASSCE, across cells, nutrition, ecology, genetics and body systems.",
                       [("Exam", "WAEC WASSCE"), ("Subject", "Biology"), ("Questions", "15"), ("Time", "15 minutes")],
                       ["Answer every question.", "Each question carries one mark.", "Explanations follow the answer grid."],
                       C.WAEC_BIOLOGY, seed=31),
        practice_paper("waec-economics-objective-practice-1.pdf", "WAEC Economics: Objective Practice 1",
                       "Fifteen original objective questions on scarcity, demand, production, money and the economy.",
                       [("Exam", "WAEC WASSCE"), ("Subject", "Economics"), ("Questions", "15"), ("Time", "15 minutes")],
                       ["Answer every question.", "Each question carries one mark.", "Explanations follow the answer grid."],
                       C.WAEC_ECONOMICS, seed=41),
        practice_paper("common-entrance-practice-test-1.pdf", "Common Entrance: Practice Test 1",
                       "For Primary 6 pupils preparing for the National Common Entrance and school entrance tests. Fifteen original questions.",
                       [("Exam", "Common Entrance"), ("Class", "Primary 6"), ("Questions", "15"), ("Time", "20 minutes")],
                       ["Answer every question.", "Show your working on rough paper for the number questions.", "Answers are on the last page."],
                       C.COMMON_ENTRANCE, seed=51),
        notes_quadratics(),
        notes_parts_of_speech(),
        worksheet_fractions(),
        worksheet_counting(),
        scheme_of_work(),
    ]
    for p in built:
        print(p.name, p.stat().st_size)
