import { useEffect, useRef, useState, KeyboardEvent } from 'react';

/**
 * Hook to manage focus trap within a container
 * @param active Whether the focus trap is active
 * @returns Ref to attach to the container element
 */
export const useFocusTrap = (active: boolean = true) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown as any);
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown as any);
    };
  }, [active]);

  return containerRef;
};

/**
 * Hook to manage keyboard navigation for interactive elements
 * @param itemCount Number of items to navigate through
 * @param onSelect Callback when an item is selected
 * @returns Object with current index and key handler
 */
export const useKeyboardNavigation = (
  itemCount: number,
  onSelect?: (index: number) => void
) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        setCurrentIndex((prevIndex) => (prevIndex + 1) % itemCount);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        setCurrentIndex((prevIndex) => (prevIndex - 1 + itemCount) % itemCount);
        break;
      case 'Home':
        e.preventDefault();
        setCurrentIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setCurrentIndex(itemCount - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect?.(currentIndex);
        break;
      default:
        break;
    }
  };

  return { currentIndex, handleKeyDown };
};

/**
 * Hook to announce messages to screen readers
 * @returns Function to announce messages
 */
export const useAnnounce = () => {
  const [announcements, setAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (announcements.length > 0) {
        setAnnouncements([]);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [announcements]);

  const announce = (message: string, assertive: boolean = false) => {
    setAnnouncements((prev) => [...prev, message]);
  };

  return {
    announce,
    announcements,
    AnnouncementRegion: () => (
      <>
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          role="status"
        >
          {announcements.filter((_, i) => i % 2 === 0).join(' ')}
        </div>
        <div
          aria-live="assertive"
          aria-atomic="true"
          className="sr-only"
          role="alert"
        >
          {announcements.filter((_, i) => i % 2 === 1).join(' ')}
        </div>
      </>
    ),
  };
};

/**
 * Hook to detect high contrast mode
 * @returns Boolean indicating if high contrast mode is enabled
 */
export const useHighContrastMode = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(forced-colors: active)');
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isHighContrast;
};

/**
 * Hook to detect reduced motion preference
 * @returns Boolean indicating if reduced motion is preferred
 */
export const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

/**
 * Skip to content link component props
 */
export interface SkipToContentProps {
  contentId: string;
  className?: string;
}

/**
 * Function to create aria attributes for elements
 * @param id Base ID for the element
 * @returns Object with aria attributes
 */
export const createAriaAttributes = (id: string) => {
  return {
    labelledby: `${id}-label`,
    describedby: `${id}-description`,
  };
};