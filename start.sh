#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$SCRIPT_DIR"

echo "Starting Inclusive Banking Platform..."

echo
echo "=== Installing Project Dependencies ==="
npm install

echo
echo "=== Installing Frontend Dependencies ==="
(cd frontend && npm install --legacy-peer-deps)

echo
echo "=== Starting Hardhat Local Node ==="
osascript -e "tell app \"Terminal\" to do script \"cd '$SCRIPT_DIR' && npx hardhat node\""

sleep 5

echo
echo "=== Deploying Contracts to Local Node ==="
osascript -e "tell app \"Terminal\" to do script \"cd '$SCRIPT_DIR' && npx hardhat run scripts/deploy.js --network localhost\""

sleep 3

echo
echo "=== Setting up Demo Account ==="
osascript -e "tell app \"Terminal\" to do script \"cd '$SCRIPT_DIR' && npx hardhat run scripts/setup-demo-account.js --network localhost\""

sleep 3

echo
echo "=== Generating Demo Transactions ==="
osascript -e "tell app \"Terminal\" to do script \"cd '$SCRIPT_DIR' && npx hardhat run scripts/generate-demo-transactions.js --network localhost\""

sleep 30

echo "=== Demo Transactions Generated ==="
echo "Multiple transactions should now be available in the demo account."

echo
echo "=== Starting React Frontend ==="
osascript -e "tell app \"Terminal\" to do script \"cd '$SCRIPT_DIR/frontend' && npm start\""

echo
echo "All systems starting!"
echo "- Hardhat node running on http://localhost:8545"
echo "- React frontend starting on http://localhost:3000"
echo
echo "Remember to connect MetaMask to localhost:8545 and import one of the test accounts."
echo 