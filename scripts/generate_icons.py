import os
import math
from PIL import Image, ImageDraw

def create_svg():
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%">
  <defs>
    <linearGradient id="shieldBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#121A15"/>
      <stop offset="50%" stop-color="#090E0B"/>
      <stop offset="100%" stop-color="#040705"/>
    </linearGradient>
    <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF0B3"/>
      <stop offset="30%" stop-color="#E6BA4E"/>
      <stop offset="70%" stop-color="#B8860B"/>
      <stop offset="100%" stop-color="#735100"/>
    </linearGradient>
    <linearGradient id="goldFacetLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFDF5"/>
      <stop offset="40%" stop-color="#F5D77F"/>
      <stop offset="100%" stop-color="#D4AF37"/>
    </linearGradient>
    <linearGradient id="goldFacetDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D4AF37"/>
      <stop offset="50%" stop-color="#9C7726"/>
      <stop offset="100%" stop-color="#594008"/>
    </linearGradient>
    <linearGradient id="vajraCore" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#6EE7B7"/>
      <stop offset="50%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="lightningGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#A7F3D0"/>
      <stop offset="100%" stop-color="#34D399"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.8"/>
    </filter>
    <filter id="coreGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Base Obsidian Shield with Gold Bevel -->
  <rect x="6" y="6" width="116" height="116" rx="28" fill="url(#shieldBg)" stroke="url(#goldRim)" stroke-width="3.5" filter="url(#shadow)"/>
  <rect x="11" y="11" width="106" height="106" rx="23" fill="none" stroke="#E6BA4E" stroke-width="1" stroke-opacity="0.3"/>

  <!-- VAJRA THUNDERBOLT & QUANTITATIVE EMBLAZON -->
  <g transform="translate(64, 64)">
    <!-- Outer Quantum Diamond Flashes -->
    <!-- Top Central Spike -->
    <polygon points="0,-46 8,-28 0,-20 -8,-28" fill="url(#goldFacetLight)"/>
    <polygon points="0,-46 0,-20 8,-28" fill="url(#goldFacetDark)"/>

    <!-- Bottom Central Spike -->
    <polygon points="0,46 8,28 0,20 -8,28" fill="url(#goldFacetLight)"/>
    <polygon points="0,46 0,20 -8,28" fill="url(#goldFacetDark)"/>

    <!-- Left Wing (The V of Vajra) -->
    <polygon points="-36,-32 -20,-12 -12,-20 -28,-36" fill="url(#goldFacetLight)"/>
    <polygon points="-36,-32 -20,-12 -28,-36" fill="url(#goldFacetDark)" opacity="0.4"/>
    
    <polygon points="-36,32 -20,12 -12,20 -28,36" fill="url(#goldFacetLight)"/>
    <polygon points="-36,32 -20,12 -28,36" fill="url(#goldFacetDark)" opacity="0.4"/>

    <!-- Right Wing (The V of Vajra) -->
    <polygon points="36,-32 20,-12 12,-20 28,-36" fill="url(#goldFacetDark)"/>
    <polygon points="36,-32 20,-12 28,-36" fill="url(#goldFacetLight)" opacity="0.6"/>

    <polygon points="36,32 20,12 12,20 28,32" fill="url(#goldFacetDark)"/>
    <polygon points="36,32 20,12 28,32" fill="url(#goldFacetLight)" opacity="0.6"/>

    <!-- Central Vajra Hub Sphere & Facets -->
    <circle cx="0" cy="0" r="18" fill="url(#goldFacetDark)" stroke="url(#goldRim)" stroke-width="2"/>
    <circle cx="0" cy="0" r="14" fill="#0C1510"/>

    <!-- Emerald Energy Core (Quantum Alpha Generator) -->
    <polygon points="0,-12 12,0 0,12 -12,0" fill="url(#vajraCore)" filter="url(#coreGlow)"/>
    <polygon points="0,-12 12,0 0,0" fill="#A7F3D0" opacity="0.75"/>

    <!-- Vertical Lightning Axis Line -->
    <line x1="0" y1="-38" x2="0" y2="38" stroke="url(#lightningGlow)" stroke-width="2.5" stroke-linecap="round" filter="url(#coreGlow)"/>
    <circle cx="0" cy="0" r="3.5" fill="#FFFFFF"/>
  </g>
