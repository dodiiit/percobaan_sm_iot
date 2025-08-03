import React from 'react';
import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResponsiveCard from '../../../components/ui/ResponsiveCard';

describe('ResponsiveCard', () => {
  const mockOnClick = vi.fn();
  
  beforeEach(() => {
    mockOnClick.mockClear();
  });
  
  test('renders title correctly', () => {
    render(<ResponsiveCard title="Test Title">Content</ResponsiveCard>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
  
  test('renders subtitle when provided', () => {
    render(
      <ResponsiveCard 
        title="Test Title" 
        subtitle="Test Subtitle"
      >
        Content
      </ResponsiveCard>
    );
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });
  
  test('renders children content', () => {
    render(
      <ResponsiveCard title="Test Title">
        <div data-testid="child-content">Child Content</div>
      </ResponsiveCard>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });
  
  test('renders footer when provided', () => {
    render(
      <ResponsiveCard 
        title="Test Title" 
        footer={<div data-testid="footer-content">Footer Content</div>}
      >
        Content
      </ResponsiveCard>
    );
    expect(screen.getByTestId('footer-content')).toBeInTheDocument();
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });
  
  test('calls onClick when clicked and onClick is provided', () => {
    render(
      <ResponsiveCard 
        title="Test Title" 
        onClick={mockOnClick}
      >
        Content
      </ResponsiveCard>
    );
    
    fireEvent.click(screen.getByText('Test Title'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
  
  test('applies custom className when provided', () => {
    const { container } = render(
      <ResponsiveCard 
        title="Test Title" 
        className="custom-class"
      >
        Content
      </ResponsiveCard>
    );
    
    const cardElement = container.firstChild;
    expect(cardElement).toHaveClass('custom-class');
  });
  
  test('renders icon when provided', () => {
    render(
      <ResponsiveCard 
        title="Test Title" 
        icon={<svg data-testid="test-icon" />}
      >
        Content
      </ResponsiveCard>
    );
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });
});