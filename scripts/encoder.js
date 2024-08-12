async function compressData(data) {
    return pako.deflate(data, { to: 'uint8array' });
}

document.getElementById('encodeButton').addEventListener('click', async function() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
        alert("Please select a file to encode.");
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const fileName = file.name;
            const fileData = new Uint8Array(event.target.result);

            console.log("Original File Data:", fileData);

            // Compress file data
            const compressedData = await compressData(fileData);

            console.log("Compressed Data:", compressedData);

            // Encode file name and compressed data
            const nameBytes = new TextEncoder().encode(fileName);
            const nameLengthBytes = new Uint8Array(2);
            new DataView(nameLengthBytes.buffer).setUint16(0, nameBytes.length, false);

            const combinedBytes = new Uint8Array(nameLengthBytes.length + nameBytes.length + compressedData.length);
            combinedBytes.set(nameLengthBytes);
            combinedBytes.set(nameBytes, nameLengthBytes.length);
            combinedBytes.set(compressedData, nameLengthBytes.length + nameBytes.length);

            console.log("Combined Bytes:", combinedBytes);

            // Calculate required image dimensions
            const totalBytes = combinedBytes.length;
            const sideLength = Math.ceil(Math.sqrt(totalBytes / 4));
            const totalPixels = sideLength * sideLength;

            // Pad combinedBytes to fit into the image
            const paddedBytes = new Uint8Array(totalPixels * 4);
            paddedBytes.set(combinedBytes);
            paddedBytes.fill(0, combinedBytes.length);

            console.log("Padded Bytes:", paddedBytes);

            // Create a PNG image from the pixel array using UPNG
            const rgbaArray = new Uint8Array(totalPixels * 4);
            for (let i = 0; i < totalPixels; i++) {
                rgbaArray[i * 4] = paddedBytes[i * 4];       // R
                rgbaArray[i * 4 + 1] = paddedBytes[i * 4 + 1]; // G
                rgbaArray[i * 4 + 2] = paddedBytes[i * 4 + 2]; // B
                rgbaArray[i * 4 + 3] = paddedBytes[i * 4 + 3]; // A
            }

            console.log("RGBA Array:", rgbaArray);
            const pngData = UPNG.encodeLL([rgbaArray.buffer], sideLength, sideLength, 3, 1, 8);
            console.log("PNG Data:", pngData);
            const blob = new Blob([pngData], { type: 'image/png' });
            console.log("Blob:", blob);

            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = `${fileName}.png`;
            downloadLink.click();

            // Clear the file input field
            fileInput.value = '';
        } catch (error) {
            console.error("An error occurred:", error);
            alert("An error occurred while encoding the file.");
        }
    };

    reader.readAsArrayBuffer(file);
});