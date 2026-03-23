import React, { useState, useEffect } from 'react'; // Додано useEffect
import { MapContainer, TileLayer, Popup, useMap, Circle, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Settings, LogOut, Menu, X } from 'lucide-react';

// 1. Компонент для зміни вигляду мапи (коли тицяємо на кнопки)
const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

// 2. Компонент, який визначає місцезнаходження
const LocationMarker = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number>(0); // Стан для радіуса точності
  const map = useMap();

  useEffect(() => {
    map.locate({ enableHighAccuracy: true }).on("locationfound", function (e) {
      const latlng: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPosition(latlng);
      setAccuracy(e.accuracy); // Отримуємо точність у метрах від браузера
      map.flyTo(e.latlng, 16);
    });
  }, [map]);

  if (position === null) return null;

  return (
    <>
      {/* 1. Напівпрозоре коло, що показує точність (синій ореол) */}
      <Circle 
        center={position} 
        radius={accuracy} 
        pathOptions={{ 
            fillColor: '#3b82f6', 
            fillOpacity: 0.15, 
            color: 'transparent' 
        }} 
      />

      {/* 2. Сама синя крапка з білою обводкою (як у Google Maps) */}
      <CircleMarker 
        center={position} 
        radius={8} 
        pathOptions={{ 
            fillColor: '#3b82f6', 
            fillOpacity: 1, 
            color: 'white', 
            weight: 3 
        }} 
      >
        <Popup>Ти тут! 📍</Popup>
      </CircleMarker>
    </>
  );
};

const MapPage = () => {
  const [position, setPosition] = useState<[number, number]>([49.8397, 24.0297]); // Центр за замовчуванням (Львів)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLocationClick = () => {
    setPosition([49.8397, 24.0297]);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col-reverse lg:flex-row">
      
      {/* Мобільний хедер */}
      <header className="fixed top-0 left-0 right-0 z-[1001] bg-white/90 backdrop-blur-sm border-b border-gray-100 p-4 flex items-center justify-between lg:hidden shadow-sm">
          <h1 className="text-xl font-bold text-blue-600">Vandry</h1>
          <button onClick={toggleSidebar} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
              {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
      </header>

      {/* Сайдбар */}
      <aside className={`
          fixed inset-y-0 left-0 z-[2000] w-[90%] max-w-sm bg-white border-r border-gray-100 
          flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:absolute lg:top-4 lg:left-4 lg:z-[1000] lg:w-80 lg:max-h-[95vh] lg:h-auto
          lg:bg-white/90 lg:backdrop-blur-md lg:rounded-2xl lg:border lg:border-gray-200 lg:translate-x-0 lg:max-w-none lg:shadow-2xl
      `}>
        <div className="p-5 border-b border-gray-100 mt-16 lg:mt-0 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600 lg:block hidden">Vandry</h1>
          <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-gray-600 p-1">
             <X size={20} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Куди прямуємо?" 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Мій Маршрут</h3>
            <div className="space-y-2">
              <button 
                onClick={handleLocationClick}
                className="w-full text-left p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center space-x-3 hover:bg-blue-100 transition"
              >
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Львів, пл. Ринок</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-b-2xl">
          <Settings size={20} className="text-gray-400 cursor-pointer hover:text-gray-600" />
          <button className="text-red-500 hover:text-red-700 transition">
             <LogOut size={20} />
          </button>
        </div>
      </aside>
      
      {/* Оверлей для мобілки */}
      {isSidebarOpen && (
        <div onClick={toggleSidebar} className="fixed inset-0 bg-black/40 z-[1999] lg:hidden"></div>
      )}

      {/* Власне Мапа */}
      <MapContainer center={position} zoom={13} className="h-full w-full z-0 lg:z-auto" zoomControl={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {/* Керування центром мапи */}
        <ChangeView center={position} />
        
        {/* Автоматичне визначення локації */}
        <LocationMarker />
    
      </MapContainer>
    </div>
  );
};

export default MapPage;