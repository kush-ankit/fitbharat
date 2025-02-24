import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

const GoogleMapsScreen = () => {
    const [coordinates, setCoordinates] = useState([]);

    useEffect(() => {
        fetch("https://router.project-osrm.org/route/v1/car/77.2295,28.6129;80.9462,26.8467?overview=full&geometries=geojson")
            .then(response => response.json())
            .then(data => {
                if (data.code === "Ok") {
                    let routeCoords = data.routes[0].geometry.coordinates;
                    let formattedCoords = routeCoords.map((coord: any) => ({
                        latitude: coord[1], // OSRM returns [lng, lat], so we swap
                        longitude: coord[0],
                    }));
                    setCoordinates(formattedCoords);
                }
            })
            .catch(error => console.error(error));
    }, []);

    return (
        <View style={styles.container}>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: 28.612962,
                    longitude: 77.227663,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
            >
                {/* Start Marker */}
                {coordinates.length > 0 && (
                    <Marker coordinate={coordinates[0]} title="Start" />
                )}

                {/* End Marker */}
                {coordinates.length > 1 && (
                    <Marker coordinate={coordinates[coordinates.length - 1]} title="End" />
                )}

                {/* Draw Route */}
                <Polyline coordinates={coordinates} strokeWidth={4} strokeColor="blue" />
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: "100%",
        height: "100%",
    },
});

export default GoogleMapsScreen;
