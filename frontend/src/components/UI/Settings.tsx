
import React from 'react';
import { Modal } from './Modal';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block mb-2 font-semibold">Graphics Quality</label>
          <select className="w-full bg-gray-700 rounded-lg px-4 py-2">
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>
        <div>
          <label className="block mb-2 font-semibold">Sound Effects</label>
          <input type="range" min="0" max="100" defaultValue="80" className="w-full" />
        </div>
        <div>
          <label className="block mb-2 font-semibold">Music</label>
          <input type="range" min="0" max="100" defaultValue="50" className="w-full" />
        </div>
      </div>
      <div className="flex justify-end mt-6">
        <button 
          onClick={onClose} 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
        >
          Save & Close
        </button>
      </div>
    </Modal>
  );
}
