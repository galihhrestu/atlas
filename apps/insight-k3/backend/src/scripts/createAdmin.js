import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { validateEnvironment } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../utils/password.js";

function validatePassword(password) {
  const requirements = [
    {
      valid: password.length >= 12,
      message: "minimal 12 karakter"
    },
    {
      valid: /[a-z]/.test(password),
      message: "memiliki huruf kecil"
    },
    {
      valid: /[A-Z]/.test(password),
      message: "memiliki huruf besar"
    },
    {
      valid: /\d/.test(password),
      message: "memiliki angka"
    },
    {
      valid: /[^A-Za-z0-9]/.test(password),
      message: "memiliki simbol"
    }
  ];

  const missingRequirements = requirements
    .filter((requirement) => !requirement.valid)
    .map((requirement) => requirement.message);

  if (missingRequirements.length > 0) {
    throw new Error(
      `Password admin harus ${missingRequirements.join(", ")}.`
    );
  }
}

async function main() {
  validateEnvironment();

  const readline = createInterface({
    input,
    output
  });

  try {
    console.log("=== Pembuatan Administrator INSIGHTK3 ===");
    console.log(
      "Password akan terlihat saat diketik. Pastikan terminal tidak sedang dibagikan."
    );

    const username = (await readline.question("Username admin: "))
      .trim()
      .toLowerCase();
    const email = (await readline.question("Email admin: "))
      .trim()
      .toLowerCase();
    const fullName = (await readline.question("Nama lengkap: ")).trim();
    const department = (
      await readline.question("Departemen (boleh kosong): ")
    ).trim();
    const password = await readline.question("Password admin: ");

    if (!/^[a-z0-9._-]{3,100}$/.test(username)) {
      throw new Error(
        "Username hanya boleh berisi huruf kecil, angka, titik, garis bawah, atau tanda hubung; panjang 3-100 karakter."
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Format email admin tidak valid.");
    }

    if (!fullName) {
      throw new Error("Nama lengkap wajib diisi.");
    }

    validatePassword(password);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          {
            username: {
              equals: username,
              mode: "insensitive"
            }
          },
          {
            email: {
              equals: email,
              mode: "insensitive"
            }
          }
        ]
      },
      select: {
        id: true,
        username: true,
        email: true
      }
    });

    if (existingUser) {
      throw new Error(
        `Pengguna sudah ada: ${existingUser.username} / ${existingUser.email}`
      );
    }

    const passwordHash = await hashPassword(password);

    const admin = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        fullName,
        department: department || null,
        role: "ADMIN",
        status: "ACTIVE"
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        department: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    console.log("");
    console.log("Administrator berhasil dibuat:");
    console.log(JSON.stringify(admin, null, 2));
  } finally {
    readline.close();
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error("Pembuatan administrator gagal:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
