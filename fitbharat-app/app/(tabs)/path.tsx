import GoogleMaps from '@/components/googleMaps';
import { Colors } from '@/constants/Colors';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface IPointLocation {
  latitude: number;
  longitude: number;
}



export default function Path() {
  const [routeCoords, setRouteCoords] = useState<Location[]>([]);
  const [startLocation, setStartLocation] = useState<IPointLocation>({
    latitude: 28.6139,
    longitude: 77.2090,
  });
  const [endLocation, setEndLocation] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
  });

  const fetchRoute = async () => {
    const osrmUrl = `https://router.project-osrm.org/route/v1/walking/${startLocation.longitude},${startLocation.latitude};${endLocation.longitude},${endLocation.latitude}?steps=true&overview=full&geometries=geojson`;

    try {
      const response = await fetch(osrmUrl);
      const data = await response.json();

      if (data.code === "Ok") {
        const coordinates = data.routes[0].geometry.coordinates.map(
          ([longitude, latitude]: [number, number]) => ({ latitude, longitude })
        );
        setRouteCoords(coordinates);
      } else {
        console.error("OSRM Error:", data.message);
      }
    } catch (error) {
      console.error("Failed to fetch route:", error);
    }
  };

  return (
    <View style={styles.Container}>
      <GoogleMaps setEndLocation={setEndLocation} setStartLocation={setStartLocation} routeCoords={routeCoords} />
      <SafeAreaView style={styles.titleContainer}>
        <View style={styles.container}>
          <View style={styles.inputbox}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="radio-button-checked" size={20} color="#3498db" />
              <TextInput
                placeholder="Your location"
                placeholderTextColor="#3498db"
                style={[styles.input, { color: "#3498db" }]}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color="#e74c3c" />
              <TextInput
                placeholder="Choose destination"
                placeholderTextColor="#aaa"
                style={styles.input}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.swapButton} onPress={fetchRoute}>
            <MaterialIcons name="swap-vert" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}


const styles = StyleSheet.create({
  Container: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    position: 'absolute',
    width: '100%',
  },
  text: {
    backgroundColor: 'green'
  },
  container: {
    width: "100%",
    flexDirection: "row",
    padding: 10,
    justifyContent: "space-around",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Colors.dark.background}`, // Input field background
    padding: 5,
    borderRadius: 8,
    marginVertical: 5,
    overflow: "hidden"
  },
  inputbox: {
    width: "80%",
  },
  input: {
    width: "100%",
    marginLeft: 10,
    color: "#fff",
    fontSize: 16,
  },
  swapButton: {
    width: 40,
    height: 40,
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#666",
    padding: 5,

  },

});
