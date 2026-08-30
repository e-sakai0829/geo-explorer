import os
import math
from PIL import Image, ImageDraw, ImageFilter

def create_favicon(size=512):
    # Super-sampling scale
    scale = 4
    canvas_size = size * scale
    
    # 1. Base image with transparency
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    
    # 2. Rounded background with gradient
    corner_radius = int(112 * scale)
    
    # Create mask for rounded rectangle
    mask = Image.new("L", (canvas_size, canvas_size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([(0, 0), (canvas_size, canvas_size)], radius=corner_radius, fill=255)
    
    # Create gradient background
    grad = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    grad_draw = ImageDraw.Draw(grad)
    
    # Diagonal gradient (#3730a3 -> #4f46e5 -> #7c3aed)
    c1 = (55, 48, 163)   # Indigo 800
    c2 = (79, 70, 229)   # Indigo 600
    c3 = (124, 58, 237)  # Violet 600
    
    for y in range(canvas_size):
        for x in range(0, canvas_size, 4): # step for perf
            t = (x + y) / (2 * canvas_size)
            if t < 0.5:
                factor = t * 2
                r = int(c1[0] + (c2[0] - c1[0]) * factor)
                g = int(c1[1] + (c2[1] - c1[1]) * factor)
                b = int(c1[2] + (c2[2] - c1[2]) * factor)
            else:
                factor = (t - 0.5) * 2
                r = int(c2[0] + (c3[0] - c2[0]) * factor)
                g = int(c2[1] + (c3[1] - c2[1]) * factor)
                b = int(c2[2] + (c3[2] - c2[2]) * factor)
            grad_draw.rectangle([(x, y), (x+3, y)], fill=(r, g, b, 255))
            
    # Apply rounded mask to gradient
    bg = Image.composite(grad, img, mask)
    
    # Add subtle border highlight
    border_img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    border_draw = ImageDraw.Draw(border_img)
    border_draw.rounded_rectangle([(scale*2, scale*2), (canvas_size - scale*2, canvas_size - scale*2)], 
                                  radius=corner_radius - scale*2, 
                                  outline=(255, 255, 255, 40), 
                                  width=int(4 * scale))
    
    # 3. Draw Sparkles
    sparkle_img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    sp_draw = ImageDraw.Draw(sparkle_img)
    
    # Helper to draw a 4-point sparkle
    def draw_sparkle(center_x, center_y, radius_x, radius_y, fill_color, power=2.5):
        points = []
        steps = 120
        for i in range(steps):
            theta = 2 * math.pi * i / steps
            cos_t = math.cos(theta)
            sin_t = math.sin(theta)
            
            # Astroid curve
            denom = (abs(cos_t)**power + abs(sin_t)**power) ** (1.0 / power)
            if denom > 0:
                r = 1.0 / denom
            else:
                r = 0
            px = center_x + radius_x * r * cos_t
            py = center_y + radius_y * r * sin_t
            points.append((px, py))
            
        sp_draw.polygon(points, fill=fill_color)

    # Main Center Sparkle
    cx, cy = 256 * scale, 256 * scale
    # Glow around center
    glow_img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    glow_draw.ellipse([(cx - 150*scale, cy - 150*scale), (cx + 150*scale, cy + 150*scale)], fill=(165, 180, 252, 60))
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=30*scale))
    
    # Draw main sparkle
    draw_sparkle(cx, cy, 140 * scale, 140 * scale, (255, 255, 255, 255), power=1.8)
    
    # Top-Right Secondary Sparkle
    draw_sparkle(365 * scale, 145 * scale, 55 * scale, 55 * scale, (224, 231, 255, 240), power=1.8)
    
    # Bottom-Left Dot
    bl_x, bl_y = 150 * scale, 360 * scale
    sp_draw.ellipse([(bl_x - 12*scale, bl_y - 12*scale), (bl_x + 12*scale, bl_y + 12*scale)], fill=(199, 210, 254, 220))

    # Composite everything
    final = Image.alpha_composite(bg, border_img)
    final = Image.alpha_composite(final, glow_img)
    final = Image.alpha_composite(final, sparkle_img)
    
    # Resize down with Lanczos filter for ultra-crisp antialiasing
    result = final.resize((size, size), Image.Resampling.LANCZOS)
    return result

if __name__ == "__main__":
    out_dir = r"c:\Users\jiro-\cursor 作業\08_SEO_LLMO戦略\geo-explorer-app"
    
    # 1. High-res 512x512
    img512 = create_favicon(512)
    img512.save(os.path.join(out_dir, "public", "icon-512.png"))
    img512.save(os.path.join(out_dir, "src", "app", "icon.png"))
    
    # 2. Apple Touch Icon 180x180
    img180 = img512.resize((180, 180), Image.Resampling.LANCZOS)
    img180.save(os.path.join(out_dir, "public", "apple-touch-icon.png"))
    img180.save(os.path.join(out_dir, "src", "app", "apple-icon.png"))
    
    # 3. 32x32 and 16x16 PNGs
    img32 = img512.resize((32, 32), Image.Resampling.LANCZOS)
    img32.save(os.path.join(out_dir, "public", "favicon-32x32.png"))
    
    img16 = img512.resize((16, 16), Image.Resampling.LANCZOS)
    img16.save(os.path.join(out_dir, "public", "favicon-16x16.png"))
    
    # 4. Multi-res ICO file
    ico_images = [
        img512.resize((16, 16), Image.Resampling.LANCZOS),
        img512.resize((32, 32), Image.Resampling.LANCZOS),
        img512.resize((48, 48), Image.Resampling.LANCZOS),
        img512.resize((64, 64), Image.Resampling.LANCZOS),
        img512.resize((128, 128), Image.Resampling.LANCZOS),
        img512.resize((256, 256), Image.Resampling.LANCZOS),
    ]
    ico_images[0].save(
        os.path.join(out_dir, "public", "favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
        append_images=ico_images[1:]
    )
    ico_images[0].save(
        os.path.join(out_dir, "src", "app", "favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
        append_images=ico_images[1:]
    )
    
    print("Favicon assets generated successfully!")
