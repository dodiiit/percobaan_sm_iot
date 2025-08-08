import { useEffect, useRef, useState, KeyboardEvent as ReactKeyboardEvent } from 'react';

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
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

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

    container.addEventListener('keydown', handleKeyDown);
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
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

  const handleKeyDown = (e: ReactKeyboardEvent) => {
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
 * @returns Function to announce messages and announcement data
 */
export const useAnnounce = () => {
  const [politeAnnouncements, setPoliteAnnouncements] = useState<string[]>([]);
  const [assertiveAnnouncements, setAssertiveAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (politeAnnouncements.length > 0) {
        setPoliteAnnouncements([]);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [politeAnnouncements]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (assertiveAnnouncements.length > 0) {
        setAssertiveAnnouncements([]);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [assertiveAnnouncements]);

  const announce = (message: string, assertive: boolean = false) => {
    if (assertive) {
      setAssertiveAnnouncements((prev) => [...prev, message]);
    } else {
      setPoliteAnnouncements((prev) => [...prev, message]);
    }
  };

  return {
    announce,
    politeAnnouncements,
    assertiveAnnouncements,
    // Return the announcement data instead of a JSX component
    politeAnnouncementText: politeAnnouncements.join(' '),
    assertiveAnnouncementText: assertiveAnnouncements.join(' ')
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

    // Use the modern API if available, fallback to the deprecated one
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
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

    // Use the modern API if available, fallback to the deprecated one
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
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
 * @param options Optional configuration for additional attributes
 * @returns Object with aria attributes
 */
export const createAriaAttributes = (
  id: string,
  options?: {
    hasControls?: boolean;
    hasOwns?: boolean;
    hasDetails?: boolean;
    hasErrorMessage?: boolean;
  }
) => {
  const attributes: Record<string, string> = {
    labelledby: `${id}-label`,
    describedby: `${id}-description`,
  };

  if (options?.hasControls) {
    attributes.controls = `${id}-controls`;
  }

  if (options?.hasOwns) {
    attributes.owns = `${id}-owned`;
  }

  // Create an array to collect all describedby IDs
  const describedbyIds = [attributes.describedby];
  
  if (options?.hasDetails) {
    describedbyIds.push(`${id}-details`);
  }

  if (options?.hasErrorMessage) {
    describedbyIds.push(`${id}-error`);
  }
  
  // Join all IDs with spaces and trim any extra spaces
  attributes.describedby = describedbyIds.join(' ').trim();

  return attributes;
};

/**
 * Helper function to handle keyboard events for interactive elements
 * @param event Keyboard event
 * @param actions Object with callback functions for different key actions
 */
export const handleKeyboardEvent = (
  event: ReactKeyboardEvent,
  actions: {
    enter?: () => void;
    space?: () => void;
    escape?: () => void;
    arrowUp?: () => void;
    arrowDown?: () => void;
    arrowLeft?: () => void;
    arrowRight?: () => void;
    tab?: () => void;
    shiftTab?: () => void;
    home?: () => void;
    end?: () => void;
  }
) => {
  switch (event.key) {
    case 'Enter':
      if (actions.enter) {
        event.preventDefault();
        actions.enter();
      }
      break;
    case ' ':
      if (actions.space) {
        event.preventDefault();
        actions.space();
      }
      break;
    case 'Escape':
      if (actions.escape) {
        event.preventDefault();
        actions.escape();
      }
      break;
    case 'ArrowUp':
      if (actions.arrowUp) {
        event.preventDefault();
        actions.arrowUp();
      }
      break;
    case 'ArrowDown':
      if (actions.arrowDown) {
        event.preventDefault();
        actions.arrowDown();
      }
      break;
    case 'ArrowLeft':
      if (actions.arrowLeft) {
        event.preventDefault();
        actions.arrowLeft();
      }
      break;
    case 'ArrowRight':
      if (actions.arrowRight) {
        event.preventDefault();
        actions.arrowRight();
      }
      break;
    case 'Tab':
      if (event.shiftKey && actions.shiftTab) {
        actions.shiftTab();
      } else if (actions.tab) {
        actions.tab();
      }
      break;
    case 'Home':
      if (actions.home) {
        event.preventDefault();
        actions.home();
      }
      break;
    case 'End':
      if (actions.end) {
        event.preventDefault();
        actions.end();
      }
      break;
    default:
      break;
  }
};

/**
 * Helper function to create ARIA live region attributes
 * @param politeness The politeness level of the live region
 * @param atomic Whether the entire region should be presented as a whole
 * @param relevant What types of changes are relevant
 * @returns Object with ARIA live region attributes
 */
export const createLiveRegionAttributes = (
  politeness: 'off' | 'polite' | 'assertive' = 'polite',
  atomic: boolean = false,
  relevant: 'additions' | 'removals' | 'text' | 'all' = 'additions'
) => {
  return {
    'aria-live': politeness,
    'aria-atomic': atomic.toString(),
    'aria-relevant': relevant
  };
};