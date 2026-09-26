import { useEffect } from 'react';

/**
 * Enterprise Accessibility Hook for Modals and Dialogs:
 * 1. Closes modal on Escape key press (WAI-ARIA Dialog Authoring Practices)
 * 2. Prevents background scroll leakage while modal is open
 * 3. Restores scroll and cleans up event listeners on unmount/close
 */
export interface ModalA11yOptions {
  isOpen: boolean;
  onClose: () => void;
}

export function useModalA11y(
  isOpenOrOptions: boolean | ModalA11yOptions,
  maybeOnClose?: () => void
) {
  const isOpen = typeof isOpenOrOptions === 'boolean' ? isOpenOrOptions : isOpenOrOptions.isOpen;
  const onClose = typeof isOpenOrOptions === 'boolean' ? maybeOnClose! : isOpenOrOptions.onClose;

  useEffect(() => {
    if (!isOpen || !onClose) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Lock body scroll to prevent background drift
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);
}
