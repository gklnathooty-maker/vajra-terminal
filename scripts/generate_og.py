from PIL import Image, ImageDraw, ImageFont
import math

def generate_og():
    width = 1200
    height = 630
    img = Image.new("RGB", (width, height), (7, 11, 9))
    draw = ImageDraw.Draw(img)

    # 1. Subtle radial gradient & grid lines
    cx, cy = 320, 315
    for r in range(500, 0, -20):
        alpha = int(18 * (1 - r / 500))
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(12 + alpha, 18 + alpha, 14 + alpha))

    # Grid accents
    for x in range(0, width, 60):
        draw.line([x, 0, x, height], fill=(15, 23, 18), width=1)
    for y in range(0, height, 60):
        draw.line([0, y, width, y], fill=(15, 23, 18), width=1)

    # Outer border
    draw.rounded_rectangle([20, 20, width - 20, height - 20], radius=24, outline=(218, 175, 60), width=3)
    draw.rounded_rectangle([28, 28, width - 28, height - 28], radius=18, outline=(184, 134, 11), width=1)

    # 2. Draw Large Vajra Emblem at (cx, cy)
    r_shield = 180
    corner = 40
    draw.rounded_rectangle(
        [cx - r_shield, cy - r_shield, cx + r_shield, cy + r_shield],
        radius=corner,
        fill=(10, 16, 12),
        outline=(230, 186, 78),
        width=5
    )
    draw.rounded_rectangle(
        [cx - r_shield + 12, cy - r_shield + 12, cx + r_shield - 12, cy + r_shield - 12],
        radius=30,
        outline=(140, 100, 20),
        width=2
    )

    def S(x, y):
        return (cx + x * 3.2, cy + y * 3.2)

    # Top & bottom spikes
    draw.polygon([S(0, -46), S(8, -28), S(0, -20), S(-8, -28)], fill=(255, 243, 196))
    draw.polygon([S(0, -46), S(0, -20), S(8, -28)], fill=(184, 134, 11))
    draw.polygon([S(0, 46), S(8, 28), S(0, 20), S(-8, 28)], fill=(255, 243, 196))
    draw.polygon([S(0, 46), S(0, 20), S(-8, 28)], fill=(184, 134, 11))

    # Wings (V-shape)
    draw.polygon([S(-36, -32), S(-20, -12), S(-12, -20), S(-28, -36)], fill=(255, 240, 180))
    draw.polygon([S(-36, 32), S(-20, 12), S(-12, 20), S(-28, 36)], fill=(255, 240, 180))
    draw.polygon([S(36, -32), S(20, -12), S(12, -20), S(28, -36)], fill=(184, 134, 11))
    draw.polygon([S(36, 32), S(20, 12), S(12, 20), S(28, 32)], fill=(184, 134, 11))

    # Central Hub
    draw.ellipse([cx - 58, cy - 58, cx + 58, cy + 58], fill=(12, 21, 16), outline=(230, 186, 78), width=4)
    # Emerald Core
    core_pts = [S(0, -12), S(12, 0), S(0, 12), S(-12, 0)]
    draw.polygon(core_pts, fill=(16, 185, 129))
    draw.polygon([S(0, -12), S(12, 0), S(0, 0)], fill=(167, 243, 208))
    # Lightning Axis
    draw.line([S(0, -36), S(0, 36)], fill=(110, 231, 183), width=7)
    draw.ellipse([cx - 9, cy - 9, cx + 9, cy + 9], fill=(255, 255, 255))

    # 3. Typography (Right Side)
    tx = 570
    # Badge
    draw.rounded_rectangle([tx, 160, tx + 240, 195], radius=6, fill=(25, 38, 30), outline=(218, 175, 60), width=1)
    # For default font
    try:
        font_large = ImageFont.truetype("arialbd.ttf", 64)
        font_sub = ImageFont.truetype("arial.ttf", 22)
        font_pill = ImageFont.truetype("arialbd.ttf", 14)
        font_tag = ImageFont.truetype("arial.ttf", 18)
    except:
        font_large = ImageFont.load_default()
        font_sub = font_large
        font_pill = font_large
        font_tag = font_large

    draw.text((tx + 16, 170), "PRO QUANT WORKSTATION", fill=(245, 215, 127), font=font_pill)

    # Main Brand Name
    draw.text((tx, 225), "VAJRA TERMINAL", fill=(247, 243, 230), font=font_large)

    # Subtitle
    draw.text((tx, 315), "INSTITUTIONAL QUANTITATIVE DESK", fill=(218, 175, 60), font=font_sub)
    draw.text((tx, 350), "NSE & BSE INDIA · LIVE ORDER FLOW & ADVISOR", fill=(138, 158, 146), font=font_tag)

    # Feature pills
    draw.rounded_rectangle([tx, 415, tx + 180, 450], radius=6, fill=(18, 28, 22), outline=(34, 197, 94), width=1)
    draw.text((tx + 16, 425), "SUB-10MS ENGINE", fill=(74, 222, 128), font=font_pill)

    draw.rounded_rectangle([tx + 195, 415, tx + 375, 450], radius=6, fill=(18, 28, 22), outline=(218, 175, 60), width=1)
    draw.text((tx + 211, 425), "256-BIT SECURITY", fill=(250, 204, 21), font=font_pill)

    draw.rounded_rectangle([tx + 390, 415, tx + 570, 450], radius=6, fill=(18, 28, 22), outline=(96, 165, 250), width=1)
    draw.text((tx + 408, 425), "600+ STOCKS", fill=(147, 197, 253), font=font_pill)

    # Bottom status
    draw.text((tx, 490), "Protected by Vajra Link-Only Access Gate", fill=(110, 130, 120), font=font_tag)

    img.save("public/og.jpg", "JPEG", quality=95)
    print("Saved public/og.jpg successfully!")

if __name__ == "__main__":
    generate_og()

