import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

type EngineSettingsProps = {
  engineLevel: number;
  onLevelChange: (value: number) => void;
  engineDepth: number;
  onDepthChange: (value: number) => void;
};

export function EngineSettings({
  engineLevel,
  onLevelChange,
  engineDepth,
  onDepthChange
}: EngineSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Engine Level: {engineLevel}</Label>
        <Slider
          value={[engineLevel]}
          onValueChange={([value]) => onLevelChange(value)}
          min={0}
          max={20}
          step={1}
        />
      </div>

      <div className="space-y-2">
        <Label>Search Depth: {engineDepth}</Label>
        <Slider
          value={[engineDepth]}
          onValueChange={([value]) => onDepthChange(value)}
          min={1}
          max={20}
          step={1}
        />
      </div>
    </div>
  );
}