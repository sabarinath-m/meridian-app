import Geolocation from '@react-native-community/geolocation';

export interface GpsCoords {
  lat: number;
  lng: number;
}

// One fix per inspection at creation time — the spec calls for "GPS
// tagging of each inspection", not continuous tracking, so there's no
// watchPosition subscription to manage/tear down here.
export function captureGps(): Promise<GpsCoords> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position =>
        resolve({lat: position.coords.latitude, lng: position.coords.longitude}),
      error => reject(error),
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  });
}
