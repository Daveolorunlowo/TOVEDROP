import sys
from PIL import Image

try:
    img = Image.open('C:/Users/daveo/.gemini/antigravity/brain/b05150b5-9b35-4c37-93e8-5dcc999546d2/.user_uploaded/media_1790115398220.png')
    img = img.convert('RGB')
    w, h = img.size
    
    y = h // 2
    x1 = w // 6
    x2 = w // 2
    x3 = 5 * w // 6
    
    c1 = img.getpixel((x1, y))
    c2 = img.getpixel((x2, y))
    c3 = img.getpixel((x3, y))
    
    print(f'Color 1: #{c1[0]:02X}{c1[1]:02X}{c1[2]:02X}')
    print(f'Color 2: #{c2[0]:02X}{c2[1]:02X}{c2[2]:02X}')
    print(f'Color 3: #{c3[0]:02X}{c3[1]:02X}{c3[2]:02X}')
except Exception as e:
    print(e)
