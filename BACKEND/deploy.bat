@echo off
echo Deploying Blue Seal Motor Managers (BMM) Backend to Vercel...
echo.
echo Step 1: Login to Vercel (if not already logged in)
call npx vercel login
echo.
echo Step 2: Deploy to production
call npx vercel --prod
echo.
echo Deployment complete! 
echo Don't forget to add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel dashboard.
pause
