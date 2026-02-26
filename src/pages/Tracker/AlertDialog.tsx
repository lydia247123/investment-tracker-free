import React from 'react';
import { createPortal } from 'react-dom';

interface AlertDialogProps {
  message: string;
  onClose: () => void;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({ message, onClose }) => {
  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Message */}
        <p className="text-gray-800 text-center text-lg mb-6">{message}</p>

        {/* OK Button */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-shadow"
        >
          OK
        </button>
      </div>
    </div>,
    document.body
  );
};
