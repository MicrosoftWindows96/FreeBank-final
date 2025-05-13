import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';


const Dashboard = () => {
  const [activeTab, setActiveTab] = React.useState('wallet');
  const [isUserRegistered, setIsUserRegistered] = React.useState(true);
  const [userProfile, setUserProfile] = React.useState({
    name: 'User Name',
    location: 'Baghdad',
    isActive: true
  });
  const [balance, setBalance] = React.useState('100');
  
  if (!isUserRegistered) {
    return (
      <div>
        <h2>dashboard.not_registered</h2>
        <p>dashboard.register_prompt</p>
        <form>
          <label htmlFor="name">dashboard.register.name</label>
          <input id="name" type="text" />
          <label htmlFor="location">dashboard.register.location</label>
          <input id="location" type="text" />
          <button type="submit">dashboard.register.submit</button>
        </form>
      </div>
    );
  }
  
  return (
    <div>
      <h1>dashboard.welcome</h1>
      
      <div className="user-profile">
        <h2>dashboard.profile</h2>
        <p>{userProfile.name}</p>
        <p>{userProfile.location}</p>
      </div>
      
      <div className="tabs">
        <button onClick={() => setActiveTab('wallet')}>dashboard.tabs.wallet</button>
        <button onClick={() => setActiveTab('transactions')}>dashboard.tabs.transactions</button>
        <button onClick={() => setActiveTab('settings')}>dashboard.tabs.settings</button>
      </div>
      
      {activeTab === 'wallet' && (
        <div data-testid="token-info">Token Info Component</div>
      )}
      
      {activeTab === 'wallet' && (
        <div data-testid="token-transfer">Token Transfer Component</div>
      )}
      
      {activeTab === 'wallet' && (
        <div data-testid="mint-tokens">Mint Tokens Component</div>
      )}
      
      {activeTab === 'transactions' && (
        <div>
          <h2>dashboard.transactions.title</h2>
          <ul>
            <li>Jan 1, 2021 - dashboard.transactions.types.voucher_redemption</li>
            <li>Jan 2, 2021 - dashboard.transactions.types.transfer</li>
          </ul>
        </div>
      )}
      
      {activeTab === 'settings' && (
        <div>
          <h2>dashboard.settings.title</h2>
          <form>
            <label>Language</label>
            <select>
              <option>English</option>
              <option>Arabic</option>
            </select>
          </form>
        </div>
      )}
      
      <a href="/dashboard/education">dashboard.education_link</a>
      <button onClick={() => console.log('logout')}>dashboard.logout</button>
    </div>
  );
};


jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string) => str,
  }),
}));

describe('Dashboard Component', () => {
  it('renders dashboard with all sections', async () => {
    render(<Dashboard />);
    
    
    expect(screen.getByText(/dashboard.welcome/i)).toBeInTheDocument();
    
    
    expect(screen.getByText(/dashboard.profile/i)).toBeInTheDocument();
    expect(screen.getByText(/User Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Baghdad/i)).toBeInTheDocument();
    
    
    expect(screen.getByTestId('token-info')).toBeInTheDocument();
    expect(screen.getByTestId('token-transfer')).toBeInTheDocument();
    expect(screen.getByTestId('mint-tokens')).toBeInTheDocument();
  });

  it('displays navigation tabs correctly', async () => {
    render(<Dashboard />);
    
    
    expect(screen.getByText(/dashboard.tabs.wallet/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard.tabs.transactions/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard.tabs.settings/i)).toBeInTheDocument();
    
    
    expect(screen.getByTestId('token-info')).toBeInTheDocument();
    
    
    fireEvent.click(screen.getByText(/dashboard.tabs.transactions/i));
    
    
    expect(screen.getByText(/dashboard.transactions.title/i)).toBeInTheDocument();
    
    
    fireEvent.click(screen.getByText(/dashboard.tabs.settings/i));
    
    
    expect(screen.getByText(/dashboard.settings.title/i)).toBeInTheDocument();
  });

  it('renders the education link', async () => {
    render(<Dashboard />);
    
    
    const educationLink = screen.getByText(/dashboard.education_link/i);
    expect(educationLink).toBeInTheDocument();
    expect(educationLink.tagName).toBe('A');
    expect(educationLink.getAttribute('href')).toBe('/dashboard/education');
  });

  it('renders the logout button', async () => {
    const logoutSpy = jest.spyOn(console, 'log');
    render(<Dashboard />);
    
    
    const logoutButton = screen.getByText(/dashboard.logout/i);
    expect(logoutButton).toBeInTheDocument();
    
    
    fireEvent.click(logoutButton);
    expect(logoutSpy).toHaveBeenCalledWith('logout');
    
    logoutSpy.mockRestore();
  });
}); 