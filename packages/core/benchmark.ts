import { encode, decode } from "./src/index.js";
import { randomBytes } from "node:crypto";
import { performance } from "node:perf_hooks";

async function benchmark() {
  const sizes = [1 * 1024 * 1024, 5 * 1024 * 1024, 10 * 1024 * 1024]; // 1MB, 5MB, 10MB
  console.log("--- Benchmark: Encoding/Decoding ---");
  
  for (const size of sizes) {
    const data = new Uint8Array(randomBytes(size));
    const filename = `test_${size}.bin`;
    
    console.log(`\nSize: ${(size / (1024 * 1024)).toFixed(1)} MB`);
    
    // Benchmark Encode
    const startEncode = performance.now();
    const png = encode(data, filename);
    const endEncode = performance.now();
    console.log(`  Encode: ${(endEncode - startEncode).toFixed(2)} ms`);
    
    // Benchmark Decode
    const startDecode = performance.now();
    const result = decode(png);
    const endDecode = performance.now();
    console.log(`  Decode: ${(endDecode - startDecode).toFixed(2)} ms`);
    
    if (result.data.length !== data.length) {
      console.error("  ERROR: Data length mismatch!");
    }
  }
}

benchmark().catch(console.error);
