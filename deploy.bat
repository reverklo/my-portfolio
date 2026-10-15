@echo off
chcp 65001 >nul
echo ===================================================
echo   🚀 กำลังอัปเดต Portfolio ขึ้น GitHub & Cloudflare...
echo ===================================================

git add .
git commit -m "Update portfolio: %date% %time%"
git push origin main

echo.
echo ===================================================
echo   ✅ อัปเดตสำเร็จ! Cloudflare กำลังปล่อยเว็บใหม่ให้อัตโนมัติใน ~15 วินาที
echo ===================================================
pause
