import MapView, { UrlTile } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';
import GoogleMapsScreen from '@/components/GoogleMap';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <GoogleMapsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
