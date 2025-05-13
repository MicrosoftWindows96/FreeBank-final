
  
  
  (function() {
    try {
      localStorage.setItem('DEMO_WALLET_ADDRESS', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
      localStorage.setItem('DEMO_WALLET_PRIVATE_KEY', '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
      localStorage.setItem('DEMO_WALLET_INITIAL_BALANCE', '100000000.0');
      localStorage.setItem('DEMO_WALLET_IS_REGISTERED', 'true');
      console.log('Demo wallet info stored in localStorage');
    } catch (e) {
      console.error('Failed to store demo wallet info:', e);
    }
  })();
  