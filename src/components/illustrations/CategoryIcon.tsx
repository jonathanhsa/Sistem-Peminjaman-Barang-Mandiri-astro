import React from 'react';
import { Book, Box, Camera, Radio } from 'lucide-react';

export interface CategoryIconProps {
  category: string;
  size?: number;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size = 20,
  className = '',
}) => {
  const normalized = (category || '').toLowerCase();

  if (normalized.includes('perpus') || normalized.includes('buku')) {
    return <Book size={size} className={className} />;
  }
  if (normalized.includes('lab') || normalized.includes('komputer') || normalized.includes('cam')) {
    return <Camera size={size} className={className} />;
  }
  if (normalized.includes('himpunan') || normalized.includes('speaker') || normalized.includes('proyektor')) {
    return <Radio size={size} className={className} />;
  }
  return <Box size={size} className={className} />;
};
