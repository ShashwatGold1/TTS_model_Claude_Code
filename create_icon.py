#!/usr/bin/env python3
"""
Script to create PNG icon from SVG
Requires: pip install cairosvg pillow
"""

try:
    import cairosvg
    from PIL import Image
    import io
    import os

    # Convert SVG to PNG at different sizes
    sizes = [16, 32, 48, 64, 128, 256, 512]

    svg_path = 'icon.svg'

    # Read SVG file
    with open(svg_path, 'r') as f:
        svg_data = f.read()

    # Create PNG files
    for size in sizes:
        png_data = cairosvg.svg2png(bytestring=svg_data.encode('utf-8'), output_width=size, output_height=size)
        with open(f'icon_{size}.png', 'wb') as f:
            f.write(png_data)
        print(f'Created icon_{size}.png')

    # Create main icon.png at 256x256
    png_data = cairosvg.svg2png(bytestring=svg_data.encode('utf-8'), output_width=256, output_height=256)
    with open('icon.png', 'wb') as f:
        f.write(png_data)
    print('Created icon.png')

    # Try to create ICO file (contains multiple sizes)
    try:
        # Load all PNG sizes
        images = []
        for size in [16, 32, 48, 64, 128, 256]:
            img = Image.open(f'icon_{size}.png')
            images.append(img)

        # Save as ICO
        images[0].save('icon.ico', format='ICO', sizes=[(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)], append_images=images[1:])
        print('Created icon.ico')
    except Exception as e:
        print(f'Could not create ICO: {e}')

    print('\nIcon creation complete!')

except ImportError as e:
    print('Error: Missing required libraries')
    print('Please install: pip install cairosvg pillow')
    print(f'Details: {e}')
except Exception as e:
    print(f'Error creating icons: {e}')
