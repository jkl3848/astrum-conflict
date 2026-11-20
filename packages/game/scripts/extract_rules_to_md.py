"""Extract Astrum Conflict rules PDF to Markdown sections (stdlib only)."""
from __future__ import annotations

import json
import re
import zlib
from pathlib import Path

PDF = Path(r"D:\projects\minis_game\printables\pdfs\v0.1.0\Astrum Conflict Rules v0.1.0.pdf")
CONTENT = Path(__file__).resolve().parents[1] / "content"
RULES_DIR = CONTENT / "rules"


def load_pdf_objects(data: bytes) -> dict[int, bytes]:
    objs: dict[int, bytes] = {}
    for m in re.finditer(rb"(\d+) 0 obj(.*?)endobj", data, re.S):
        objs[int(m.group(1))] = m.group(2)
    return objs


def stream_bytes(objs: dict[int, bytes], n: int) -> bytes:
    b = objs[n]
    m = re.search(rb"stream\r?\n(.*?)\r?\nendstream", b, re.S)
    if not m:
        return b""
    s = m.group(1)
    try:
        return zlib.decompress(s)
    except Exception:
        return s


def ref(objs: dict[int, bytes], obj_body: bytes, key: bytes) -> int | None:
    m = re.search(rb"/" + key + rb"\s+(\d+) 0 R", obj_body)
    return int(m.group(1)) if m else None


def parse_cmap(objs: dict[int, bytes], n: int) -> dict[int, str]:
    s = stream_bytes(objs, n)
    mp: dict[int, str] = {}
    for blk in re.findall(rb"beginbfchar(.*?)endbfchar", s, re.S):
        for a, b in re.findall(rb"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", blk):
            mp[int(a, 16)] = bytes.fromhex(b.decode()).decode("utf-16-be", "ignore")
    for blk in re.findall(rb"beginbfrange(.*?)endbfrange", s, re.S):
        for a, b, c in re.findall(rb"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", blk):
            st = int(c, 16)
            for i, g in enumerate(range(int(a, 16), int(b, 16) + 1)):
                mp[g] = chr(st + i)
    return mp


def page_order(objs: dict[int, bytes]) -> list[int]:
    root = [n for n, b in objs.items() if re.search(rb"/Type\s*/Pages", b) and b"/Parent" not in b][0]

    def walk(n: int, res: list[int]) -> None:
        b = objs[n]
        if re.search(rb"/Type\s*/Pages", b):
            kids = re.search(rb"/Kids\s*\[(.*?)\]", b, re.S)
            if kids:
                for k in re.findall(rb"(\d+) 0 R", kids.group(1)):
                    walk(int(k), res)
        else:
            res.append(n)

    res: list[int] = []
    walk(root, res)
    return res


def extract_text(pdf_path: Path) -> str:
    data = pdf_path.read_bytes()
    objs = load_pdf_objects(data)
    parts: list[str] = []
    for pn in page_order(objs):
        pb = objs[pn]
        resources = pb
        r = ref(objs, pb, b"Resources")
        if r:
            resources = objs[r]
        fm = re.search(rb"/Font\s*(<<.*?>>|\d+ 0 R)", resources, re.S)
        if not fm:
            continue
        fm_body = fm.group(1)
        if fm_body.endswith(b"R"):
            fm_body = objs[int(fm_body.split()[0])]
        fonts: dict[bytes, dict[int, str]] = {}
        for name, num in re.findall(rb"/(\w+)\s+(\d+) 0 R", fm_body):
            tu = ref(objs, objs[int(num)], b"ToUnicode")
            fonts[name] = parse_cmap(objs, tu) if tu else {}
        cs = re.search(rb"/Contents\s*(\[.*?\]|\d+ 0 R)", pb, re.S)
        if not cs:
            continue
        content = b"".join(stream_bytes(objs, int(x)) for x in re.findall(rb"(\d+) 0 R", cs.group(1)))
        cur: dict[int, str] = {}
        out: list[str] = []
        lasty: str | None = None
        pat = re.compile(
            rb"/(\w+)\s+[\d.]+\s+Tf"
            rb"|\[(.*?)\]\s*TJ"
            rb"|<([0-9A-Fa-f]*)>\s*Tj"
            rb"|([\d.\-]+)\s+([\d.\-]+)\s+Td"
            rb"|[\d.\-]+ [\d.\-]+ [\d.\-]+ [\d.\-]+ ([\d.\-]+) ([\d.\-]+) Tm",
            re.S,
        )
        for tok in pat.finditer(content):
            if tok.group(1):
                cur = fonts.get(tok.group(1), {})
            elif tok.group(2) is not None or tok.group(3) is not None:
                hexes = re.findall(rb"<([0-9A-Fa-f]*)>", tok.group(2)) if tok.group(2) is not None else [tok.group(3)]
                for h in hexes:
                    hd = h.decode()
                    for i in range(0, len(hd), 4):
                        g = int(hd[i : i + 4], 16)
                        out.append(cur.get(g, "?"))
            elif tok.group(7) is not None:
                y = tok.group(7)
                if y != lasty:
                    out.append("\n")
                    lasty = y
            elif tok.group(5) is not None:
                if float(tok.group(5)) != 0:
                    out.append("\n")
        parts.append("".join(out))
    return "\n".join(parts)


def normalize(raw: str) -> str:
    s = raw.replace("\x00", "")
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r" (●|\d+\. |\d+\.\d+(?:\.\d+)? )", r"\n\1", s)
    s = re.sub(r" ([IVX]+\. )", r"\n\1", s)
    s = re.sub(r"=========== PAGE BREAK ===========", "\n", s)
    return s.strip()


def main() -> None:
    raw = extract_text(PDF)
    text = normalize(raw)
    debug = CONTENT / "_extract_debug.txt"
    debug.write_text(text, encoding="utf-8")
    print(f"Wrote debug extract ({len(text)} chars) to {debug}")
    if "Heat" in text:
        print("Found Heat in rules text")
    else:
        print("Heat not in rules text (likely symbols reference only)")


if __name__ == "__main__":
    main()