import React, { useState, ChangeEvent, FormEvent } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

interface FormData {
  name: string;
  email: string;
  amount: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  amount?: string;
}

interface ErrorHandlingFormProps {
  onSubmit?: (data: FormData) => void;
  apiErrors?: string | null;
}


const ErrorHandlingForm = ({ 
  onSubmit = jest.fn(),
  apiErrors = null
}: ErrorHandlingFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    amount: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const clearForm = () => {
    setFormData({
      name: '',
      email: '',
      amount: ''
    });
    setErrors({});
  };

  return (
    <div>
      <form onSubmit={handleSubmit} data-testid="error-form">
        {apiErrors && (
          <div data-testid="api-error" className="error">
            {apiErrors}
          </div>
        )}
        
        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            data-testid="name-input"
          />
          {errors.name && <div data-testid="name-error" className="error">{errors.name}</div>}
        </div>
        
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="text"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            data-testid="email-input"
          />
          {errors.email && <div data-testid="email-error" className="error">{errors.email}</div>}
        </div>
        
        <div>
          <label htmlFor="amount">Amount:</label>
          <input
            type="text"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            data-testid="amount-input"
          />
          {errors.amount && <div data-testid="amount-error" className="error">{errors.amount}</div>}
        </div>
        
        <button type="submit" data-testid="submit-button">Submit</button>
        <button type="button" onClick={clearForm} data-testid="clear-button">Clear</button>
      </form>
    </div>
  );
};

describe('Error Handling Tests', () => {
  test('displays form without errors initially', () => {
    render(<ErrorHandlingForm />);
    expect(screen.queryByTestId('name-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('amount-error')).not.toBeInTheDocument();
  });

  test('shows name error when submitting with empty name', async () => {
    render(<ErrorHandlingForm />);
    
    fireEvent.click(screen.getByTestId('submit-button'));
    
    expect(screen.getByTestId('name-error')).toBeInTheDocument();
    expect(screen.getByTestId('name-error')).toHaveTextContent('Name is required');
  });

  test('shows email format error when submitting with invalid email', async () => {
    render(<ErrorHandlingForm />);
    
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'invalid-email' } });
    fireEvent.click(screen.getByTestId('submit-button'));
    
    expect(screen.getByTestId('email-error')).toBeInTheDocument();
    expect(screen.getByTestId('email-error')).toHaveTextContent('Email is invalid');
  });

  test('shows amount error when submitting with non-numeric amount', async () => {
    render(<ErrorHandlingForm />);
    
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByTestId('submit-button'));
    
    expect(screen.getByTestId('amount-error')).toBeInTheDocument();
    expect(screen.getByTestId('amount-error')).toHaveTextContent('Amount must be a positive number');
  });

  test('clears all form fields when clear button is clicked', async () => {
    render(<ErrorHandlingForm />);
    
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '100' } });
    
    fireEvent.click(screen.getByTestId('clear-button'));
    
    expect(screen.getByTestId('name-input')).toHaveValue('');
    expect(screen.getByTestId('email-input')).toHaveValue('');
    expect(screen.getByTestId('amount-input')).toHaveValue('');
  });

  test('does not call onSubmit when form has validation errors', () => {
    const mockSubmit = jest.fn();
    render(<ErrorHandlingForm onSubmit={mockSubmit} />);
    
    fireEvent.click(screen.getByTestId('submit-button'));
    
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  test('calls onSubmit with form data when form is valid', () => {
    const mockSubmit = jest.fn();
    render(<ErrorHandlingForm onSubmit={mockSubmit} />);
    
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '100' } });
    
    fireEvent.click(screen.getByTestId('submit-button'));
    
    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockSubmit).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      amount: '100'
    });
  });

  test('displays API error when provided', () => {
    const apiError = 'Server connection failed. Please try again later.';
    render(<ErrorHandlingForm apiErrors={apiError} />);
    
    expect(screen.getByTestId('api-error')).toBeInTheDocument();
    expect(screen.getByTestId('api-error')).toHaveTextContent(apiError);
  });
}); 