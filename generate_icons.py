import os
from PIL import Image, ImageDraw

os.makedirs('icons', exist_ok=True)

def create_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    s = size / 128.0
    
    pad = int(8 * s)
    radius = int(24 * s)
    
    # Base rounded card
    draw.rounded_rectangle(
        [pad, pad, size - pad, size - pad],
        radius=radius,
        fill=(79, 70, 229, 255) # Indigo 600
    )
    
    # Back tab
    bt_left = int(30 * s)
    bt_top = int(28 * s)
    bt_right = int(98 * s)
    bt_bottom = int(58 * s)
    bt_radius = int(8 * s)
    draw.rounded_rectangle(
        [bt_left, bt_top, bt_right, bt_bottom],
        radius=bt_radius,
        fill=(147, 197, 253, 220)
    )
    
    # Middle tab
    mt_left = int(24 * s)
    mt_top = int(42 * s)
    mt_right = int(104 * s)
    mt_bottom = int(72 * s)
    mt_radius = int(8 * s)
    draw.rounded_rectangle(
        [mt_left, mt_top, mt_right, mt_bottom],
        radius=mt_radius,
        fill=(224, 231, 255, 240)
    )
    
    # Front tab / Vault Card
    ft_left = int(20 * s)
    ft_top = int(56 * s)
    ft_right = int(108 * s)
    ft_bottom = int(98 * s)
    ft_radius = int(10 * s)
    draw.rounded_rectangle(
        [ft_left, ft_top, ft_right, ft_bottom],
        radius=ft_radius,
        fill=(255, 255, 255, 255)
    )
    
    # Colored dots inside front card
    dot1_x = int(34 * s)
    dot_y = int(70 * s)
    dot_r = int(4 * s)
    draw.ellipse([dot1_x - dot_r, dot_y - dot_r, dot1_x + dot_r, dot_y + dot_r], fill=(239, 68, 68, 255))
    draw.ellipse([dot1_x + int(12*s) - dot_r, dot_y - dot_r, dot1_x + int(12*s) + dot_r, dot_y + dot_r], fill=(245, 158, 11, 255))
    draw.ellipse([dot1_x + int(24*s) - dot_r, dot_y - dot_r, dot1_x + int(24*s) + dot_r, dot_y + dot_r], fill=(16, 185, 129, 255))
    
    # Vault horizontal bar
    arr_x = int(88 * s)
    draw.rounded_rectangle([arr_x - int(8*s), int(74*s), arr_x + int(8*s), int(80*s)], radius=int(3*s), fill=(79, 70, 229, 255))
    
    img.save(f'icons/icon{size}.png', 'PNG')

if __name__ == '__main__':
    for sz in [16, 32, 48, 128]:
        create_icon(sz)
    print("Icons generated successfully!")
