# Data2Image

Convert files to RGBA images and back.

## Overview

Data2Image allows you to transform any file into a PNG image and revert it back to its original form. The project includes three key scripts: the encoder, the decoder, and the main file.

## How It Works

- **Encoder**: This script encodes a file by transforming it into a PNG image. It dynamically calculates the size of the resulting image based on the file's content. To use the encoder, provide the path to the file you want to convert.

- **Decoder**: This script decodes the previously encoded PNG image back into the original file. It retrieves the file name and extension from the encoded data, ensuring that the complete original file is restored. To use the decoder, provide the path to the encoded image.

- **Main File**: `_old_python/main.py` serves as a demonstration of how the encoder and decoder methods can be utilized. It can be customized to fit specific needs or to benchmark the encoding and decoding performance on your system.

## Limitations

The primary limitations of Data2Image are determined by your system's capabilities and resources. Any file that can be converted into a byte stream can be transformed into an image and vice versa, regardless of the file extension. However, larger files will increase the encoding and decoding time, potentially slowing down the process.

## Future Plans

Future enhancements may include developing a graphical user interface (GUI) to make the tool more user-friendly. For now, Data2Image is fully functional and open for testing and customization. Feel free to explore and adapt it to your needs.