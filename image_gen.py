"""
image_gen.py
Gera logos estilo "texto grande com contorno sobre fundo abstrato",
em versao estatica (PNG) ou animada (GIF).

Nao depende do discord.py - pode ser testado isoladamente.
"""

import io
import math
import random
from typing import Optional, Tuple

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageColor, ImageOps, ImageChops

CANVAS_SIZE = (1024, 400)  # formato "banner"

# Lista de fontes candidatas (primeira que existir no sistema sera usada)
FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/google-fonts/Poppins-Black.ttf",
    "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]


def _load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default(size=size)


def _parse_color(value: Optional[str], default=(255, 255, 255)) -> Tuple[int, int, int]:
    """Aceita nomes (white, red...) ou hex (#ffffff / ffffff)."""
    if not value:
        return default
    value = value.strip()
    if not value.startswith("#") and len(value) in (3, 6) and all(c in "0123456789abcdefABCDEF" for c in value):
        value = "#" + value
    try:
        return ImageColor.getrgb(value)
    except ValueError:
        return default


def _make_abstract_background(size, base_color=(60, 20, 110), seed=None) -> Image.Image:
    """Gera um fundo abstrato tipo 'grunge roxo' proceduralmente (nao copia nenhuma imagem existente)."""
    rnd = random.Random(seed)
    w, h = size
    img = Image.new("RGB", size, base_color)
    draw = ImageDraw.Draw(img, "RGBA")

    # blobs difusos
    for _ in range(14):
        r = rnd.randint(int(min(w, h) * 0.15), int(min(w, h) * 0.5))
        cx, cy = rnd.randint(0, w), rnd.randint(0, h)
        shade = tuple(
            max(0, min(255, c + rnd.randint(-40, 60))) for c in base_color
        )
        alpha = rnd.randint(60, 130)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(*shade, alpha))

    img = img.filter(ImageFilter.GaussianBlur(radius=min(w, h) * 0.03))

    # "rachaduras" / streaks claros por cima
    draw2 = ImageDraw.Draw(img, "RGBA")
    for _ in range(8):
        x, y = rnd.randint(0, w), rnd.randint(0, h)
        points = [(x, y)]
        for _ in range(rnd.randint(3, 6)):
            x += rnd.randint(-w // 6, w // 6)
            y += rnd.randint(-h // 6, h // 6)
            points.append((x, y))
        width = rnd.randint(2, 5)
        light = tuple(min(255, c + 90) for c in base_color)
        draw2.line(points, fill=(*light, rnd.randint(50, 110)), width=width)

    img = img.filter(ImageFilter.GaussianBlur(radius=1.2))
    return img


def _make_solid_background(size, color) -> Image.Image:
    img = Image.new("RGB", size, color)
    # leve gradiente para nao ficar chapado
    top = tuple(min(255, c + 25) for c in color)
    bottom = tuple(max(0, c - 25) for c in color)
    grad = Image.new("RGB", size)
    for y in range(size[1]):
        t = y / max(1, size[1] - 1)
        row = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        ImageDraw.Draw(grad).line([(0, y), (size[0], y)], fill=row)
    return Image.blend(img, grad, 0.6)


def _prepare_background(size, bg_mode, bg_color_str, bg_image_bytes, seed=None) -> Image.Image:
    if bg_image_bytes:
        base = Image.open(io.BytesIO(bg_image_bytes)).convert("RGB")
        return ImageOps.fit(base, size, Image.LANCZOS)
    if bg_color_str:
        color = _parse_color(bg_color_str, default=(60, 20, 110))
        return _make_solid_background(size, color)
    return _make_abstract_background(size, seed=seed)


def _fit_font_for_text(draw, text, max_width, max_height):
    size = max_height
    font = _load_font(size)
    while size > 10:
        font = _load_font(size)
        bbox = draw.textbbox((0, 0), text, font=font, stroke_width=max(2, size // 22))
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        if w <= max_width and h <= max_height:
            return font
        size -= 4
    return font


def _draw_text_layer(size, text, text_color, seed_glow_alpha=255) -> Image.Image:
    """Retorna uma camada RGBA so com o texto (com contorno preto), pronta para compor."""
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    pad_w, pad_h = int(size[0] * 0.08), int(size[1] * 0.25)
    font = _fit_font_for_text(draw, text, size[0] - pad_w, size[1] - pad_h)

    bbox = draw.textbbox((0, 0), text, font=font, stroke_width=max(2, font.size // 22))
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pos = ((size[0] - w) / 2 - bbox[0], (size[1] - h) / 2 - bbox[1])

    stroke_w = max(2, font.size // 22)
    draw.text(
        pos,
        text,
        font=font,
        fill=(*text_color, seed_glow_alpha),
        stroke_width=stroke_w,
        stroke_fill=(0, 0, 0, 255),
    )
    return layer


def generate_static_logo(
    text: str,
    text_color: Optional[str] = "white",
    bg_color: Optional[str] = None,
    bg_image_bytes: Optional[bytes] = None,
    size=CANVAS_SIZE,
) -> bytes:
    color = _parse_color(text_color, default=(255, 255, 255))
    bg = _prepare_background(size, "auto", bg_color, bg_image_bytes).convert("RGBA")
    text_layer = _draw_text_layer(size, text, color)
    out = Image.alpha_composite(bg, text_layer).convert("RGB")

    buf = io.BytesIO()
    out.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


def _hue_shift(img: Image.Image, degrees: float) -> Image.Image:
    hsv = img.convert("HSV")
    h, s, v = hsv.split()
    shift = int((degrees / 360.0) * 255)
    h = h.point(lambda p: (p + shift) % 255)
    return Image.merge("HSV", (h, s, v)).convert("RGB")


def generate_animated_logo(
    text: str,
    text_color: Optional[str] = "white",
    bg_color: Optional[str] = None,
    bg_image_bytes: Optional[bytes] = None,
    size=CANVAS_SIZE,
    n_frames: int = 20,
    duration_ms: int = 70,
) -> bytes:
    color = _parse_color(text_color, default=(255, 255, 255))
    base_bg = _prepare_background(size, "auto", bg_color, bg_image_bytes, seed=42).convert("RGB")

    frames = []
    for i in range(n_frames):
        angle = (i / n_frames) * 360
        bg_frame = _hue_shift(base_bg, angle).convert("RGBA")

        # brilho pulsante no texto (efeito "glow")
        pulse = 0.6 + 0.4 * math.sin((i / n_frames) * 2 * math.pi)
        glow_color = tuple(min(255, int(c * (0.7 + 0.3 * pulse)) + 40) for c in color)

        text_layer = _draw_text_layer(size, text, glow_color)
        frame = Image.alpha_composite(bg_frame, text_layer).convert("RGB")
        frames.append(frame)

    buf = io.BytesIO()
    frames[0].save(
        buf,
        format="GIF",
        save_all=True,
        append_images=frames[1:],
        duration=duration_ms,
        loop=0,
        optimize=False,
    )
    buf.seek(0)
    return buf.read()


if __name__ == "__main__":
    # teste rapido local, sem discord
    png = generate_static_logo("NATA", text_color="white")
    with open("/home/claude/logobot/test_static.png", "wb") as f:
        f.write(png)

    png2 = generate_static_logo("NATA", text_color="#00ffcc", bg_color="#1a1a2e")
    with open("/home/claude/logobot/test_static_custom.png", "wb") as f:
        f.write(png2)

    gif = generate_animated_logo("NATA", text_color="white")
    with open("/home/claude/logobot/test_animated.gif", "wb") as f:
        f.write(gif)

    print("gerado com sucesso")
