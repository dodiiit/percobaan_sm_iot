import React from 'react';

interface SkipToContentProps {
  contentId: string;
  label?: string;
  className?: string;
}

/**
 * SkipToContent component
 * 
 * This component creates a skip link that allows keyboard users to bypass navigation
 * and jump directly to the main content of the page. It's a critical accessibility
 * feature for keyboard and screen reader users.
 * 
 * @param contentId - The ID of the main content element to skip to
 * @param label - The text for the skip link
 * @param className - Additional CSS classes
 */
const SkipToContent: React.FC<SkipToContentProps> = ({
  contentId,
  label = 'Skip to content',
  className = '',
}) => {
  return (
    <a
      href={`#${contentId}`}
      className={`skip-to-content ${className}`}
      data-testid="skip-to-content"
      tabIndex={0}
      aria-label={label}
    >
      {label}
    </a>
  );
};

export default SkipToContent;