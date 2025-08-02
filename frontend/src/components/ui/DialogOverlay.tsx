import React from 'react';
import { Transition } from '@headlessui/react';

interface DialogOverlayProps {
  className?: string;
}

/**
 * Custom DialogOverlay component to replace Dialog.Overlay
 * This is needed because @headlessui/react v1.7+ removed Dialog.Overlay
 */
export const DialogOverlay: React.FC<DialogOverlayProps> = ({ className }) => {
  return (
    <div 
      className={className || "fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"}
      aria-hidden="true"
    />
  );
};

export default DialogOverlay;