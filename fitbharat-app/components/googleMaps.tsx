import React, { useEffect, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";

const GoogleMaps = () => {
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
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                showsUserLocation={true}
                followsUserLocation={true}
                initialRegion={{
                    latitude: location?.latitude || 28.6139, // Default to New Delhi
                    longitude: location?.longitude || 77.2090,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
            >
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: "100%", height: "100%" },
});

export default GoogleMaps;
