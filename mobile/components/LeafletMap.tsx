import React, { useRef, useEffect } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import { Platform } from "react-native";
import { readFileSync } from "fs"; // For reading files if needed

const GoTogetherMap = () => {
    const webViewRef = useRef<WebView | null>(null);

    useEffect(() => {
        const startLat = 28.6129, startLng = 77.2295;
        const endLat = 28.6155, endLng = 77.2166;

        const message = JSON.stringify({ startLat, startLng, endLat, endLng });

        if (webViewRef.current) {
            webViewRef.current.postMessage(message);
        }
    }, []);

    // Read HTML file (Alternative: Use inline HTML)
    const mapHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <style>
                body, html { margin: 0; height: 100%; overflow: hidden; }
                #map { height: 100vh; width: 100vw; }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                document.addEventListener("message", (event) => {
                    let data = JSON.parse(event.data);
                    let start = [data.startLat, data.startLng];
                    let end = [data.endLat, data.endLng];

                    var map = L.map('map').setView(start, 14);

                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; OpenStreetMap contributors'
                    }).addTo(map);

                    L.marker(start).addTo(map).bindPopup("Start Point");
                    L.marker(end).addTo(map).bindPopup("End Point");

                    fetch(\`https://router.project-osrm.org/route/v1/foot/\${data.startLng},\${data.startLat};\${data.endLng},\${data.endLat}?overview=full&geometries=geojson\`)
                        .then(response => response.json())
                        .then(data => {
                            let routeCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
                            L.polyline(routeCoords, { color: 'blue', weight: 5 }).addTo(map);
                        });
                });
            </script>
        </body>
        </html>
    `;

    return (
        <View style={{ flex: 1 }}>
            <WebView
                ref={webViewRef}
                originWhitelist={["*"]}
                source={{ html: mapHTML }} // ✅ Load HTML from a string
                style={{ flex: 1 }}
            />
        </View>
    );
};

export default GoTogetherMap;
