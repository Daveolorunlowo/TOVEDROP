from PIL import Image
import sys

try:
    img = Image.open('C:/Users/daveo/.gemini/antigravity/brain/b05150b5-9b35-4c37-93e8-5dcc999546d2/.user_uploaded/media_1790116551372.png')
    img = img.convert('RGB')
    w, h = img.size
    
    # Get center pixel
    c = img.getpixel((w//2, h//2))
    
    hex_color = f'#{c[0]:02X}{c[1]:02X}{c[2]:02X}'
    print(f'Color: {hex_color}')
except Exception as e:
    print(e)
