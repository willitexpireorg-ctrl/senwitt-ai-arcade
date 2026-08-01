import React from 'react';
import type { SpatialMemoryResult } from './SpatialMemoryGameHtml';
import { SpatialMemoryGameHtml } from './SpatialMemoryGameHtml';
import { UnitySpatialMemoryHost } from './UnitySpatialMemoryHost';

export type { SpatialMemoryResult };

interface SpatialMemoryGameProps {
  onComplete: (result: SpatialMemoryResult) => void;
  onCancel: () => void;
  gridSize?: number;
}

/**
 * Spatial Memory entry: Unity WebGL when `VITE_UNITY_SPATIAL=true` (and a build
 * exists — otherwise the host falls back to HTML). Default remains HTML.
 */
export const SpatialMemoryGame: React.FC<SpatialMemoryGameProps> = (props) => {
  const preferUnity = import.meta.env.VITE_UNITY_SPATIAL === 'true';
  if (preferUnity) {
    return <UnitySpatialMemoryHost {...props} />;
  }
  return <SpatialMemoryGameHtml {...props} />;
};
