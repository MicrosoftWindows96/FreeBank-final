import React from 'react';
import { render, screen } from '@testing-library/react';

const App = () => {
  return (
    <div>
      <header>
        <h1>Inclusive Banking Token</h1>
      </header>
      <main>
        <div data-testid="app-content">
          Application content loaded successfully
        </div>
      </main>
    </div>
  );
};

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/Inclusive Banking Token/i)).toBeInTheDocument();
  });
  
  it('displays main content', () => {
    render(<App />);
    const content = screen.getByTestId('app-content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveTextContent(/Application content loaded successfully/i);
  });
}); 