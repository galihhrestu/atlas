import bcrypt from "bcryptjs";
import { getAuthConfig } from "../config/env.js";

export async function hashPassword(plainPassword) {
  const { bcryptRounds } = getAuthConfig();
  return bcrypt.hash(plainPassword, bcryptRounds);
}

export async function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}
