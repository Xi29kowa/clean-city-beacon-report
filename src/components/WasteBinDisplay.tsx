
import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { WasteBin } from '@/types/location';

interface WasteBinDisplayProps {
  wasteBin: WasteBin;
  onDeselect: () => void;
}

const WasteBinDisplay: React.FC<WasteBinDisplayProps> = ({ wasteBin, onDeselect }) => {
  const getFillLevelDisplay = (fillLevel: string) => {
    switch (fillLevel) {
      case 'high': return '🔴 Hoch';
      case 'medium': return '🟡 Mittel';
      case 'low': return '🟢 Niedrig';
      default: return '⚪ Unbekannt';
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">
            🗑️ Ausgewählter Mülleimer
          </label>
          <div className="space-y-1">
            <p className="text-sm text-blue-700 font-medium">{wasteBin.location}</p>
            <p className="text-xs text-blue-600">
              ID: {wasteBin.id} • Füllstand: {getFillLevelDisplay(wasteBin.fillLevel)}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDeselect}
          className="text-blue-600 hover:text-blue-800"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default WasteBinDisplay;
