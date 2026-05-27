import React from 'react';
import { Toaster, toast as reactToast } from 'react-hot-toast';

// Export the toast functions so they can be imported directly
export const toast = reactToast;

// Optional provider component – place it once in your app (e.g., in App.jsx)
export default function ToastProvider() {
  return <Toaster position="top-right" reverseOrder={false} />;
}
