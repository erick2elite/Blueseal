import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CarListing from './CarListing';

// Mock fetch to simulate an empty cars list
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
);

describe('Blue Seal Frontend App', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('renders the navbar with the BMM brand logo', async () => {
    render(<CarListing />);
    expect(await screen.findByAltText(/BLUESEAL MOTOR MANAGER'S LTD/i)).toBeInTheDocument();
  });

  it('renders the Cars and Admin Panel nav buttons', async () => {
    render(<CarListing />);
    await screen.findByAltText(/BLUESEAL MOTOR MANAGER'S LTD/i);
    expect(screen.getByRole('button', { name: /car listings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /admin/i })).toBeInTheDocument();
  });

  it('renders search input and filter toggle button', async () => {
    render(<CarListing />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search make, model or title…')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /search cars/i })).toBeInTheDocument();
    });
  });

  it('shows empty state message when no cars are available', async () => {
    render(<CarListing />);
    await waitFor(() => {
      expect(screen.getByText(/no cars match your filters/i)).toBeInTheDocument();
    });
  });

  it('calls the /api/cars endpoint on mount', async () => {
    render(<CarListing />);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/cars'));
    });
  });
});
