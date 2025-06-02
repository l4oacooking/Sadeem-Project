import React from "react";
import freelanceImg from '@/assets/freelance.png'; // adjust path/extension if needed

const BusinessDetailsModal = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-slate-900 max-w-lg w-full p-8 rounded-2xl shadow-2xl border border-blue-800 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-6 text-white text-2xl font-bold"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4 text-white text-center">Business Details</h2>
        <div className="flex flex-col items-center">
          <img
            src={freelanceImg}
            alt="Freelance Certificate"
            className="border-2 border-blue-700 rounded-lg shadow-lg max-h-80 w-auto"
          />
          <p className="text-slate-300 mt-4 text-sm text-center">
            Our freelance business certificate proves our legal status as a registered Saudi business.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetailsModal;
