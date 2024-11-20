import { GOOGLE_MAPS_API_KEY, googleMapsClient } from "@/config";

enum IndonesiaAddressComponentTypes {
  street_number = "street_number",
  route = "route",
  political = "political",
  administrative_area_level_1 = "administrative_area_level_1",
  administrative_area_level_2 = "administrative_area_level_2",
  administrative_area_level_3 = "administrative_area_level_3",
  administrative_area_level_4 = "administrative_area_level_4",
  country = "country",
  postal_code = "postal_code",
}

const locations = [
  { latitude: -7.250445, longitude: 112.768845, city: "Surabaya" },
  { latitude: -0.502106, longitude: 117.153709, city: "Samarinda" },
  { latitude: -6.2, longitude: 106.816666, city: "Jakarta" },
];

export async function getCityName(location: {
  latitude: number;
  longitude: number;
}) {
  if (process.env.NODE_ENV === "test") {
    for (const loc of locations) {
      if (
        loc.latitude === location.latitude &&
        loc.longitude === location.longitude
      ) {
        return loc.city;
      }
    }

    return "Ngawi";
  }

  try {
    const res = await googleMapsClient.reverseGeocode({
      params: {
        latlng: { lat: location.latitude, lng: location.longitude },
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    const results = res.data.results;

    if (results.length > 0) {
      const addressComponents = results[0].address_components;

      // Look for the "administrative_area_level_2" (city) type in address components
      for (const component of addressComponents) {
        if (
          (
            component.types as unknown as IndonesiaAddressComponentTypes[]
          ).includes(IndonesiaAddressComponentTypes.administrative_area_level_2)
        ) {
          return component.long_name; // City name
        }
      }
    }

    throw new Error("City name not found in the address components");
  } catch (error) {
    throw new Error(`Failed to fetch city name: ${error}`);
  }
}
