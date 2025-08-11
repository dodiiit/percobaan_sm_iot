import React from 'react';

interface SkipToContentProps {
  contentId: string;
  label?: string;
  className?: string;
}

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
    >
      {label}
    </a>
  );
};

export default SkipToContent;