import zlib
import os
from PIL import Image
import numpy as np


def image_to_file(image_path):
    try:
        # Check if the image exists
        if not os.path.isfile(image_path):
            print(f"Error: The image '{image_path}' does not exist.")
            return

        # Open the image and convert to numpy array
        img = Image.open(image_path)
        pixel_array = np.array(img)

        # Convert numpy array to bytes
        combined_bytes = pixel_array.tobytes()

        # Extract file name length and file name
        name_length = int.from_bytes(combined_bytes[:2], 'big')
        name_bytes = combined_bytes[2:2 + name_length]
        file_name = name_bytes.decode('utf-8')

        # Extract the compressed file bytes and decompress
        compressed_bytes = combined_bytes[2 + name_length:].rstrip(b'\x00')
        file_bytes = zlib.decompress(compressed_bytes)

        # Write the original file
        with open(file_name, 'wb') as f:
            f.write(file_bytes)

        print(f"Image '{image_path}' has been successfully decoded and file saved as '{file_name}'.")

        return file_name

    except Exception as e:
        print(f"An error occurred: {e}")
