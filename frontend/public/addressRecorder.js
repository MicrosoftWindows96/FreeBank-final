
  
  
  (function() {
    try {
      localStorage.setItem('IBT_TOKEN_ADDRESS', '0x5FbDB2315678afecb367f032d93F642f64180aa3');
      localStorage.setItem('IBT_BANKING_ADDRESS', '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512');
      localStorage.setItem('IBT_DEPLOYMENT_DATE', '2025-05-11T18:19:10.676Z');
      console.log('Contract addresses recorded in localStorage');
    } catch (e) {
      console.error('Failed to record contract addresses:', e);
    }
  })();
  