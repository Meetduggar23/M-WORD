import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import App from '../App';

afterEach(cleanup);

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getAllByAltText('WORD logo').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Open file menu' })).toBeInTheDocument();
  });

  it('shows the start page with templates before any document is open', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /Blank Document/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Recent Documents/i })).toBeInTheDocument();
  });

  it('enters the editor workspace after creating a document', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Blank Document/i }));

    // Ribbon tabs are present once a document exists
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Insert')).toBeInTheDocument();
    expect(screen.getByText('Layout')).toBeInTheDocument();

    // Status bar reports the fresh document
    expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument();
    expect(screen.getByText(/0 words/)).toBeInTheDocument();

    // Tabs strip shows the new document
    expect(screen.getByRole('tab', { name: /Blank Document/i })).toBeInTheDocument();
  });
});
