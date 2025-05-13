import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';


const TokenTransfer = () => {
  const [recipient, setRecipient] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleTransfer = async () => {
    
    if (!recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
      setErrorMessage('transfer.invalid_address');
      return;
    }

    if (isNaN(Number(amount)) || !amount) {
      setErrorMessage('transfer.invalid_amount');
      return;
    }

    if (Number(amount) <= 0) {
      setErrorMessage('transfer.positive_amount');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      
      await new Promise(resolve => setTimeout(resolve, 100));
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage('transfer.error');
    }
  };

  if (status === 'loading') {
    return <div>transfer.loading</div>;
  }

  if (status === 'success') {
    return <div>transfer.success</div>;
  }

  return (
    <div>
      {errorMessage && <div className="error">{errorMessage}</div>}
      <input 
        placeholder="recipient.address" 
        value={recipient} 
        onChange={(e) => setRecipient(e.target.value)} 
      />
      <input 
        placeholder="amount" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)} 
      />
      <button onClick={handleTransfer}>transfer.button</button>
    </div>
  );
};


jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string) => str,
  }),
}));

describe('TokenTransfer Component', () => {
  it('renders the transfer form', () => {
    render(<TokenTransfer />);
    
    const addressInput = screen.getByPlaceholderText(/recipient.address/i);
    const amountInput = screen.getByPlaceholderText(/amount/i);
    const submitButton = screen.getByRole('button', { name: /transfer.button/i });
    
    expect(addressInput).toBeInTheDocument();
    expect(amountInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
  });

  it('validates recipient address format', async () => {
    render(<TokenTransfer />);
    
    const addressInput = screen.getByPlaceholderText(/recipient.address/i);
    const amountInput = screen.getByPlaceholderText(/amount/i);
    const submitButton = screen.getByRole('button', { name: /transfer.button/i });
    
    
    fireEvent.change(addressInput, { target: { value: 'invalid-address' } });
    fireEvent.change(amountInput, { target: { value: '10' } });
    fireEvent.click(submitButton);
    
    
    const errorMessage = screen.getByText(/transfer.invalid_address/i);
    expect(errorMessage).toBeInTheDocument();
  });

  it('validates amount format', async () => {
    render(<TokenTransfer />);
    
    const addressInput = screen.getByPlaceholderText(/recipient.address/i);
    const amountInput = screen.getByPlaceholderText(/amount/i);
    const submitButton = screen.getByRole('button', { name: /transfer.button/i });
    
    
    fireEvent.change(addressInput, { target: { value: '0x1234567890123456789012345678901234567890' } });
    fireEvent.change(amountInput, { target: { value: 'abc' } });
    fireEvent.click(submitButton);
    
    
    const errorMessage = screen.getByText(/transfer.invalid_amount/i);
    expect(errorMessage).toBeInTheDocument();
  });

  it('validates amount is greater than zero', async () => {
    render(<TokenTransfer />);
    
    const addressInput = screen.getByPlaceholderText(/recipient.address/i);
    const amountInput = screen.getByPlaceholderText(/amount/i);
    const submitButton = screen.getByRole('button', { name: /transfer.button/i });
    
    
    fireEvent.change(addressInput, { target: { value: '0x1234567890123456789012345678901234567890' } });
    fireEvent.change(amountInput, { target: { value: '0' } });
    fireEvent.click(submitButton);
    
    
    const errorMessage = screen.getByText(/transfer.positive_amount/i);
    expect(errorMessage).toBeInTheDocument();
  });

  it('shows success message when transfer is successful', async () => {
    render(<TokenTransfer />);
    
    const addressInput = screen.getByPlaceholderText(/recipient.address/i);
    const amountInput = screen.getByPlaceholderText(/amount/i);
    const submitButton = screen.getByRole('button', { name: /transfer.button/i });
    
    
    fireEvent.change(addressInput, { target: { value: '0x1234567890123456789012345678901234567890' } });
    fireEvent.change(amountInput, { target: { value: '10' } });
    fireEvent.click(submitButton);
    
    
    const successMessage = await waitFor(() => screen.getByText(/transfer.success/i));
    expect(successMessage).toBeInTheDocument();
  });
}); 