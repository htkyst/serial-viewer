import type { Format } from "./types";

export const toBytes = (input: string, format: Format): number[] => {
  if (format === "ascii") return Array.from(new TextEncoder().encode(input));

  const values = input.trim().split(/[\s,]+/).filter(Boolean);
  if (!values.length) return [];

  return values.map((value) => {
    const parsed = Number.parseInt(value.replace(/^0x/i, ""), format === "hex" ? 16 : 2);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 255) {
      throw new Error(`${format.toUpperCase()}の入力値が不正です: ${value}`);
    }
    return parsed;
  });
};

export const formatBytes = (data: number[], format: Format) => {
  if (format === "hex") return data.map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(" ");
  if (format === "bin") return data.map((byte) => byte.toString(2).padStart(8, "0")).join(" ");

  return new TextDecoder().decode(new Uint8Array(data)).replace(
    /[\x00-\x1F\x7F-\x9F]/g,
    (char) => `\\x${char.charCodeAt(0).toString(16).padStart(2, "0").toUpperCase()}`,
  );
};
