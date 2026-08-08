@echo off
setlocal
cd /d "%~dp0"

if not exist .env (
  copy .env.example .env >nul
  echo File .env dibuat dari .env.example.
  echo Silakan isi DATABASE_URL di server\.env sebelum melanjutkan migrasi.
) else (
  echo File .env sudah tersedia.
)

echo.
echo Menginstal dependency backend...
call npm install
if errorlevel 1 goto :error

echo.
echo Membuat Prisma Client...
call npm run db:generate
if errorlevel 1 goto :error

echo.
echo Setup dasar selesai.
echo Langkah berikutnya: isi DATABASE_URL, lalu jalankan npm run db:deploy.
pause
exit /b 0

:error
echo.
echo Setup gagal. Kirim screenshot error kepada asisten.
pause
exit /b 1
