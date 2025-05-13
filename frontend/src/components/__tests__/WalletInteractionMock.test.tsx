import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';


const WalletInteraction = ({ 
  isConnected = false,
  connect = jest.fn(),
  disconnect = jest.fn(),
  address = '0x0',
  balance = '0',
  network = 'Unknown'
}) => {
  return (
    <div>
      <h2>Wallet Status</h2>
      <div data-testid="connection-status">
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      <div data-testid="wallet-address">{address}</div>
      <div data-testid="wallet-balance">{balance}</div>
      <div data-testid="network-name">{network}</div>
      
      {!isConnected ? (
        <button onClick={connect} data-testid="connect-button">
          Connect Wallet
        </button>
      ) : (
        <button onClick={disconnect} data-testid="disconnect-button">
          Disconnect
        </button>
      )}
      
      {isConnected && (
        <div>
          <button data-testid="refresh-balance">Refresh Balance</button>
          <button data-testid="switch-network">Switch Network</button>
        </div>
      )}
    </div>
  );
};

describe('Wallet Interaction Tests', () => {
  test('displays disconnected state initially', () => {
    render(<WalletInteraction />);
    expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected');
    expect(screen.getByTestId('connect-button')).toBeInTheDocument();
  });

  test('shows connect button when disconnected', () => {
    render(<WalletInteraction />);
    expect(screen.getByTestId('connect-button')).toBeInTheDocument();
    expect(screen.queryByTestId('disconnect-button')).not.toBeInTheDocument();
  });

  test('triggers connect function when connect button is clicked', () => {
    const mockConnect = jest.fn();
    render(<WalletInteraction connect={mockConnect} />);
    
    fireEvent.click(screen.getByTestId('connect-button'));
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  test('displays connected state with wallet address', () => {
    const testAddress = '0x1234567890abcdef';
    render(<WalletInteraction isConnected={true} address={testAddress} />);
    
    expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
    expect(screen.getByTestId('wallet-address')).toHaveTextContent(testAddress);
  });

  test('shows disconnect button when connected', () => {
    render(<WalletInteraction isConnected={true} />);
    
    expect(screen.queryByTestId('connect-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('disconnect-button')).toBeInTheDocument();
  });

  test('triggers disconnect function when disconnect button is clicked', () => {
    const mockDisconnect = jest.fn();
    render(<WalletInteraction isConnected={true} disconnect={mockDisconnect} />);
    
    fireEvent.click(screen.getByTestId('disconnect-button'));
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  test('displays wallet balance correctly', () => {
    const testBalance = '100.5 IBT';
    render(<WalletInteraction isConnected={true} balance={testBalance} />);
    
    expect(screen.getByTestId('wallet-balance')).toHaveTextContent(testBalance);
  });

  test('displays network name correctly', () => {
    const testNetwork = 'Ethereum Mainnet';
    render(<WalletInteraction isConnected={true} network={testNetwork} />);
    
    expect(screen.getByTestId('network-name')).toHaveTextContent(testNetwork);
  });
}); 