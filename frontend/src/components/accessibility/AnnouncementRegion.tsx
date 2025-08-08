import React from 'react';

interface AnnouncementRegionProps {
  politeText?: string;
  assertiveText?: string;
}

/**
 * AnnouncementRegion component for screen readers
 * 
 * This component creates ARIA live regions that announce messages to screen readers.
 * It provides both polite and assertive announcement regions.
 * 
 * @param politeText - Text to announce in the polite region
 * @param assertiveText - Text to announce in the assertive region
 */
const AnnouncementRegion: React.FC<AnnouncementRegionProps> = ({
  politeText = '',
  assertiveText = '',
}) => {
  return (
    <>
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {politeText}
      </div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      >
        {assertiveText}
      </div>
    </>
  );
};

export default AnnouncementRegion;