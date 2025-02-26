import GoogleMaps from '@/components/googleMaps';
import { StyleSheet, View, Text } from 'react-native';
import MapView from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function Path() {
  return (
    <View style={styles.Container}>
      <GoogleMaps />
      <SafeAreaView style={styles.titleContainer}>
        <View>
            
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
  },
  text: {
    backgroundColor: 'green'
  }
});
