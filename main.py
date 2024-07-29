import time
import filecmp
import os
from encoder import file_to_image
from decoder import image_to_file


def main():
    try:
        # Get user input for file path and number of cores
        file_path = input("Enter the path of the file to encode and decode: ").strip()

        # Normalize the file path
        normalized_path = os.path.normpath(file_path)
        print(f"Normalized path: {normalized_path}")

        # Validate file path
        if not os.path.isfile(normalized_path):
            print(f"Error: The file '{normalized_path}' does not exist.")
            return

        # Measure encoding time
        start_time = time.time()
        encoded_image_path = file_to_image(normalized_path)
        encoding_time = time.time() - start_time

        # Measure decoding time
        start_time = time.time()
        decoded_file_path = image_to_file(encoded_image_path)
        decoding_time = time.time() - start_time

        # Verify if the original file and decoded file are the same
        original_file = normalized_path
        decoded_file = decoded_file_path

        print(f"Comparing original file: {original_file}")
        print(f"Comparing decoded file: {decoded_file}")

        if filecmp.cmp(original_file, decoded_file, shallow=False):
            print("Success: The original file and decoded file are identical.")
        else:
            print("Error: The original file and decoded file differ.")

        print(f"Encoding time: {encoding_time:.2f} seconds")
        print(f"Decoding time: {decoding_time:.2f} seconds")

    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    main()
