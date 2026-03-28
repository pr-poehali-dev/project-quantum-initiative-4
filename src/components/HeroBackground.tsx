import { useMapRoute } from "./map/useMapRoute";

interface Props {
  from: string;
  to: string;
  stops?: string[];
  formHeight?: number;
}

export default function HeroBackground({ from, to, stops = [], formHeight }: Props) {
  const { mapRef } = useMapRoute({ from, to, stops, formHeight });

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
    </div>
  );
}
