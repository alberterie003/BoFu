@echo off
echo ========================================
echo   Subiendo WhatsApp Integration a GitHub
echo ========================================
echo.

REM Ir al directorio del proyecto
cd /d "C:\Users\alber\Desktop\BoFu"

echo [1/3] Agregando archivos...
git add app/api/webhooks/twilio/route.ts
git add package.json  
git add  supabase/whatsapp_migration_simple.sql

echo [2/3] Haciendo commit...
git commit -m "Add WhatsApp Twilio webhook integration"

echo [3/3] Subiendo a GitHub...
git push origin main

echo.
echo ========================================
echo   COMPLETADO!
echo ========================================
echo.
echo Ahora Vercel hara auto-deploy.
echo Espera 2-3 minutos para que termine.
echo.
pause
