import { ALL_CITIES } from './dashboard-logic';

interface CityFilterBarProps {
  cities: string[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
}

export default function CityFilterBar({ cities, selectedCity, onSelectCity }: CityFilterBarProps) {
  const chipClass = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
      active
        ? 'border-cyan-300/40 bg-cyan-500/15 text-cyan-50'
        : 'border-white/15 bg-white/5 text-muted-foreground hover:border-cyan-300/30 hover:text-cyan-100'
    }`;

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter programs by city">
      <button type="button" className={chipClass(selectedCity === ALL_CITIES)} onClick={() => onSelectCity(ALL_CITIES)}>
        All cities
      </button>
      {cities.map((city) => (
        <button key={city} type="button" className={chipClass(selectedCity === city)} onClick={() => onSelectCity(city)}>
          {city}
        </button>
      ))}
    </div>
  );
}
