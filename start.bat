@echo off
echo Starting Inclusive Banking Platform...

echo.
echo === Starting Hardhat Local Node ===
start cmd /k "npx hardhat node"

timeout /t 5 /nobreak >nul

echo.
echo === Deploying Contracts to Local Node ===
start cmd /k "npx hardhat run scripts/deploy.js --network localhost"

timeout /t 3 /nobreak >nul

echo.
echo === Setting up Demo Account ===
start cmd /k "npx hardhat run scripts/setup-demo-account.js --network localhost"

timeout /t 3 /nobreak >nul

echo.
echo === Generating Demo Transactions ===
start cmd /k "npx hardhat run scripts/generate-demo-transactions.js --network localhost"

timeout /t 30 /nobreak >nul

echo === Demo Transactions Generated ===
echo Multiple transactions should now be available in the demo account.

echo.
echo === Starting React Frontend ===
start cmd /k "cd frontend && npm start"

echo.
echo All systems starting! 
echo - Hardhat node running on http://localhost:8545
echo - React frontend starting on http://localhost:3000
echo.
echo Remember to connect MetaMask to localhost:8545 and import one of the test accounts.
echo.
echo Demo account is available - click "Try Demo" on the login page.
echo. 