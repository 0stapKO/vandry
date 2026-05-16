import React, { useState, useCallback, useEffect, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl';
import type { ViewStateChangeEvent, MapLayerMouseEvent } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Search, LogOut, Menu, X, MapPin, Trash2, Car, Bike, Footprints, GripVertical, Clock, Navigation, Save, User, Share2, Wand2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Interface for our location data
interface PlaceInfo {
  placeId: string;
  uniqueId?: string;
  name: string;
  address: string;
  category?: string;
  imageUrl?: string;
  longitude: number;
  latitude: number;
}

const MapPage = () => {
  // Initial map state (Lviv)
  const [viewState, setViewState] = useState({
    longitude: 24.0297,
    latitude: 49.8397,
    zoom: 13
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceInfo | null>(null);
  const [itinerary, setItinerary] = useState<PlaceInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [sessionToken, setSessionToken] = useState(() => crypto.randomUUID());
  const [routeData, setRouteData] = useState<any>(null);
  const [transportMode, setTransportMode] = useState<'car' | 'foot' | 'bike'>('foot');
  const [routeSummary, setRouteSummary] = useState<{distance: number, duration: number} | null>(null);
  const [currentRouteId, setCurrentRouteId] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [currentRouteName, setCurrentRouteName] = useState<string>("");
  const [activeSidebarTab, setActiveSidebarTab] = useState<'create' | 'ideas'>('create');
  const [ideaMode, setIdeaMode] = useState<'foot' | 'bike' | 'car'>('foot');
  const [builtInRoutes, setBuiltInRoutes] = useState<any[]>([]);
  const [currentRouteDescription, setCurrentRouteDescription] = useState<string>("");
  const [isBuiltIn, setIsBuiltIn] = useState<boolean>(false);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const flyTo = useCallback((lng: number, lat: number) => {
    setViewState(prev => ({
      ...prev,
      longitude: lng,
      latitude: lat,
      zoom: 15
    }));
  }, []);

  useEffect(() => {
    const fetchBuiltInRoutes = async () => {
      const jwtToken = localStorage.getItem('token');
      if (!jwtToken) return;

      try {
        const response = await fetch('http://localhost:8080/api/route/built-in', {
          headers: { 'Authorization': `Bearer ${jwtToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          setBuiltInRoutes(data);
        }
      } catch (error) {
        console.error("Помилка завантаження вбудованих маршрутів:", error);
      }
    };

    fetchBuiltInRoutes();
  }, []);

  const loadRouteFromUrl = async (id: string) => {
    const jwtToken = localStorage.getItem('token');
    if (!jwtToken) return;

    try {
      const response = await fetch(`http://localhost:8080/api/route/${id}`, {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        setIsBuiltIn(data.isBuiltIn);
        setTransportMode(data.transportMode as any);
        setCurrentRouteId(data.id);
        setCurrentRouteName(data.name);
        setHasChanges(false);

        // Перетворюємо зупинки з бекенду назад у формат для мапи
        const loadedItinerary = data.stops.map((stop: any, index: number) => ({
          uniqueId: `url-${Date.now()}-${index}`, 
          id: stop.placeId,
          placeId: stop.placeId,
          name: stop.name,
          address: stop.address,
          category: stop.category,
          longitude: stop.longitude,
          latitude: stop.latitude
        }));
        
        setItinerary(loadedItinerary);

        // Перелітаємо камерою до першої точки маршруту (якщо вона є)
        if (loadedItinerary.length > 0) {
          flyTo(loadedItinerary[0].longitude, loadedItinerary[0].latitude);
        }
      }
    } catch (error) {
      console.error("Помилка завантаження збереженого маршруту:", error);
    }
  };

  useEffect(() => {
    const fetchRoute = async () => {
      if (itinerary.length < 2) {
        setRouteData(null);
        setRouteSummary(null);
        return;
      }

      const coordinates = itinerary.map(item => `${item.longitude},${item.latitude}`).join(';');
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      
      const mapboxProfile = {
        car: 'driving',
        foot: 'walking',
        bike: 'cycling'
      }[transportMode];

      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/${mapboxProfile}/${coordinates}?geometries=geojson&overview=full&access_token=${token}`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          setRouteData(route.geometry);
          
          setRouteSummary({
            distance: route.distance,
            duration: route.duration
          });
        }
      } catch (error) {
        console.error("Помилка побудови маршруту:", error);
      }
    };

    fetchRoute();
    
  }, [itinerary, transportMode]);

  // 🚀 ЗАВАНТАЖЕННЯ МАРШРУТУ З URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const routeIdParam = urlParams.get('routeId');
    const publicRouteIdParam = urlParams.get('publicRouteId'); // 🚀 ШУКАЄМО ПУБЛІЧНИЙ ЛІНК

    // Якщо це мій власний маршрут (через профіль)
    if (routeIdParam) {
      loadRouteFromUrl(routeIdParam);
      window.history.replaceState({}, document.title, window.location.pathname);
    } 
    // Якщо це публічний лінк від когось іншого
    else if (publicRouteIdParam) {
      loadPublicRouteFromUrl(publicRouteIdParam);
    }
  }, []);

  const loadPublicRouteFromUrl = async (id: string) => {
    try {
      // 🚀 Звертаємося до відкритого ендпоінта БЕЗ токена
      const response = await fetch(`http://localhost:8080/api/route/public/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Вмикаємо режим "тільки читання", як для ідей
        setIsBuiltIn(true); 
        
        setTransportMode(data.transportMode as any);
        setCurrentRouteName(data.name);
        setCurrentRouteDescription(data.description || "");
        
        const loadedItinerary = data.stops.map((stop: any) => ({
          placeId: stop.placeId,
          name: stop.name,
          address: stop.address,
          category: stop.category,
          longitude: stop.longitude,
          latitude: stop.latitude
        }));
        
        setItinerary(loadedItinerary);
        setHasChanges(false);
      } else {
        toast.error("Цей маршрут не існує або був видалений.");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error("Error loading public route:", error);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // 🚀 Функція завантаження обраної ідеї на мапу
  const loadIdeaRoute = async (routeId: number) => {
    const jwtToken = localStorage.getItem('token');
    if (!jwtToken) return;

    try {
      const response = await fetch(`http://localhost:8080/api/route/${routeId}`, {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        setTransportMode(data.transportMode as any);
        setCurrentRouteId(data.id); 
        setCurrentRouteName(data.name);
        setCurrentRouteDescription(data.description || "");
        setHasChanges(false);
        setIsBuiltIn(true);
        
        const loadedItinerary = data.stops.map((stop: any, index: number) => ({
          uniqueId: `idea-${Date.now()}-${index}`, // ✅ Додаємо унікальний ключ
          placeId: stop.placeId,
          id: stop.placeId,
          name: stop.name,
          address: stop.address,
          category: stop.category,
          longitude: stop.longitude,
          latitude: stop.latitude
        }));
        
        setItinerary(loadedItinerary);
        
        if (loadedItinerary.length > 0) {
          flyTo(loadedItinerary[0].longitude, loadedItinerary[0].latitude);
        }
        
        // Перемикаємось назад на вкладку створення, щоб показати точки
        setActiveSidebarTab('create');
      }
    } catch (error) {
      console.error("Помилка завантаження детального маршруту:", error);
    }
  };

  const handleMapClick = async (event: MapLayerMouseEvent) => {
    try {
      const map = event.target;
      if (!map || !event.point) return;

      const padding = 15;
      const bbox: [mapboxgl.PointLike, mapboxgl.PointLike] = [
        [event.point.x - padding, event.point.y - padding],
        [event.point.x + padding, event.point.y + padding]
      ];

      const existingLayers = map.getStyle()?.layers?.map(layer => layer.id) || [];
      const desiredLayers = ['poi-label', 'landmark-label', 'natural-point-label', 'transit-label'];
      const validLayers = desiredLayers.filter(layerId => existingLayers.includes(layerId));

      let features: mapboxgl.MapboxGeoJSONFeature[] = [];
      if (validLayers.length > 0) {
        features = map.queryRenderedFeatures(bbox, { layers: validLayers });
      }

      let placeName = "";
      let address = "Пам'ятка на мапі";
      let category = "Об'єкт";
      let finalLng = event.lngLat.lng;
      let finalLat = event.lngLat.lat;
      let placeId = Date.now().toString();
      let isPoi = false; // Прапорець, який покаже, чи це пам'ятка, чи довільна точка

      // 1. ПЕРЕВІРЯЄМО, ЧИ ВЛУЧИЛИ В ПАМ'ЯТКУ
      if (features && features.length > 0 && (features[0].properties?.name_uk || features[0].properties?.name)) {
        const feature = features[0];
        placeName = feature.properties?.name_uk || feature.properties?.name;
        category = feature.properties?.category_en || "Пам'ятка";
        isPoi = true;

        const rawCategory = feature.properties?.category_en || feature.properties?.type || feature.properties?.maki || "attraction";
        category = getTranslatedCategory(rawCategory);

        if (feature.geometry && feature.geometry.type === 'Point') {
          const coords = feature.geometry.coordinates as [number, number];
          finalLng = coords[0];
          finalLat = coords[1];
        }
        placeId = feature.id?.toString() || Date.now().toString();
      } 
      // 2. ЯКЩО НЕ ВЛУЧИЛИ — БЕРЕМО ДОВІЛЬНУ ТОЧКУ ЧЕРЕЗ АДРЕСУ
      else {
        const token = import.meta.env.VITE_MAPBOX_TOKEN;
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${finalLng},${finalLat}.json?access_token=${token}&language=uk&limit=1`);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          placeName = data.features[0].text;
          address = data.features[0].place_name;
          category = "Точка на мапі";
        } else {
          placeName = "Невідома локація";
          address = `Координати: ${finalLng.toFixed(5)}, ${finalLat.toFixed(5)}`;
          category = "Координати";
        }
      }

      // 3. ВІДКРИВАЄМО ВІКНО У БУДЬ-ЯКОМУ ВИПАДКУ
      setSelectedPlace({
        placeId: placeId, // 🚀 БУЛО id: placeId
        name: placeName,
        address: address,
        category: category,
        longitude: finalLng,
        latitude: finalLat
      });

      // 4. ВІКІПЕДІЮ ЗАВАНТАЖУЄМО ТІЛЬКИ ДЛЯ СПРАВЖНІХ ПАМ'ЯТОК
      const googleKey = import.meta.env.VITE_GOOGLE_PLACES_KEY;
      let photoUrl = undefined;

      if (googleKey && placeName) {
        try {
          // Construct the best search query (Name + Address usually yields the exact place)
          const searchQuery = isPoi ? `${placeName}, ${address}` : placeName;

          // Request to Google Places API (New)
          const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': googleKey,
              'X-Goog-FieldMask': 'places.photos' // We only ask for photos to save data/money
            },
            body: JSON.stringify({
              textQuery: searchQuery,
              languageCode: 'uk'
            })
          });

          const searchData = await searchRes.json();

          // Check if Google found the place and if it has photos
          if (searchData.places && searchData.places.length > 0 && searchData.places[0].photos?.length > 0) {
            // Get the reference name of the first photo
            const photoName = searchData.places[0].photos[0].name; 
            
            // Construct the final URL to fetch the actual image (max width/height 400px is enough for popup)
            photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=400&key=${googleKey}`;
          }
        } catch (error) {
          console.error("Error fetching photo from Google:", error);
        }
      }

      // Update the popup state with the image
      setSelectedPlace(prev => {
        if (prev && prev.placeId === placeId) {
          return { ...prev, imageUrl: photoUrl };
        }
        return prev;
      });

    } catch (error) {
      console.error("Помилка обробки кліку:", error);
    }
  };

  const addToItinerary = () => {
    if (!selectedPlace) return;
    if (isBuiltIn) {
      toast.error("Це вбудований маршрут. Створіть новий для редагування!");
      return;
    }
    const newItem = {
      ...selectedPlace,
      uniqueId: Date.now().toString() + Math.random().toString(36).substr(2, 5), 
      placeId: selectedPlace.placeId // 🚀 БУЛО selectedPlace.id || selectedPlace.placeId
    };
    setItinerary([...itinerary, newItem]);
    setSelectedPlace(null);
    setHasChanges(true);
  };

  const removeFromItinerary = (uniqueIdToRemove: string) => { // ✅
    setItinerary(itinerary.filter(item => item.uniqueId !== uniqueIdToRemove));
    setHasChanges(true);
  };

  // 1. Функція, яка спрацьовує, коли користувач друкує текст
  const handleSearchInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Починаємо шукати тільки якщо введено хоча б 3 символи
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    try {
      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&language=uk&session_token=${sessionToken}&access_token=${token}`
      );
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Помилка пошуку:", error);
    }
  };

  // 2. Функція, яка спрацьовує, коли користувач клікає на підказку
  const handleSuggestionClick = async (suggestion: any) => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}?session_token=${sessionToken}&access_token=${token}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.geometry.coordinates;

        // Перелітаємо на мапі до знайденого місця
        flyTo(lng, lat);

        // Відкриваємо попап з цим місцем
        setSelectedPlace({
          placeId: feature.properties.mapbox_id, // 🚀 БУЛО id: feature.properties.mapbox_id
          name: feature.properties.name || suggestion.name,
          address: feature.properties.place_formatted || feature.properties.full_address || "Адреса не вказана",
          category: "Знайдено в пошуку",
          longitude: lng,
          latitude: lat
        });

        // Очищаємо пошук і генеруємо новий токен для наступної сесії
        setSearchQuery("");
        setSuggestions([]);
        setSessionToken(crypto.randomUUID());
      }
    } catch (error) {
      console.error("Помилка отримання деталей місця:", error);
    }
  };

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    // Робимо копію нашого масиву маршруту
    const _itinerary = [...itinerary];
    
    // Вирізаємо елемент, який тягнули
    const draggedItemContent = _itinerary.splice(dragItem.current, 1)[0];
    
    // Вставляємо його на нове місце
    _itinerary.splice(dragOverItem.current, 0, draggedItemContent);
    
    // Скидаємо індекси і оновлюємо стан
    dragItem.current = null;
    dragOverItem.current = null;
    setItinerary(_itinerary);
    setHasChanges(true);
  };

  // Стиль для лінії маршруту
  const routeLayerStyle: any = {
    id: 'route-layer',
    type: 'line',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#2563eb', // Синій колір (tailwind blue-600)
      'line-width': 5,
      'line-opacity': 0.8
    }
  };

  const formatCount = (value: number, one: string, few: string, many: string) => {
    const mod10 = value % 10;
    const mod100 = value % 100;

    if (mod10 === 1 && mod100 !== 11) return `${value} ${one}`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${value} ${few}`;
    return `${value} ${many}`;
  };

  // Перетворюємо секунди в коректний український формат тривалості
  const formatDuration = (seconds: number) => {
    const totalMinutes = Math.round(seconds / 60);
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const hoursText = formatCount(hours, 'година', 'години', 'годин');
      if (minutes > 0) {
        const minutesText = formatCount(minutes, 'хвилина', 'хвилини', 'хвилин');
        return `${hoursText} ${minutesText}`;
      }
      return hoursText;
    }
    return formatCount(totalMinutes, 'хвилина', 'хвилини', 'хвилин');
  };

  const formatDurationCompact = (seconds: number) => {
    const totalMinutes = Math.round(seconds / 60);
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return minutes > 0 ? `${hours} год ${minutes} хв` : `${hours} год`;
    }
    return `${totalMinutes} хв`;
  };

  // Перетворюємо метри в "X км"
  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} м`;
    return `${(meters / 1000).toFixed(1)} км`;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login'); 
};

  const handleSaveRoute = async () => {
    if (itinerary.length < 2 || !routeSummary) return;

    let finalRouteName = currentRouteName;

    if (!currentRouteName.trim()) {
      toast.error("Будь ласка, введіть назву маршруту!");
      return; 
    }

    const routeDataToSave = {
      name: finalRouteName, // 🚀 ВИКОРИСТОВУЄМО ПРАВИЛЬНУ НАЗВУ
      transportMode: transportMode,
      distance: routeSummary.distance,
      duration: routeSummary.duration,
      description: currentRouteDescription,
      stops: itinerary.map((item, index) => ({
        placeId: item.placeId,
        name: item.name,
        address: item.address,
        category: item.category,
        longitude: item.longitude,
        latitude: item.latitude,
        stopOrder: index + 1
      }))
    };

    try {
      const jwtToken = localStorage.getItem('token'); 
      
      // 🚀 ВИРІШУЄМО, ЯКИЙ ЗАПИТ РОБИТИ
      const isUpdating = currentRouteId !== null;
      const url = isUpdating 
        ? `http://localhost:8080/api/route/${currentRouteId}` 
        : 'http://localhost:8080/api/route';
      
      const method = isUpdating ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify(routeDataToSave)
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token'); // Видаляємо недійсний токен
        toast.error("Час сесії вийшов. Будь ласка, увійдіть знову.");
        //window.location.href = '/login'; // Або navigate('/login'), якщо використовуєш хук
        return;
      }

      if (response.ok) {
        toast.success(isUpdating ? "Маршрут успішно оновлено!" : "Маршрут успішно збережено!");
        setHasChanges(false); // Скидаємо прапорець змін, щоб сховати кнопку
      } else {
        toast.error("Помилка при збереженні маршруту");
      }
    } catch (error) {
      console.error("Помилка мережі:", error);
    }
  };

  const handleOpenInGoogleMaps = () => {
    if (itinerary.length < 2) return;

    const formatPoint = (item: PlaceInfo) => {
      // 🚀 Перевіряємо, чи адреса є заглушкою
      const isPlaceholder = 
        !item.address || 
        item.address === "Пам'ятка на мапі" || 
        item.address.startsWith("Координати:");

      if (isPlaceholder) {
        // Якщо справжньої адреси немає — віддаємо Google голі координати
        return `${item.latitude},${item.longitude}`;
      } else {
        // Якщо адреса нормальна — формуємо красивий текстовий запит
        const query = `${item.name}, ${item.address}`;
        return encodeURIComponent(query);
      }
    };

    // Використовуємо нашу розумну функцію для всіх точок
    const origin = formatPoint(itinerary[0]);
    const destination = formatPoint(itinerary[itinerary.length - 1]);

    const waypointsArray = itinerary.slice(1, -1).map(formatPoint);
    const waypointsParam = waypointsArray.length > 0 ? `&waypoints=${waypointsArray.join('|')}` : '';

    const travelModeMap = {
      foot: 'walking',
      bike: 'bicycling',
      car: 'driving'
    };
    
    const gmapsMode = travelModeMap[transportMode as keyof typeof travelModeMap];

    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsParam}&travelmode=${gmapsMode}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 🚀 СЛОВНИК КАТЕГОРІЙ
  const categoryTranslations: Record<string, string> = {
    'restaurant': 'Ресторан',
    'cafe': 'Кафе',
    'coffee': 'Кав\'ярня',
    'bar': 'Бар',
    'pub': 'Паб',
    'museum': 'Музей',
    'gallery': 'Галерея',
    'park': 'Парк',
    'garden': 'Сад',
    'hotel': 'Готель',
    'hostel': 'Хостел',
    'monument': 'Пам\'ятник',
    'historic': 'Історична пам\'ятка',
    'castle': 'Замок',
    'church': 'Церква',
    'place of worship': 'Храм',
    'attraction': 'Цікавинка',
    'tourism': 'Туризм',
    'theatre': 'Театр',
    'cinema': 'Кінотеатр',
    'shop': 'Магазин',
    'supermarket': 'Супермаркет',
    'bakery': 'Пекарня',
    'bus': 'Зупинка',
    'transit': 'Транспорт'
  };

  const getTranslatedCategory = (englishCategory: string) => {
    if (!englishCategory) return "Пам'ятка";
    const lower = englishCategory.toLowerCase();
    
    // Шукаємо точний збіг
    if (categoryTranslations[lower]) return categoryTranslations[lower];
    
    // Шукаємо частковий збіг (іноді Mapbox віддає списки типу "food, restaurant")
    for (const [eng, ukr] of Object.entries(categoryTranslations)) {
      if (lower.includes(eng)) return ukr;
    }
    
    return "Локація"; // Якщо категорія зовсім невідома
  };

// Smart route optimization using Mapbox Optimization API
  const optimizeRoute = async () => {
    if (itinerary.length < 3) {
      toast.error("Для оптимізації потрібно хоча б 3 точки!");
      return;
    }
    if (itinerary.length > 12) {
      toast.error("На жаль, алгоритм підтримує оптимізацію максимум для 12 точок одночасно.");
      return;
    }

    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    const mapboxProfile = {
      car: 'driving',
      foot: 'walking',
      bike: 'cycling'
    }[transportMode];

    const coordinates = itinerary.map(item => `${item.longitude},${item.latitude}`).join(';');

    try {
      // 🚀 Завжди фіксуємо старт і фініш, як того вимагає Mapbox
      const response = await fetch(
        `https://api.mapbox.com/optimized-trips/v1/mapbox/${mapboxProfile}/${coordinates}?source=first&destination=last&roundtrip=false&access_token=${token}`
      );
      const data = await response.json();

      if (data.code !== 'Ok') {
        toast.error("Помилка оптимізації: " + (data.message || "Невідома помилка"));
        return;
      }

      const optimizedItinerary = data.waypoints.map((wp: any) => itinerary[wp.waypoint_index]);
      
      setItinerary(optimizedItinerary);
      setHasChanges(true);
      
    } catch (error) {
      console.error("Optimization error:", error);
      toast.error("Сталася помилка при оптимізації.");
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col-reverse lg:flex-row">
      
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-[1001] bg-white/90 backdrop-blur-sm border-b border-gray-100 p-4 flex items-center justify-between lg:hidden shadow-sm">
          <h1 className="text-xl font-bold text-blue-600">Vandry</h1>
          <button onClick={toggleSidebar} className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
      </header>

      {/* Sidebar */}
      <aside className={`
          fixed inset-y-0 left-0 z-[2000] w-[90%] max-w-sm bg-white border-r border-gray-100 
          flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:absolute lg:top-4 lg:left-4 lg:z-[1000] lg:w-80 lg:max-h-[95vh] lg:h-auto
          lg:bg-white/90 lg:backdrop-blur-md lg:rounded-2xl lg:border lg:border-gray-200 lg:translate-x-0 lg:max-w-none lg:shadow-2xl
      `}>
        <div className="p-5 border-b border-gray-100 mt-16 lg:mt-0 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Vandry</h1>
          <button onClick={toggleSidebar} className="lg:hidden text-gray-400 p-1"><X size={20} /></button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          
          {/* 🚀 1. ГОЛОВНІ ВКЛАДКИ (Створити / Ідеї) */}
          <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
            <button 
              onClick={() => setActiveSidebarTab('create')} 
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeSidebarTab === 'create' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Мій маршрут
            </button>
            <button 
              onClick={() => setActiveSidebarTab('ideas')} 
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeSidebarTab === 'ideas' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Ідеї подорожей
            </button>
          </div>

          {/* ========================================= */}
          {/* 🚀 2. ВКЛАДКА "МІЙ МАРШРУТ" (Твій старий код) */}
          {/* ========================================= */}
          {activeSidebarTab === 'create' && (
            <>
              {/* Блок пошуку */}
              <div className="relative">
                <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={handleSearchInput}
                  placeholder="Шукати місто, готель, пам'ятку..." 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                />
                
                {/* Випадаючий список підказок */}
                {suggestions.length > 0 && (
                  <ul className="absolute z-[2001] top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion) => (
                      <li 
                        key={suggestion.mapbox_id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors flex flex-col"
                      >
                        <span className="font-bold text-gray-800 text-sm">{suggestion.name}</span>
                        <span className="text-xs text-gray-500 truncate">{suggestion.place_formatted || suggestion.full_address}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Мій Маршрут</h3>
                
                {/* Transport mode selector */}
                <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                  <button
                    onClick={() => setTransportMode('foot')}
                    disabled={isBuiltIn} // 🚀 БЛОКУЄМО КНОПКУ
                    className={`flex-1 flex justify-center py-2 rounded-lg transition-all ${
                      transportMode === 'foot' 
                        ? 'bg-white shadow-sm text-blue-600 font-bold' 
                        : 'text-gray-400 hover:text-gray-600'
                    } disabled:opacity-60 disabled:cursor-not-allowed`} // 🚀 ДОДАЄМО СТИЛІ ДЛЯ ВИМКНЕНОГО СТАНУ
                  >
                    <Footprints size={18} />
                  </button>
                  <button
                    onClick={() => setTransportMode('bike')}
                    disabled={isBuiltIn} // 🚀 БЛОКУЄМО КНОПКУ
                    className={`flex-1 flex justify-center py-2 rounded-lg transition-all ${
                      transportMode === 'bike' 
                        ? 'bg-white shadow-sm text-blue-600 font-bold' 
                        : 'text-gray-400 hover:text-gray-600'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <Bike size={18} />
                  </button>
                  <button
                    onClick={() => setTransportMode('car')}
                    disabled={isBuiltIn} // 🚀 БЛОКУЄМО КНОПКУ
                    className={`flex-1 flex justify-center py-2 rounded-lg transition-all ${
                      transportMode === 'car' 
                        ? 'bg-white shadow-sm text-blue-600 font-bold' 
                        : 'text-gray-400 hover:text-gray-600'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <Car size={18} />
                  </button>
                </div>

                {/* Блок з підсумками маршруту (Час і Відстань) */}
                {routeSummary && itinerary.length >= 2 && (
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center justify-between bg-blue-50/50 border border-blue-100 p-3 rounded-xl text-sm shadow-sm">
                      <div className="flex items-center gap-2 text-blue-800 font-medium">
                        <Navigation size={16} className="text-blue-500" />
                        <span>{formatDistance(routeSummary.distance)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-800 font-medium">
                        <Clock size={16} className="text-blue-500" />
                        <span>{formatDuration(routeSummary.duration)}</span>
                      </div>
                    </div>

                    {/* Поля вводу для Назви та Опису */}
                    <div className="flex flex-col gap-2 my-2">
                      {isBuiltIn ? (
                        // 🚀 ВІДОБРАЖЕННЯ ДЛЯ ВБУДОВАНИХ МАРШРУТІВ (ТІЛЬКИ ЧИТАННЯ)
                        <div className="px-1 py-2">
                          <h2 className="text-xl font-black text-gray-800 mb-2">
                            {currentRouteName}
                          </h2>
                          {currentRouteDescription && (
                            <p className="text-sm text-gray-600 italic leading-relaxed border-l-2 border-blue-200 pl-3">
                              {currentRouteDescription}
                            </p>
                          )}
                        </div>
                      ) : (
                        // 🚀 ВІДОБРАЖЕННЯ ДЛЯ ВЛАСНИХ МАРШРУТІВ (РЕДАГУВАННЯ)
                        <>
                          <input
                            type="text"
                            placeholder="Назва маршруту (напр. Замки Львівщини)"
                            value={currentRouteName}
                            onChange={(e) => {
                              setCurrentRouteName(e.target.value);
                              setHasChanges(true);
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-bold text-gray-800"
                          />
                          <textarea
                            placeholder="Додайте опис: що цікавого на цьому маршруті?"
                            value={currentRouteDescription}
                            onChange={(e) => {
                              setCurrentRouteDescription(e.target.value);
                              setHasChanges(true);
                            }}
                            rows={4}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm text-gray-600 resize-y min-h-[100px]"
                          />
                        </>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                      
                      {/* 1. Кнопка "Взяти за основу" ТІЛЬКИ для вбудованих */}
                      {isBuiltIn && (
                        <button 
                          onClick={() => {
                            setCurrentRouteId(null);
                            setIsBuiltIn(false);
                            setHasChanges(true);
                          }}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex flex-row items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                          <span>Взяти за основу (редагувати)</span>
                        </button>
                      )}

                      {itinerary.length >= 3 && !isBuiltIn && (
                        <button 
                          onClick={optimizeRoute}
                          className="w-full py-2.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-bold rounded-xl flex flex-row items-center justify-center gap-2 transition-colors shadow-sm mt-2"
                        >
                          <Wand2 className="w-5 h-5 flex-shrink-0" /> 
                          <span>Оптимізувати порядок точок</span>
                        </button>
                      )}

                      {/* 2. Кнопка "Зберегти" ТІЛЬКИ для власних (якщо є зміни) */}
                      {(!currentRouteId || hasChanges) && !isBuiltIn && (
                        <button 
                          onClick={handleSaveRoute}
                          className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl flex flex-row items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                          <Save className="w-5 h-5 flex-shrink-0" /> 
                          <span>{currentRouteId ? "Оновити маршрут" : "Зберегти маршрут"}</span>
                        </button>
                      )}

                      {/* 3. Кнопка "Google Maps" ДЛЯ ВСІХ */}
                      <button 
                        onClick={handleOpenInGoogleMaps}
                        className="w-full py-2.5 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold rounded-xl flex flex-row items-center justify-center gap-2 transition-colors shadow-sm"
                      >
                        <Navigation className="w-5 h-5 flex-shrink-0" /> 
                        <span>Почати рух в Google Maps</span>
                      </button>

                      {currentRouteId && !hasChanges && (
                        <button 
                          onClick={() => {
                            const shareUrl = `${window.location.origin}/map?publicRouteId=${currentRouteId}`;
                            navigator.clipboard.writeText(shareUrl);
                            toast.success("Лінк скопійовано в буфер обміну!");
                          }}
                          className="w-full py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold rounded-xl flex flex-row items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                          <Share2 className="w-5 h-5 flex-shrink-0" /> 
                          <span>Поділитися маршрутом</span>
                        </button>
                      )}

                      {/* 4. 🚀 Кнопка "Очистити" ТЕПЕР ДЛЯ ВСІХ */}
                      <button 
                        onClick={() => {
                          if (window.confirm("Видалити поточні точки і почати новий маршрут?")) {
                            setItinerary([]);
                            setCurrentRouteId(null);
                            setCurrentRouteName("");
                            setCurrentRouteDescription("");
                            setIsBuiltIn(false);
                            setHasChanges(false);
                          }
                        }}
                        className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex flex-row items-center justify-center gap-2 transition-colors shadow-sm"
                      >
                        <span>Почати з чистого аркуша</span>
                      </button>

                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  {itinerary.length === 0 ? (
                    <div className="text-center py-10 px-4">
                        <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <MapPin className="text-blue-300" size={24} />
                        </div>
                        <p className="text-sm text-gray-400 italic">Оберіть цікаве місце на мапі, щоб почати подорож</p>
                    </div>
                  ) : (
                    itinerary.map((item, index) => (
                      <div 
                        key={item.uniqueId}
                        draggable={!isBuiltIn} 
                        onDragStart={() => (dragItem.current = index)} 
                        onDragEnter={() => (dragOverItem.current = index)} 
                        onDragEnd={handleSort} 
                        onDragOver={(e) => e.preventDefault()} 
                        onClick={() => flyTo(item.longitude, item.latitude)}
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
                              onClick={(e) => { e.stopPropagation(); removeFromItinerary(item.uniqueId!); }}
                              className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-opacity"
                          >
                              <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* ========================================= */}
          {/* 🚀 3. ВКЛАДКА "ІДЕЇ ПОДОРОЖЕЙ" (Новий код) */}
          {/* ========================================= */}
          {activeSidebarTab === 'ideas' && (
            <div className="flex flex-col gap-4">
              
              {/* Під-вкладки для транспорту в Ідеях */}
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

              {/* Список карток вбудованих маршрутів */}
              <div className="flex flex-col gap-3">
                {builtInRoutes
                  .filter(route => route.transportMode === ideaMode)
                  .map(route => (
                    <div 
                      key={route.id}
                      onClick={() => loadIdeaRoute(route.id)}
                      className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                      <h3 className="font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{route.name}</h3>
                      {route.description && (
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2 italic">
                          {route.description}
                        </p>
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
                
                {/* Якщо маршрутів немає */}
                {builtInRoutes.filter(route => route.transportMode === ideaMode).length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm font-medium">
                    Поки немає ідей для цього типу транспорту 🥲
                  </div>
                )}
              </div>
            </div>
          )}
          
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/30 rounded-b-2xl">
          {/* Кнопка переходу в профіль */}
          <button 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition font-bold text-sm bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"
          >
            <User size={18} /> Профіль
          </button>
          
          <button 
            onClick={handleLogout}
            className="text-red-400 hover:text-red-600 transition flex items-center gap-2 text-sm font-bold"
          >
            <LogOut size={18} /> Вийти
          </button>
        </div>
      </aside>
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div onClick={toggleSidebar} className="fixed inset-0 bg-black/40 z-[1999] lg:hidden"></div>
      )}

      {/* Main Map Container */}
      <div className="absolute inset-0 pt-[72px] lg:pt-0 bg-gray-200 z-0">
        <Map
          {...viewState}
          onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
          onLoad={(evt) => evt.target.setLanguage('uk')}
          onClick={handleMapClick}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
        >
          {routeData && (
            <Source id="route-source" type="geojson" data={routeData}>
              <Layer {...routeLayerStyle} />
            </Source>
          )}
          <GeolocateControl position="top-right" trackUserLocation={true} />
          <NavigationControl position="top-right" />

          {/* Render markers for each item in the itinerary */}
         {itinerary.map((item, index) => (
            <Marker key={item.uniqueId} longitude={item.longitude} latitude={item.latitude} anchor="bottom"> 
              <div className="flex flex-col items-center group cursor-pointer drop-shadow-lg">
                <div className="bg-white px-2 py-1 rounded-md shadow-md text-[10px] font-bold mb-1 border border-blue-100 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 whitespace-nowrap">
                    {item.name}
                </div>
                <div className="relative transform transition-transform group-hover:scale-110">
                    <MapPin size={34} className="text-blue-600" fill="white" />
                    <span className="absolute top-1.5 left-0 right-0 text-[10px] font-black text-center text-blue-700">
                        {index + 1}
                    </span>
                </div>
              </div>
            </Marker>
          ))}

          {/* Place Selection Popup */}
          {selectedPlace && (
            <Popup
              longitude={selectedPlace.longitude}
              latitude={selectedPlace.latitude}
              anchor="bottom"
              onClose={() => setSelectedPlace(null)}
              closeButton={true}
              closeOnClick={false}
              className="
                z-[1001] min-w-[280px] 
                [&_.mapboxgl-popup-close-button]:!text-2xl 
                [&_.mapboxgl-popup-close-button]:!w-8 
                [&_.mapboxgl-popup-close-button]:!h-8 
                [&_.mapboxgl-popup-close-button]:!text-gray-400 
                hover:[&_.mapboxgl-popup-close-button]:!text-gray-800 
                hover:[&_.mapboxgl-popup-close-button]:!bg-gray-100 
                [&_.mapboxgl-popup-close-button]:!transition-colors
                [&_.mapboxgl-popup-close-button]:!rounded-bl-xl"
            >
              <div className="p-1 text-gray-800">
                <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] uppercase font-black rounded-full tracking-tighter">
                        {selectedPlace.category}
                    </span>
                </div>
                <h3 className="text-lg font-bold mb-1 leading-tight text-gray-900 border-b border-gray-100 pb-1">
                  {selectedPlace.name}
                </h3>
                {selectedPlace.imageUrl && (
                  <div className="mt-2 mb-1 w-full h-32 overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
                    <img 
                      src={selectedPlace.imageUrl} 
                      alt={selectedPlace.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-start gap-1 mb-4">
                    <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-gray-400 leading-tight italic">{selectedPlace.address}</p>
                </div>
                <button 
                  className="w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 active:scale-[0.98]"
                  onClick={addToItinerary}
                >
                  Додати в подорож
                </button>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
};

export default MapPage;