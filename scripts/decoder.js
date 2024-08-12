document.getElementById('decodeButton').addEventListener('click', function() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
        alert("Please select an image to decode.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const buffer = new Uint8Array(event.target.result);
            console.log("Image Buffer:", buffer);
            const img = UPNG.decode(buffer);
            console.log("Decoded Image:", img);
            const rgbaArray = UPNG.toRGBA8(img);

            const pixelArray = rgbaArray[0];
            console.log("Pixel Array:", pixelArray);

            // Extract file name length
            const nameLength = new DataView(pixelArray).getUint16(0, false);
            console.log("Extracted Name Length:", nameLength);

            const nameBytes = pixelArray.slice(2, 2 + nameLength);
            console.log("Extracted File Name Bytes:", nameBytes);
            const fileName = new TextDecoder().decode(nameBytes);
            console.log("Extracted File Name:", fileName);

            // Extract the compressed file bytes and decompress
            const compressedBytes = pixelArray.slice(2 + nameLength);
            console.log("Compressed Bytes (with padding):", compressedBytes);

            // Convert to Uint8Array
            const compressedArray = new Uint8Array(compressedBytes);
            console.log("Compressed Data:", compressedArray);

            // Remove padding from the compressed data by removing all trailing zeros
            // Watch out because data could start with zeros or have zeros in the middle
            // To remove all trailing zeros, we need to find the last non-zero index
            let lastNonZeroIndex = compressedArray.length - 1;
            while (compressedArray[lastNonZeroIndex] === 0) {
                lastNonZeroIndex--;
            }
            const compressedData = compressedArray.slice(0, lastNonZeroIndex + 1);
            console.log("Compressed Data (without padding):", compressedData);

            const decompressedData = pako.inflate(compressedData);
            console.log("Decompressed Data:", decompressedData);

            // Create a blob and download link
            const blob = new Blob([decompressedData]);
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = fileName;
            downloadLink.click();

            // Clear the file input field
            fileInput.value = '';
        } catch (error) {
            console.error("An error occurred:", error);
            alert("An error occurred while decoding the image.");
        }
    };

    reader.readAsArrayBuffer(file);
});