</svg>
"""

def render_png(size):
    # Render with 4x supersampling for high-quality anti-aliasing
    scale = 4
    dim = size * scale
    img = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = dim / 2, dim / 2
    r_shield = dim * 0.44
    border_w = max(2, int(dim * 0.028))

    # Draw rounded shield background
    x0, y0 = cx - r_shield, cy - r_shield
    x1, y1 = cx + r_shield, cy + r_shield
    corner = int(dim * 0.22)

    # Base background #080E0B
    draw.rounded_rectangle([x0, y0, x1, y1], radius=corner, fill=(9, 14, 11, 255), outline=(218, 175, 60, 255), width=border_w)
    
    # Inner rim
    inner_pad = int(dim * 0.035)
    draw.rounded_rectangle([x0 + inner_pad, y0 + inner_pad, x1 - inner_pad, y1 - inner_pad], radius=max(4, corner - inner_pad), outline=(184, 134, 11, 100), width=max(1, border_w // 3))

    def S(x, y):
        return (cx + x * dim * 0.0078, cy + y * dim * 0.0078)

    # Polygons in relative coords (-64 to +64)
    # Top & bottom spikes
    draw.polygon([S(0, -46), S(8, -28), S(0, -20), S(-8, -28)], fill=(245, 215, 127, 255))
    draw.polygon([S(0, -46), S(0, -20), S(8, -28)], fill=(184, 134, 11, 255))

    draw.polygon([S(0, 46), S(8, 28), S(0, 20), S(-8, 28)], fill=(245, 215, 127, 255))
    draw.polygon([S(0, 46), S(0, 20), S(-8, 28)], fill=(184, 134, 11, 255))

    # Wings (V-shape)
    draw.polygon([S(-36, -32), S(-20, -12), S(-12, -20), S(-28, -36)], fill=(255, 243, 196, 255))
    draw.polygon([S(-36, 32), S(-20, 12), S(-12, 20), S(-28, 36)], fill=(255, 243, 196, 255))

    draw.polygon([S(36, -32), S(20, -12), S(12, -20), S(28, -36)], fill=(184, 134, 11, 255))
    draw.polygon([S(36, 32), S(20, 12), S(12, 20), S(28, 32)], fill=(184, 134, 11, 255))

    # Central Hub
    hub_r = dim * 0.14
    draw.ellipse([cx - hub_r, cy - hub_r, cx + hub_r, cy + hub_r], fill=(12, 21, 16, 255), outline=(230, 186, 78, 255), width=max(1, int(dim * 0.015)))

    # Emerald core
    core_pts = [S(0, -12), S(12, 0), S(0, 12), S(-12, 0)]
    draw.polygon(core_pts, fill=(16, 185, 129, 255))
    draw.polygon([S(0, -12), S(12, 0), S(0, 0)], fill=(167, 243, 208, 255))

    # Center beam line
    draw.line([S(0, -36), S(0, 36)], fill=(110, 231, 183, 255), width=max(2, int(dim * 0.02)))
    draw.ellipse([cx - dim*0.025, cy - dim*0.025, cx + dim*0.025, cy + dim*0.025], fill=(255, 255, 255, 255))

    # Downscale smoothly with Lanczos
    return img.resize((size, size), Image.Resampling.LANCZOS)

def main():
    svg_content = create_svg()
    
    # 1. Write SVGs
    with open("public/favicon.svg", "w", encoding="utf-8") as f:
        f.write(svg_content)
    with open("public/icon.svg", "w", encoding="utf-8") as f:
        f.write(svg_content)
    print("Saved public/favicon.svg & public/icon.svg")

    # 2. Render multi-size PNGs
    img_512 = render_png(512)
    img_512.save("public/icon-512.png", "PNG")

    img_180 = render_png(180)
    img_180.save("public/apple-touch-icon.png", "PNG")
    os.makedirs("public/__grok", exist_ok=True)
    img_180.save("public/__grok/icon-180.png", "PNG")
    print("Saved icon-512.png & icon-180.png")

    # 3. Create true multi-resolution favicon.ico (16, 32, 48, 64)
    img_16 = render_png(16)
    img_32 = render_png(32)
    img_48 = render_png(48)
    img_64 = render_png(64)
    img_256 = render_png(256)

    img_256.save(
        "public/favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (256, 256)],
        append_images=[img_64, img_48, img_32, img_16]
    )
    print("Saved public/favicon.ico with multi-resolution frames (16 to 256px)")

if __name__ == "__main__":
    main()
