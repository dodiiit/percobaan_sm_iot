import { renderHook, act } from '@testing-library/react-hooks';
import { useResponsive } from '../../hooks/useResponsive';

// Mock window dimensions
const mockWindowDimensions = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });
  window.dispatchEvent(new Event('resize'));
};

describe('useResponsive', () => {
  beforeEach(() => {
    // Reset window dimensions to desktop size
    mockWindowDimensions(1280, 800);
  });

  test('returns correct breakpoint for mobile size', () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      mockWindowDimensions(320, 568); // iPhone SE size
    });
    
    expect(result.current.breakpoint).toBe('xs');
    expect(result.current.isXs).toBe(true);
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  test('returns correct breakpoint for tablet size', () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      mockWindowDimensions(768, 1024); // iPad size
    });
    
    expect(result.current.breakpoint).toBe('md');
    expect(result.current.isMd).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  test('returns correct breakpoint for desktop size', () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      mockWindowDimensions(1440, 900); // Desktop size
    });
    
    expect(result.current.breakpoint).toBe('xl');
    expect(result.current.isXl).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
  });

  test('down() function works correctly', () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      mockWindowDimensions(800, 600); // Between md and lg
    });
    
    expect(result.current.down('lg')).toBe(true);
    expect(result.current.down('md')).toBe(false);
    expect(result.current.down('sm')).toBe(false);
  });

  test('up() function works correctly', () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      mockWindowDimensions(800, 600); // Between md and lg
    });
    
    expect(result.current.up('md')).toBe(true);
    expect(result.current.up('lg')).toBe(false);
    expect(result.current.up('sm')).toBe(true);
  });

  test('between() function works correctly', () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      mockWindowDimensions(800, 600); // Between md and lg
    });
    
    expect(result.current.between('md', 'lg')).toBe(true);
    expect(result.current.between('sm', 'md')).toBe(false);
    expect(result.current.between('lg', 'xl')).toBe(false);
  });

  test('only() function works correctly', () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      mockWindowDimensions(800, 600); // Between md and lg
    });
    
    expect(result.current.only('md')).toBe(true);
    expect(result.current.only('sm')).toBe(false);
    expect(result.current.only('lg')).toBe(false);
  });
});