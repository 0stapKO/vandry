import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Navigation, Users, Settings, LogOut } from 'lucide-react';

// Custom component to handle map center changes
const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  map.setView(center);
  return null;
};

const MapPage = () => {
  const [position, setPosition] = useState<[number, number]>([49.8397, 24.0297]); // Lviv coordinates

  return (
    <div className="relative h-screen w-full overflow-hidden">
      
      {/* 1. Floating Sidebar over the map */}
      <aside className="absolute top-4 left-4 z-[1000] w-80 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[95vh]">
        <div className="p-5 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-blue-600">Vandry</h1>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Куди прямуємо?" 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* Route Info Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Мій Маршрут</h3>
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Львів, пл. Ринок</span>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-400 italic">Додати точку...</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition border border-gray-100">
              <Users size={20} className="text-blue-600 mb-1" />
              <span className="text-xs font-medium">Співпраця</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition border border-gray-100">
              <Navigation size={20} className="text-green-600 mb-1" />
              <span className="text-xs font-medium">Маршрут</span>
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-b-2xl">
          <Settings size={20} className="text-gray-400 cursor-pointer hover:text-gray-600" />
          <button className="text-red-500 hover:text-red-700 transition">
             <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* 2. Full-screen Map */}
      <MapContainer 
        center={position} 
        zoom={13} 
        className="h-full w-full"
        zoomControl={false} // Disable to move it later or keep UI clean
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ChangeView center={position} />
        <Marker position={position}>
          <Popup>Остап тут планує подорож! 🚀</Popup>
        </Marker>
      </MapContainer>

    </div>
  );
};

export default MapPage;