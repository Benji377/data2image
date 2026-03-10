declare module "upng-js" {
  interface Image {
    width: number;
    height: number;
    depth: number;
    ctype: number;
    data: ArrayBuffer;
    tabs: Record<string, unknown>;
    frames: Array<{
      rect: { x: number; y: number; width: number; height: number };
      delay: number;
      dispose: number;
      blend: number;
    }>;
  }

  export function encode(
    imgs: ArrayBuffer[],
    w: number,
    h: number,
    cnum: number,
    dels?: number[],
    forbidPlte?: boolean
  ): ArrayBuffer;

  export function encodeLL(
    imgs: ArrayBuffer[],
    w: number,
    h: number,
    cc: number,
    ac: number,
    depth: number,
    dels?: number[],
    forbidPlte?: boolean
  ): ArrayBuffer;

  export function decode(buffer: ArrayBuffer): Image;
  export function toRGBA8(img: Image): ArrayBuffer[];
}
