import { useEffect, useRef } from 'react';

/**
 * Hook to listen for hardware barcode scanner input.
 * Hardware scanners usually act as a rapid keyboard input ending with 'Enter'.
 */
export const useHardwareScanner = (onScan: (barcode: string) => void) => {
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);

  useEffect(() => {
    // Note: In React Native, global key listeners are not directly available.
    // We usually need a hidden, auto-focused TextInput to capture this.
    // However, for this implementation, we will provide a component that handles this.
  }, []);

  return { barcodeBuffer, lastKeyTime };
};
