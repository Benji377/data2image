import zlib
import os
from PIL import Image
import numpy as np


def file_to_image(file_path):
    try:
        # Check if the file exists
        if not os.path.isfile(file_path):
            print(f"Error: The file '{file_path}' does not exist.")
            return

        # Read file and compress
        with open(file_path, 'rb') as f:
            file_bytes = f.read()
        compressed_bytes = zlib.compress(file_bytes)

        # Get file name and extension
        file_name = os.path.basename(file_path)
        name_bytes = file_name.encode('utf-8')

        # Combine file name and compressed file bytes
        combined_bytes = len(name_bytes).to_bytes(2, 'big') + name_bytes + compressed_bytes

        # Calculate required image size
        total_bytes = len(combined_bytes)
        side_length = int(np.ceil(np.sqrt(total_bytes / 4)))
        total_pixels = side_length * side_length

        # Pad combined_bytes to fit into the image
        padded_bytes = combined_bytes + b'\x00' * (total_pixels * 4 - total_bytes)

        # Convert bytes to numpy array and reshape to RGBA
        pixel_array = np.frombuffer(padded_bytes, dtype=np.uint8).reshape((side_length, side_length, 4))

        # Create and save the image
        img = Image.fromarray(pixel_array, 'RGBA')
        output_image_path = f"{file_name}.png"
        img.save(output_image_path)

        print(f"File '{file_path}' has been successfully encoded into image '{output_image_path}'.")

        return output_image_path

    except Exception as e:
        print(f"An error occurred: {e}")
