import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export type CurrencyDisplayType = 'token' | 'fiat' | 'both';

interface CurrencyDisplayContextType {
  currencyDisplay: CurrencyDisplayType;
  setCurrencyDisplay: (display: CurrencyDisplayType) => void;
  formatCurrency: (amount: string | number, isToken?: boolean) => string;
}

const CurrencyDisplayContext = createContext<CurrencyDisplayContextType | undefined>(undefined);

export const CurrencyDisplayProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currencyDisplay, setCurrencyDisplay] = useState<CurrencyDisplayType>(() => {
    const savedDisplay = localStorage.getItem('currencyDisplay');
    if (savedDisplay === 'token' || savedDisplay === 'fiat' || savedDisplay === 'both') {
      return savedDisplay;
    }
    return 'both';
  });

  useEffect(() => {
    
    localStorage.setItem('currencyDisplay', currencyDisplay);
  }, [currencyDisplay]);

  
  const formatCurrency = (amount: string | number, isToken = true): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    
    const tokenFormatted = `${numAmount.toFixed(2)} IBT`;
    
    
    const fiatValue = numAmount; 
    const fiatFormatted = `${Math.round(fiatValue).toLocaleString()} IQD`;
    
    
    if (currencyDisplay === 'token') {
      return tokenFormatted;
    } else if (currencyDisplay === 'fiat') {
      return fiatFormatted;
    } else {
      
      if (isToken) {
        return `${tokenFormatted} (${fiatFormatted})`;
      } else {
        return `${fiatFormatted} (${tokenFormatted})`;
      }
    }
  };

  const value = {
    currencyDisplay,
    setCurrencyDisplay,
    formatCurrency
  };

  return (
    <CurrencyDisplayContext.Provider value={value}>
      {children}
    </CurrencyDisplayContext.Provider>
  );
};

export const useCurrencyDisplay = (): CurrencyDisplayContextType => {
  const context = useContext(CurrencyDisplayContext);
  if (context === undefined) {
    throw new Error('useCurrencyDisplay must be used within a CurrencyDisplayProvider');
  }
  return context;
}; 