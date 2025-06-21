
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProblemTypeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

const ProblemTypeSelect: React.FC<ProblemTypeSelectProps> = ({ value, onValueChange }) => {
  const problemTypes = [
    { value: 'overfull', label: 'Überfüllt' },
    { value: 'damaged', label: 'Beschädigt' },
    { value: 'missing', label: 'Fehlt' },
    { value: 'dirty', label: 'Verschmutzt' },
    { value: 'blocked', label: 'Blockiert' },
    { value: 'other', label: 'Sonstiges' }
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        🚨 Problem-Art <span className="text-red-500">*</span>
      </label>
      <Select value={value} onValueChange={onValueChange} required>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Problem auswählen..." />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-300 rounded-md shadow-lg z-50">
          {problemTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProblemTypeSelect;
