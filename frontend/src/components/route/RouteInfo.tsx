import { Clock, Navigation } from "lucide-react";
import { formatDistance, formatDuration } from "../../utils/formatters";

export const RouteInfo = ({ summary, name, description, isBuiltIn, setName, setDescription, setHasChanges }: any) => (
  <div className="flex flex-col gap-2 mb-4">
    <div className="flex items-center justify-between bg-blue-50/50 border border-blue-100 p-3 rounded-xl text-sm shadow-sm">
      <div className="flex items-center gap-2 text-blue-800 font-medium">
        <Navigation size={16} className="text-blue-500" />
        <span>{formatDistance(summary.distance)}</span>
      </div>
      <div className="flex items-center gap-2 text-blue-800 font-medium">
        <Clock size={16} className="text-blue-500" />
        <span>{formatDuration(summary.duration)}</span>
      </div>
    </div>
    <div className="flex flex-col gap-2 my-2">
      {isBuiltIn ? (
        <div className="px-1 py-2">
          <h2 className="text-xl font-black text-gray-800 mb-2">{name}</h2>
          {description && (
            <p className="text-sm text-gray-600 italic leading-relaxed border-l-2 border-blue-200 pl-3">
              {description}
            </p>
          )}
        </div>
      ) : (
        <>
          <input
            type="text"
            placeholder="Назва маршруту (напр. Замки Львівщини)"
            value={name}
            onChange={(e) => { setName(e.target.value); setHasChanges(true); }}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-bold text-gray-800"
          />
          <textarea
            placeholder="Додайте опис: що цікавого на цьому маршруті?"
            value={description}
            onChange={(e) => { setDescription(e.target.value); setHasChanges(true); }}
            rows={4}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm text-gray-600 resize-y min-h-[100px]"
          />
        </>
      )}
    </div>
  </div>
);