import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAvatarStore } from '../../stores/avatarStore';

interface AvatarCustomizationProps {
  onClose?: () => void;
  onComplete?: () => void;
}

export const AvatarCustomization: React.FC<AvatarCustomizationProps> = ({ onClose, onComplete }) => {
  const {
    myAvatar,
    availableModels,
    availableColors,
    availableAnimations,
    updateAvatarCustomization,
    playAnimation
  } = useAvatarStore();

  const [selectedModel, setSelectedModel] = useState(myAvatar?.model_type || 'wizard');
  const [selectedColor, setSelectedColor] = useState(myAvatar?.color_scheme || 'blue');
  const [previewAnimation, setPreviewAnimation] = useState('idle');

  const modelDescriptions = {
    wizard: { name: 'Arcane Wizard', icon: '🧙‍♂️', description: 'Master of mystical arts' },
    knight: { name: 'Noble Knight', icon: '⚔️', description: 'Defender of the realm' },
    dragon: { name: 'Ancient Dragon', icon: '🐉', description: 'Legendary creature' },
    archer: { name: 'Elven Archer', icon: '🏹', description: 'Swift and precise' },
    mage: { name: 'Battle Mage', icon: '🔮', description: 'Wielder of combat magic' },
    warrior: { name: 'Fierce Warrior', icon: '🛡️', description: 'Master of combat' }
  };

  const colorDescriptions = {
    blue: { name: 'Mystic Blue', hex: '#3b82f6' },
    red: { name: 'Flame Red', hex: '#ef4444' },
    green: { name: 'Nature Green', hex: '#10b981' },
    purple: { name: 'Royal Purple', hex: '#8b5cf6' },
    gold: { name: 'Ancient Gold', hex: '#f59e0b' },
    silver: { name: 'Moonlight Silver', hex: '#6b7280' },
    black: { name: 'Shadow Black', hex: '#1f2937' },
    white: { name: 'Pure White', hex: '#f9fafb' }
  };

  const handleSave = () => {
    updateAvatarCustomization({
      model_type: selectedModel,
      color_scheme: selectedColor
    });
    onComplete?.();
    onClose?.();
  };

  const handlePreviewAnimation = (animation: string) => {
    setPreviewAnimation(animation);
    playAnimation(animation);
    
    // Reset to idle after 3 seconds
    setTimeout(() => {
      setPreviewAnimation('idle');
      playAnimation('idle');
    }, 3000);
  };

  const handleReset = () => {
    setSelectedModel('wizard');
    setSelectedColor('blue');
    setPreviewAnimation('idle');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-700">
        <h2 className="text-2xl font-game text-white flex items-center space-x-3">
          <span>✨</span>
          <span>Avatar Customization</span>
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="flex h-[600px]">
        {/* Customization Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Model Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-white mb-4">Choose Your Avatar</h3>
            <div className="grid grid-cols-2 gap-3">
              {availableModels.map((model) => {
                const info = modelDescriptions[model as keyof typeof modelDescriptions];
                return (
                  <motion.button
                    key={model}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedModel(model)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedModel === model
                        ? 'border-magic-500 bg-magic-900/30'
                        : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-3xl mb-2">{info?.icon}</div>
                    <div className="text-white font-medium">{info?.name}</div>
                    <div className="text-gray-400 text-sm">{info?.description}</div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Color Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-white mb-4">Color Scheme</h3>
            <div className="grid grid-cols-4 gap-3">
              {availableColors.map((color) => {
                const info = colorDescriptions[color as keyof typeof colorDescriptions];
                return (
                  <motion.button
                    key={color}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedColor(color)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedColor === color
                        ? 'border-white ring-2 ring-magic-500'
                        : 'border-slate-600 hover:border-slate-400'
                    }`}
                    style={{ backgroundColor: info?.hex + '20' }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full mx-auto mb-2 border-2 border-white/20"
                      style={{ backgroundColor: info?.hex }}
                    />
                    <div className="text-white text-sm font-medium">{info?.name}</div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Animation Preview */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-4">Preview Animations</h3>
            <div className="grid grid-cols-4 gap-2">
              {availableAnimations.map((animation) => (
                <motion.button
                  key={animation}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePreviewAnimation(animation)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    previewAnimation === animation
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:text-white'
                  }`}
                >
                  {animation.charAt(0).toUpperCase() + animation.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-80 bg-slate-800/50 border-l border-slate-700 p-6">
          <h3 className="text-lg font-medium text-white mb-4">Preview</h3>
          
          {/* 3D Preview would go here */}
          <div className="bg-gradient-to-b from-purple-900/50 to-blue-900/50 rounded-lg p-8 mb-6 min-h-[200px] flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {modelDescriptions[selectedModel as keyof typeof modelDescriptions]?.icon}
              </div>
              <div className="text-white font-medium">
                {modelDescriptions[selectedModel as keyof typeof modelDescriptions]?.name}
              </div>
              <div 
                className="w-4 h-4 rounded-full mx-auto mt-2 border border-white/30"
                style={{ backgroundColor: colorDescriptions[selectedColor as keyof typeof colorDescriptions]?.hex }}
              />
            </div>
          </div>

          {/* Current Stats */}
          <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
            <h4 className="text-white font-medium mb-3">Current Selection</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Model:</span>
                <span className="text-white">{modelDescriptions[selectedModel as keyof typeof modelDescriptions]?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Color:</span>
                <span className="text-white">{colorDescriptions[selectedColor as keyof typeof colorDescriptions]?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Animation:</span>
                <span className="text-white">{previewAnimation}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
            >
              <CheckIcon className="w-5 h-5" />
              <span>Save Changes</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReset}
              className="w-full bg-slate-600 hover:bg-slate-500 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5" />
              <span>Reset to Default</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Cancel
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
