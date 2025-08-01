import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ResponsiveTable from '../../../components/ui/ResponsiveTable';

// Mock the useResponsive hook
jest.mock('../../../hooks/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true
  })
}));

describe('ResponsiveTable', () => {
  // Sample data for testing
  const testData = [
    { id: '1', name: 'Item 1', value: 100 },
    { id: '2', name: 'Item 2', value: 200 },
    { id: '3', name: 'Item 3', value: 300 }
  ];
  
  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Name', accessor: 'name' },
    { header: 'Value', accessor: 'value' }
  ];
  
  const mockOnRowClick = jest.fn();
  
  beforeEach(() => {
    mockOnRowClick.mockClear();
  });
  
  test('renders table headers correctly', () => {
    render(
      <ResponsiveTable
        data={testData}
        columns={columns}
        keyExtractor={(item) => item.id}
      />
    );
    
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });
  
  test('renders table rows correctly', () => {
    render(
      <ResponsiveTable
        data={testData}
        columns={columns}
        keyExtractor={(item) => item.id}
      />
    );
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
  });
  
  test('calls onRowClick when a row is clicked', () => {
    render(
      <ResponsiveTable
        data={testData}
        columns={columns}
        keyExtractor={(item) => item.id}
        onRowClick={mockOnRowClick}
      />
    );
    
    fireEvent.click(screen.getByText('Item 1'));
    expect(mockOnRowClick).toHaveBeenCalledTimes(1);
    expect(mockOnRowClick).toHaveBeenCalledWith(testData[0]);
  });
  
  test('renders loading state correctly', () => {
    render(
      <ResponsiveTable
        data={testData}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={true}
      />
    );
    
    // Check that the loading spinner is rendered
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toBeInTheDocument();
    
    // Check that the table content is not rendered
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });
  
  test('renders empty state correctly', () => {
    render(
      <ResponsiveTable
        data={[]}
        columns={columns}
        keyExtractor={(item) => item.id}
        emptyMessage="No items found"
      />
    );
    
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });
  
  test('renders custom accessor functions correctly', () => {
    const customColumns = [
      { header: 'ID', accessor: 'id' },
      { header: 'Name', accessor: 'name' },
      { 
        header: 'Custom Value', 
        accessor: (item: typeof testData[0]) => (
          <span data-testid={`custom-value-${item.id}`}>
            Value: {item.value}
          </span>
        )
      }
    ];
    
    render(
      <ResponsiveTable
        data={testData}
        columns={customColumns}
        keyExtractor={(item) => item.id}
      />
    );
    
    expect(screen.getByTestId('custom-value-1')).toBeInTheDocument();
    expect(screen.getByTestId('custom-value-2')).toBeInTheDocument();
    expect(screen.getByTestId('custom-value-3')).toBeInTheDocument();
  });
});