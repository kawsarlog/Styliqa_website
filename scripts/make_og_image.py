import math
from PIL import Image, ImageDraw, ImageFont, ImageOps

W, H = 1200, 630
VOID = (26, 18, 20)       # --void
BRAND = (179, 29, 46)     # --brand
BRAND_DEEP = (142, 21, 34)
TERRACOTTA = (201, 123, 91)
CREAM = (255, 252, 249)

BASE = "C:/Users/USER/Desktop/styliqa"


def load_font(path, size):
    return ImageFont.truetype(path, size)


def circular_logo(path, size):
    im = Image.open(path).convert("RGB").resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse((0, 0, size, size), fill=255)
    out = Image.new("RGBA", (size, size))
    out.paste(im, (0, 0), mask)
    return out


def make_card(title_lines, tagline, out_name):
    img = Image.new("RGB", (W, H), VOID)
    d = ImageDraw.Draw(img)

    # subtle corner accent - soft diagonal brand-red glow bottom right
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((W - 500, H - 420, W + 300, H + 300), fill=(179, 29, 46, 40))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    d = ImageDraw.Draw(img)

    # thin top accent rule
    d.rectangle([(0, 0), (W, 6)], fill=BRAND)

    # logo
    logo_size = 108
    logo = circular_logo(f"{BASE}/assets/img/logo.jpg", logo_size)
    lx, ly = 90, 84
    img.paste(logo, (lx, ly), logo)
    d = ImageDraw.Draw(img)

    word_font = load_font(f"{BASE}/scripts/fonts/BodoniModa.ttf", 56)
    d.text((lx + logo_size + 28, ly + 24), "Styliqa", font=word_font, fill=CREAM)

    # divider line
    d.line([(90, 226), (W - 90, 226)], fill=(255, 252, 249, 40), width=1)

    # Title (headline) - wrap manually via given lines
    title_font = load_font(f"{BASE}/scripts/fonts/BodoniModa.ttf", 64)
    ty = 264
    for line in title_lines:
        d.text((90, ty), line, font=title_font, fill=CREAM)
        ty += 74

    # tagline
    tag_font = load_font(f"{BASE}/scripts/fonts/Archivo.ttf", 28)
    d.text((90, H - 90), tagline, font=tag_font, fill=(201, 123, 91))

    img.save(f"{BASE}/assets/img/og/{out_name}", "PNG")
    print("wrote", out_name)


# Default site-wide OG image
make_card(
    ["From sketch to production-", "ready sample."],
    "FASHION TECH PACKS  ·  PATTERN MAKING & GRADING  ·  3D VISUALIZATION",
    "og-default.png",
)

# Blog: tech pack vs flat sketch
make_card(
    ["Tech Pack vs. Flat Sketch:", "What Your Factory Needs"],
    "STYLIQA JOURNAL",
    "og-blog-tech-pack-vs-flat-sketch.png",
)

# Blog: pattern grading 101
make_card(
    ["Pattern Grading 101: One", "Size Becomes a Full Range"],
    "STYLIQA JOURNAL",
    "og-blog-pattern-grading-101.png",
)

# Blog index
make_card(
    ["The Styliqa Journal"],
    "NOTES ON TECH PACKS, PATTERNS & PRODUCTION",
    "og-blog-index.png",
)
