import React, { useState, useCallback, useEffect } from 'react';
import { LogOut, Menu, X, MapPin, Navigation, Save, User, Share2, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PlaceInfo, RouteSummaryData } from '../types/route';
import toast from 'react-hot-toast';
import { getTranslatedCategory } from '../utils/formatters';
import { SearchAutocomplete } from '../components/route/SearchAutocomplete';
import { TransportSelector } from '../components/route/TransportSelector';
import { RouteInfo } from '../components/route/RouteInfo';
import { ItineraryList } from '../components/route/ItinenaryList';
import { RouteIdeas } from '../components/route/RouteIdeas';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Map, GeolocateControl, Layer, Marker, NavigationControl, Popup, Source } from 'react-map-gl';


const MapPage = () => {
  const [viewState, setViewState] = useState({ longitude: 24.0297, latitude: 49.8397, zoom: 13 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceInfo | null>(null);
  const [itinerary, setItinerary] = useState<PlaceInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [sessionToken, setSessionToken] = useState(() => crypto.randomUUID());
  const [routeData, setRouteData] = useState<any>(null);
  const [transportMode, setTransportMode] = useState<'car' | 'foot' | 'bike'>('foot');
  const [routeSummary, setRouteSummary] = useState<RouteSummaryData | null>(null);
  const [currentRouteId, setCurrentRouteId] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [currentRouteName, setCurrentRouteName] = useState<string>("");
  const [activeSidebarTab, setActiveSidebarTab] = useState<'create' | 'ideas'>('create');
  const [builtInRoutes, setBuiltInRoutes] = useState<any[]>([]);
  const [currentRouteDescription, setCurrentRouteDescription] = useState<string>("");
  const [isBuiltIn, setIsBuiltIn] = useState<boolean>(false);
  const [isDestinationFixed, setIsDestinationFixed] = useState(false);

  const navigate = useNavigate();

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
  const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY;

  const flyTo = useCallback((lng: number, lat: number) => {
    setViewState(prev => ({ ...prev, longitude: lng, latitude: lat, zoom: 15 }));
  }, []);

  // --- API Calls ---
  useEffect(() => {
    const fetchBuiltInRoutes = async () => {
      const jwtToken = localStorage.getItem('token');
      if (!jwtToken) return;
      try {
        const response = await fetch('http://localhost:8080/api/route/built-in', { headers: { 'Authorization': `Bearer ${jwtToken}` } });
        if (response.ok) setBuiltInRoutes(await response.json());
      } catch (error) { console.error("Помилка завантаження вбудованих маршрутів:", error); }
    };
    fetchBuiltInRoutes();
  }, []);

  const loadRouteFromUrl = async (id: string, isPublic = false) => {
    const jwtToken = localStorage.getItem('token');
    try {
      const url = isPublic ? `http://localhost:8080/api/route/public/${id}` : `http://localhost:8080/api/route/${id}`;
      const headers: Record<string, string> = {};
      if (!isPublic && jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
      }

      const response = await fetch(url, { headers });

      if (response.ok) {
        const data = await response.json();
        setIsBuiltIn(isPublic ? true : data.isBuiltIn);
        setTransportMode(data.transportMode as any);
        if(!isPublic) setCurrentRouteId(data.id);
        setCurrentRouteName(data.name);
        setCurrentRouteDescription(data.description || "");
        setHasChanges(false);

        const loadedItinerary = data.stops.map((stop: any, index: number) => ({
          uniqueId: `url-${Date.now()}-${index}`, 
          placeId: stop.placeId, id: stop.placeId, name: stop.name,
          address: stop.address, category: stop.category,
          longitude: stop.longitude, latitude: stop.latitude
        }));
        
        setItinerary(loadedItinerary);
        if (loadedItinerary.length > 0) flyTo(loadedItinerary[0].longitude, loadedItinerary[0].latitude);
      } else {
        if(isPublic) {
          toast.error("Цей маршрут не існує або був видалений.");
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch (error) { console.error("Помилка завантаження маршруту:", error); }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location?.search || '');
    const routeIdParam = urlParams.get('routeId');
    const publicRouteIdParam = urlParams.get('publicRouteId');
    if (routeIdParam) {
      loadRouteFromUrl(routeIdParam, false);
    } else if (publicRouteIdParam) {
      loadRouteFromUrl(publicRouteIdParam, true);
    }
  }, []);

  useEffect(() => {
    const fetchRoute = async () => {
      if (itinerary.length < 2) { setRouteData(null); setRouteSummary(null); return; }
      const coordinates = itinerary.map(item => `${item.longitude},${item.latitude}`).join(';');
      const profile = { car: 'driving', foot: 'walking', bike: 'cycling' }[transportMode];
      
      try {
        const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`);
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          setRouteData(data.routes[0].geometry);
          setRouteSummary({ distance: data.routes[0].distance, duration: data.routes[0].duration });
        }
      } catch (error) { console.error("Помилка побудови маршруту:", error); }
    };
    fetchRoute();
  }, [itinerary, transportMode]);

  // --- Handlers ---
  const handleMapClick = async (event: any) => {
    try {
      const map = event.target;
      if (!map || !event.point) return;
      const padding = 15;
      const bbox: [any, any] = [[event.point.x - padding, event.point.y - padding], [event.point.x + padding, event.point.y + padding]];
      const validLayers = ['poi-label', 'landmark-label', 'natural-point-label', 'transit-label'].filter(l => map.getStyle()?.layers?.map((lyr: any) => lyr.id).includes(l));
      let features: any[] = validLayers.length > 0 ? map.queryRenderedFeatures(bbox, { layers: validLayers }) : [];

      let placeName = "", address = "Пам'ятка на мапі", category = "Об'єкт";
      let finalLng = event.lngLat.lng, finalLat = event.lngLat.lat, placeId = Date.now().toString(), isPoi = false;

      if (features.length > 0 && (features[0].properties?.name_uk || features[0].properties?.name)) {
        const feature = features[0];
        placeName = feature.properties?.name_uk || feature.properties?.name;
        category = getTranslatedCategory(feature.properties?.category_en || feature.properties?.type || feature.properties?.maki);
        isPoi = true;
        if (feature.geometry && feature.geometry.type === 'Point') {
          finalLng = feature.geometry.coordinates[0];
          finalLat = feature.geometry.coordinates[1];
        }
        placeId = feature.id?.toString() || placeId;
      } else {
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${finalLng},${finalLat}.json?access_token=${MAPBOX_TOKEN}&language=uk&limit=1`);
        const data = await response.json();
        if (data.features?.length > 0) {
          placeName = data.features[0].text; address = data.features[0].place_name; category = "Точка на мапі";
        } else {
          placeName = "Невідома локація"; address = `Координати: ${finalLng.toFixed(5)}, ${finalLat.toFixed(5)}`; category = "Координати";
        }
      }

      setSelectedPlace({ placeId, name: placeName, address, category, longitude: finalLng, latitude: finalLat });

      if (GOOGLE_KEY && placeName) {
        try {
          const searchQuery = isPoi ? `${placeName}, ${address}` : placeName;
          const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GOOGLE_KEY, 'X-Goog-FieldMask': 'places.photos' },
            body: JSON.stringify({ textQuery: searchQuery, languageCode: 'uk' })
          });
          const searchData = await searchRes.json();
          if (searchData.places?.[0]?.photos?.length > 0) {
            const photoUrl = `https://places.googleapis.com/v1/${searchData.places[0].photos[0].name}/media?maxHeightPx=400&maxWidthPx=400&key=${GOOGLE_KEY}`;
            setSelectedPlace(prev => prev && prev.placeId === placeId ? { ...prev, imageUrl: photoUrl } : prev);
          }
        } catch (error) { console.error("Error fetching photo:", error); }
      }
    } catch (error) { console.error("Помилка обробки кліку:", error); }
  };

  const handleSearchInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value; setSearchQuery(query);
    if (query.length < 3) return setSuggestions([]);
    try {
      const response = await fetch(`https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&language=uk&session_token=${sessionToken}&access_token=${MAPBOX_TOKEN}`);
      setSuggestions((await response.json()).suggestions || []);
    } catch (error) { console.error("Помилка пошуку:", error); }
  };

  const handleSuggestionClick = async (suggestion: any) => {
    try {
      const response = await fetch(`https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}?session_token=${sessionToken}&access_token=${MAPBOX_TOKEN}`);
      const data = await response.json();
      if (data.features?.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.geometry.coordinates;
        flyTo(lng, lat);
        setSelectedPlace({
          placeId: feature.properties.mapbox_id, name: feature.properties.name || suggestion.name,
          address: feature.properties.place_formatted || feature.properties.full_address || "Адреса не вказана",
          category: "Знайдено в пошуку", longitude: lng, latitude: lat
        });
        setSearchQuery(""); setSuggestions([]); setSessionToken(crypto.randomUUID());
      }
    } catch (error) { console.error("Помилка отримання деталей:", error); }
  };

