// Wrapper for upng-js CJS module to handle ESM interop
import _UPNG from "upng-js";

interface UPNGModule {
  encode(bufs: ArrayBuffer[], w: number, h: number, ps?: number, dels?: number[], forbidPlte?: boolean): ArrayBuffer;
  decode(buffer: ArrayBuffer): { width: number; height: number; depth: number; ctype: number; data: ArrayBuffer };
  toRGBA8(img: { width: number; height: number; depth: number; ctype: number; data: ArrayBuffer }): ArrayBuffer[];
}

// Handle CJS double-wrapping: some environments put the module at .default
const UPNG: UPNGModule = (_UPNG as { default?: UPNGModule } & UPNGModule).default || _UPNG;

export default UPNG;
