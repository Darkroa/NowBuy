import { randomBytes } from "node:crypto";

export function generateTrackingCode(): string {
  return "NB" + randomBytes(5).toString("hex").toUpperCase();
}
