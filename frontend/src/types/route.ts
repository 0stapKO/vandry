export interface PlaceInfo {
  placeId: string;
  uniqueId?: string;
  name: string;
  address: string;
  category?: string;
  imageUrl?: string;
  longitude: number;
  latitude: number;
}

export interface RouteSummaryData {
  distance: number;
  duration: number;
}