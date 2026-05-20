import { Bike, Car, Footprints } from "lucide-react";

export const TransportSelector = ({ transportMode, setTransportMode, disabled }: any) => (
  <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
    {[
      { id: 'foot', icon: Footprints },
      { id: 'bike', icon: Bike },
      { id: 'car', icon: Car }
    ].map(mode => (
      <button
        key={mode.id}
        onClick={() => setTransportMode(mode.id)}
        disabled={disabled}
        className={`flex-1 flex justify-center py-2 rounded-lg transition-all ${
          transportMode === mode.id 
            ? 'bg-white shadow-sm text-blue-600 font-bold' 
            : 'text-gray-400 hover:text-gray-600'
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        <mode.icon size={18} />
      </button>
    ))}
  </div>
);