import React, { useEffect, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { IPointLocation } from "@/app/(tabs)/path";

const GoogleMaps = ({ setEndLocation, setStartLocation, routeCoords }: { setEndLocation: any, setStartLocation: any, routeCoords: any }) => {
    const [location, setLocation] = useState(null);


    useEffect(() => {
        const getLocation = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Denied", "Location access is required.");
                return;
            }

            // Get current location
            let userLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
            });
            setLocation(userLocation.coords);
            setStartLocation({
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude
            });
            setEndLocation({
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude
            });

            // Watch for location changes
            const locationWatcher = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
                (newLocation: any) => {
                    setLocation(newLocation.coords);
                }
            );

            return () => locationWatcher.remove(); // Cleanup on unmount
        };

        getLocation();
    }, []);

    return (
        <View style={styles.container}>
            {location &&
                <MapView
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    showsUserLocation={true}
                    followsUserLocation={true}
                    initialRegion={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }}
                >
                    <Marker
                        coordinate={location}
                        draggable // Makes marker draggable
                        onDragEnd={(e) => setStartLocation(e.nativeEvent.coordinate)} // Updates state
                        title="Drag Me"
                    />
                    <Marker
                        coordinate={location}
                        draggable // Makes marker draggable
                        onDragEnd={(e) => setEndLocation(e.nativeEvent.coordinate)} // Updates state
                        title="Drag Me"
                    />
                    {routeCoords.length > 0 && (
                        <Polyline
                            coordinates={routeCoords}
                            strokeWidth={4}
                            strokeColor="blue"
                        />
                    )}
                </MapView>
            }
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: "100%", height: "100%" },
});

export default GoogleMaps;
