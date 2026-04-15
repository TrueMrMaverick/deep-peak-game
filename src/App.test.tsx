import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders game order panel', () => {
  render(<App />);
  expect(screen.getByText(/Заказ #/i)).toBeInTheDocument();
});
