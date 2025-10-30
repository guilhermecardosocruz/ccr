import { randomBytes, createHash } from "crypto";

/**
 * Gera o hash SHA-256 em HEX de uma string.
 * Uso: sha256Hex("123456") -> "8d969eef6ecad3c29a3a629280e686cff8..."
 */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Versão básica (mantida por compatibilidade, caso alguém já importe 'sha256').
 * Retorna o Buffer do hash; prefira sha256Hex para comparar/armazenar.
 */
export function sha256(input: string): Buffer {
  return createHash("sha256").update(input, "utf8").digest();
}

/** Alfabeto para PIN alfanumérico (A-Z e 0-9 sem caracteres ambíguos) */
const ALPHA_NUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** Alfabeto numérico */
const NUM = "0123456789";

/**
 * PIN numérico com tamanho fixo (ex.: 6 -> "493027")
 */
export function genNumeric(len = 6): string {
  if (len <= 0) return "";
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += NUM[bytes[i] % NUM.length];
  }
  return out;
}

/**
 * PIN alfanumérico com tamanho fixo (ex.: 8 -> "AP7G2K9M")
 */
export function genAlphaNum(len = 8): string {
  if (len <= 0) return "";
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHA_NUM[bytes[i] % ALPHA_NUM.length];
  }
  return out;
}

/**
 * Compare hash em HEX (tempo constante aproximado).
 */
export function equalsHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  // comparação de tempo constante aproximada
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