const optimizeRoute = async () => {
    if (itinerary.length < 3) return toast.error("Для оптимізації потрібно хоча б 3 точки!");
    if (itinerary.length > 12) return toast.error("Максимум 12 точок для оптимізації.");
    
    try {
      const response = await fetch(`http://localhost:8080/api/route/optimize?fixDestination=${isDestinationFixed}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(itinerary)
      });

      if (!response.ok) {
        return toast.error("Помилка оптимізації на сервері.");
      }

      const optimizedItinerary = await response.json();
      
      setItinerary(optimizedItinerary);
      setHasChanges(true);
      toast.success("Маршрут успішно оптимізовано!");
    } catch (error) { 
      toast.error("Сталася помилка при з'єднанні з сервером."); 
    }
  };

  const handleSaveRoute = async () => {
    if (itinerary.length < 2 || !routeSummary) return;
    if (!currentRouteName.trim()) return toast.error("Будь ласка, введіть назву маршруту!");
    const payload = {
      name: currentRouteName, transportMode, distance: routeSummary.distance, duration: routeSummary.duration, description: currentRouteDescription,
      stops: itinerary.map((item, index) => ({ ...item, stopOrder: index + 1 }))
    };
    try {
      const isUpdating = currentRouteId !== null;
      const response = await fetch(isUpdating ? `http://localhost:8080/api/route/${currentRouteId}` : 'http://localhost:8080/api/route', {
        method: isUpdating ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      if (response.status === 401 || response.status === 403) { localStorage.removeItem('token'); return toast.error("Час сесії вийшов."); }
      if (response.ok) { toast.success(isUpdating ? "Маршрут оновлено!" : "Маршрут збережено!"); setHasChanges(false); } 
      else toast.error("Помилка при збереженні");
    } catch (error) { console.error("Помилка мережі:", error); }
  };

  const handleOpenInGoogleMaps = () => {
    if (itinerary.length < 2) return;
    const formatPoint = (item: PlaceInfo) => {
      const isPlaceholder = !item.address || item.address === "Пам'ятка на мапі" || item.address.startsWith("Координати:");
      return isPlaceholder ? `${item.latitude},${item.longitude}` : encodeURIComponent(`${item.name}, ${item.address}`);
    };
    const origin = formatPoint(itinerary[0]);
    const destination = formatPoint(itinerary[itinerary.length - 1]);
    const waypointsArray = itinerary.slice(1, -1).map(formatPoint);
    const waypointsParam = waypointsArray.length > 0 ? `&waypoints=${waypointsArray.join('|')}` : '';
    const gmapsMode = { foot: 'walking', bike: 'bicycling', car: 'driving' }[transportMode];
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsParam}&travelmode=${gmapsMode}`, '_blank');
  };

  const routeLayerStyle: any = {
    id: 'route-layer', type: 'line',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#2563eb', 'line-width': 5, 'line-opacity': 0.8 }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col-reverse lg:flex-row">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-[1001] bg-white/90 backdrop-blur-sm border-b border-gray-100 p-4 flex items-center justify-between lg:hidden shadow-sm">
          <h1 className="text-xl font-bold text-blue-600">Vandry</h1>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
      </header>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[2000] w-[90%] max-w-sm bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:absolute lg:top-4 lg:left-4 lg:z-[1000] lg:w-80 lg:max-h-[95vh] lg:h-auto lg:bg-white/90 lg:backdrop-blur-md lg:rounded-2xl lg:border lg:border-gray-200 lg:translate-x-0 lg:max-w-none lg:shadow-2xl`}>
        <div className="p-5 border-b border-gray-100 mt-16 lg:mt-0 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Vandry</h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 p-1"><X size={20} /></button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
            <button onClick={() => setActiveSidebarTab('create')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeSidebarTab === 'create' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Мій маршрут</button>
            <button onClick={() => setActiveSidebarTab('ideas')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeSidebarTab === 'ideas' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Ідеї подорожей</button>
          </div>

          {activeSidebarTab === 'create' && (
            <>
              <SearchAutocomplete searchQuery={searchQuery} onSearchInput={handleSearchInput} suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Мій Маршрут</h3>
                <TransportSelector transportMode={transportMode} setTransportMode={setTransportMode} disabled={isBuiltIn} />
                
                {routeSummary && itinerary.length >= 2 && (
                  <>
                    <RouteInfo summary={routeSummary} name={currentRouteName} description={currentRouteDescription} isBuiltIn={isBuiltIn} setName={setCurrentRouteName} setDescription={setCurrentRouteDescription} setHasChanges={setHasChanges} />
                    <div className="flex flex-col gap-2 mt-2">
                      {isBuiltIn && (
                        <button onClick={() => { setCurrentRouteId(null); setIsBuiltIn(false); setHasChanges(true); }} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm">
                          <span>Взяти за основу (редагувати)</span>
                        </button>
                      )}
                      {itinerary.length >= 3 && !isBuiltIn && (
                        <div className="mt-4 p-1.5 bg-gray-50 border border-gray-100 rounded-2xl shadow-sm">
                          
                          {/* Зона налаштування */}
                          <label className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={isDestinationFixed}
                              onChange={(e) => setIsDestinationFixed(e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 cursor-pointer transition-colors"
                            />
                            <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors select-none">
                              Закріпити останню точку
                            </span>
                          </label>

                          {/* Кнопка дії */}
                          <button 
                            onClick={optimizeRoute} 
                            className="w-full py-2.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                          >
                            <Wand2 className="w-5 h-5" /> 
                            <span>Оптимізувати порядок</span>
                          </button>
                          
                        </div>
                      )}
                      {(!currentRouteId || hasChanges) && !isBuiltIn && (
                        <button onClick={handleSaveRoute} className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm">
                          <Save className="w-5 h-5" /> <span>{currentRouteId ? "Оновити" : "Зберегти"}</span>
                        </button>
                      )}
                      <button onClick={handleOpenInGoogleMaps} className="w-full py-2.5 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm">
                        <Navigation className="w-5 h-5" /> <span>В Google Maps</span>
                      </button>
                      {currentRouteId && !hasChanges && (
                        <button onClick={() => { navigator.clipboard.writeText(`${window.location?.origin || ''}/map?publicRouteId=${currentRouteId}`); toast.success("Лінк скопійовано!"); }} className="w-full py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm">
                          <Share2 className="w-5 h-5" /> <span>Поділитися</span>
                        </button>
                      )}
                      <button onClick={() => { if(window.confirm("Очистити маршрут?")) { setItinerary([]); setCurrentRouteId(null); setCurrentRouteName(""); setCurrentRouteDescription(""); setIsBuiltIn(false); setHasChanges(false); } }} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm">
                        <span>Очистити все</span>
                      </button>
                    </div>
                  </>
                )}
                
                <ItineraryList itinerary={itinerary} isBuiltIn={isBuiltIn} onItemClick={flyTo} onRemove={(id: string) => { setItinerary(itinerary.filter(i => i.uniqueId !== id)); setHasChanges(true); }} onUpdateItinerary={(newItinerary: any) => { setItinerary(newItinerary); setHasChanges(true); }} />
              </div>
            </>
          )}

          {activeSidebarTab === 'ideas' && <RouteIdeas builtInRoutes={builtInRoutes} onLoadIdea={(id: number) => { loadRouteFromUrl(id.toString(), true); setActiveSidebarTab('create'); }} />}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/30 rounded-b-2xl">
          <button onClick={() => navigate('/profile')} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition font-bold text-sm bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"><User size={18} /> Профіль</button>
          <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} className="text-red-400 hover:text-red-600 transition flex items-center gap-2 text-sm font-bold"><LogOut size={18} /> Вийти</button>
        </div>
      </aside>
      
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-[1999] lg:hidden"></div>}

      {/* Main Map */}
      <div className="absolute inset-0 pt-[72px] lg:pt-0 bg-gray-200 z-0">
        <Map {...viewState} onMove={(evt: any) => setViewState(evt.viewState)} onLoad={(evt: any) => evt.target.setLanguage('uk')} onClick={handleMapClick} mapStyle="mapbox://styles/mapbox/streets-v12" mapboxAccessToken={MAPBOX_TOKEN} style={{ width: '100%', height: '100%' }}>
          {routeData && <Source id="route-source" type="geojson" data={routeData}><Layer {...routeLayerStyle} /></Source>}
          <GeolocateControl position="top-right" trackUserLocation={true} />
          <NavigationControl position="top-right" />

          {itinerary.map((item, index) => (
            <Marker key={item.uniqueId} longitude={item.longitude} latitude={item.latitude} anchor="bottom"> 
              <div className="flex flex-col items-center group cursor-pointer drop-shadow-lg">
                <div className="bg-white px-2 py-1 rounded-md shadow-md text-[10px] font-bold mb-1 border border-blue-100 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 whitespace-nowrap">{item.name}</div>
                <div className="relative transform transition-transform group-hover:scale-110">
                  <MapPin size={34} className="text-blue-600" fill="white" />
                  <span className="absolute top-1.5 left-0 right-0 text-[10px] font-black text-center text-blue-700">{index + 1}</span>
                </div>
              </div>
            </Marker>
          ))}

          {selectedPlace && (
            <Popup longitude={selectedPlace.longitude} latitude={selectedPlace.latitude} anchor="bottom" onClose={() => setSelectedPlace(null)} closeButton={true} closeOnClick={false} className="z-[1001] min-w-[280px] [&_.mapboxgl-popup-close-button]:!text-2xl [&_.mapboxgl-popup-close-button]:!w-8 [&_.mapboxgl-popup-close-button]:!h-8 [&_.mapboxgl-popup-close-button]:!text-gray-400 hover:[&_.mapboxgl-popup-close-button]:!text-gray-800 hover:[&_.mapboxgl-popup-close-button]:!bg-gray-100 [&_.mapboxgl-popup-close-button]:!transition-colors [&_.mapboxgl-popup-close-button]:!rounded-bl-xl">
              <div className="p-1 text-gray-800">
                <div className="flex items-center gap-2 mb-1"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] uppercase font-black rounded-full tracking-tighter">{selectedPlace.category}</span></div>
                <h3 className="text-lg font-bold mb-1 leading-tight text-gray-900 border-b border-gray-100 pb-1">{selectedPlace.name}</h3>
                {selectedPlace.imageUrl && (
                  <div className="mt-2 mb-1 w-full h-32 overflow-hidden rounded-lg bg-gray-100 border border-gray-200"><img src={selectedPlace.imageUrl} alt={selectedPlace.name} className="w-full h-full object-cover" /></div>
                )}
                <div className="flex items-start gap-1 mb-4">
                  <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" /><p className="text-[10px] text-gray-400 leading-tight italic">{selectedPlace.address}</p>
                </div>
                <button className="w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 active:scale-[0.98]" onClick={() => {
                  if (isBuiltIn) return toast.error("Це вбудований маршрут. Створіть новий для редагування!");
                  setItinerary([...itinerary, { ...selectedPlace, uniqueId: Date.now().toString() + Math.random().toString(36).substr(2, 5) }]);
                  setSelectedPlace(null); setHasChanges(true);
                }}>Додати в подорож</button>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}

export default MapPage;