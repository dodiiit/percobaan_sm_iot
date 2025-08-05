import React, { useEffect, useState } from 'react';

interface AnnouncerProps {
  message?: string;
  assertive?: boolean;
  clearDelay?: number;
}

/**
 * Announcer component for screen readers
 * 
 * This component creates an ARIA live region that announces messages to screen readers.
 * It's useful for dynamic content changes, form submissions, and other events that
 * should be announced to screen reader users.
 * 
 * @param message - The message to announce
 * @param assertive - Whether to use an assertive (true) or polite (false) live region
 * @param clearDelay - Time in milliseconds after which the message is cleared
 */
const Announcer: React.FC<AnnouncerProps> = ({
  message = '',
  assertive = false,
  clearDelay = 3000,
}) => {
  const [announcement, setAnnouncement] = useState(message);

  useEffect(() => {
    if (message) {
      setAnnouncement(message);

      const timer = setTimeout(() => {
        setAnnouncement('');
      }, clearDelay);

      return () => clearTimeout(timer);
    }
  }, [message, clearDelay]);

  return (
    <div
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="sr-only"
      data-testid="announcer"
    >
      {announcement}
    </div>
  );
};

export default Announcer;