import { Bike, Car, Clock, Footprints, Navigation } from "lucide-react";
import { formatDurationCompact } from "../../utils/formatters";
import { useState } from "react";

export const RouteIdeas = ({ builtInRoutes, onLoadIdea }: any) => {
  const [ideaMode, setIdeaMode] = useState<'foot' | 'bike' | 'car'>('foot');

  const filteredRoutes = builtInRoutes.filter((r: any) => r.transportMode === ideaMode);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between bg-gray-50 p-1 rounded-xl border border-gray-100">
        {[
          { id: 'foot', icon: Footprints, label: 'Пішки' },
          { id: 'bike', icon: Bike, label: 'Вело' },
          { id: 'car', icon: Car, label: 'Авто' }
        ].map(mode => (
          <button
            key={mode.id}
            onClick={() => setIdeaMode(mode.id as any)}
            className={`flex-1 flex justify-center items-center py-2.5 rounded-lg transition-all ${ideaMode === mode.id ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <mode.icon size={20} />
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {filteredRoutes.map((route: any) => (
          <div 
            key={route.id}
            onClick={() => onLoadIdea(route.id)}
            className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <h3 className="font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{route.name}</h3>
            {route.description && (
              <p className="text-xs text-gray-500 mb-3 line-clamp-2 italic">{route.description}</p>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs font-semibold text-gray-500">
              <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md w-fit max-w-full">
                <Navigation size={14} className="text-blue-500" />
                {(route.distance / 1000).toFixed(1)} км
              </span>
              <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md w-fit max-w-full whitespace-nowrap">
                <Clock size={14} className="text-green-500" />
                {formatDurationCompact(route.duration)}
              </span>
            </div>
          </div>
        ))}
        {filteredRoutes.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm font-medium">
            Поки немає ідей для цього типу транспорту
          </div>
        )}
      </div>
    </div>
  );
};