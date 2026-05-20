import { GripVertical, MapPin, Trash2 } from "lucide-react";
import { useRef } from "react";

export const ItineraryList = ({ itinerary, isBuiltIn, onUpdateItinerary, onItemClick, onRemove }: any) => {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const _itinerary = [...itinerary];
    const draggedItemContent = _itinerary.splice(dragItem.current, 1)[0];
    _itinerary.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    onUpdateItinerary(_itinerary);
  };

  if (itinerary.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
          <MapPin className="text-blue-300" size={24} />
        </div>
        <p className="text-sm text-gray-400 italic">Оберіть цікаве місце на мапі, щоб почати подорож</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {itinerary.map((item: any, index: number) => (
        <div 
          key={item.uniqueId}
          draggable={!isBuiltIn} 
          onDragStart={() => (dragItem.current = index)} 
          onDragEnter={() => (dragOverItem.current = index)} 
          onDragEnd={handleSort} 
          onDragOver={(e) => e.preventDefault()} 
          onClick={() => onItemClick(item.longitude, item.latitude)}
          className="group w-full text-left p-3 bg-white border border-gray-100 rounded-xl flex items-center space-x-3 shadow-sm hover:border-blue-300 cursor-grab active:cursor-grabbing transition-all"
        >
          {!isBuiltIn && (
            <div className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing">
              <GripVertical size={16} />
            </div>
          )}
          <div className="w-6 h-6 bg-blue-600 text-white text-[10px] flex items-center justify-center rounded-full font-bold flex-shrink-0">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">{item.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{item.category}</p>
          </div>
          {!isBuiltIn && (
            <button 
              onClick={(e) => { e.stopPropagation(); onRemove(item.uniqueId!); }}
              className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-opacity"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};