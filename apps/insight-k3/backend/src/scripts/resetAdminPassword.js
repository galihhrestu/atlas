import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

function validatePassword(password) {
  const errors = [];

  if (password.length < 12) {
    errors.push("minimal 12 karakter");
  }

  if (password.length > 128) {
    errors.push("maksimal 128 karakter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("memiliki huruf kecil");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("memiliki huruf besar");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("memiliki angka");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("memiliki simbol");
  }

  if (errors.length > 0) {
    throw new Error(`Password harus ${errors.join(", ")}.`);
  }
}

async function main() {
  const readline = createInterface({
    input,
    output,
  });

  try {
    console.log("=== Reset Password Administrator INSIGHTK3 ===");
    console.log(
      "Catatan: password akan terlihat saat diketik di terminal."
    );

    const identifier = (
      await readline.question("Username atau email administrator: ")
    )
      .trim()
      .toLowerCase();

    const newPassword = await readline.question(
      "Masukkan password administrator baru: "
    );

    const confirmPassword = await readline.question(
      "Ketik ulang password administrator baru: "
    );

    if (newPassword !== confirmPassword) {
      throw new Error("Konfirmasi password tidak sama.");
    }

    validatePassword(newPassword);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            username: {
              equals: identifier,
              mode: "insensitive",
            },
          },
          {
            email: {
              equals: identifier,
              mode: "insensitive",
            },
          },
        ],
        role: "ADMIN",
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new Error("Akun administrator tidak ditemukan.");
    }

    const rounds = Number.parseInt(
      process.env.BCRYPT_ROUNDS || "12",
      10
    );

    if (!Number.isInteger(rounds) || rounds < 10 || rounds > 15) {
      throw new Error("Konfigurasi BCRYPT_ROUNDS tidak valid.");
    }

    const passwordHash = await bcrypt.hash(newPassword, rounds);

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash,
      },
      select: {
        username: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    await prisma.authSession.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    console.log("");
    console.log("Password administrator berhasil diperbarui:");
    console.log(JSON.stringify(updatedUser, null, 2));
    console.log("Semua session lama administrator telah dicabut.");
  } finally {
    readline.close();
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error("Reset password gagal:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });