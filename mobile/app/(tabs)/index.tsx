import GoTogetherMap from '@/components/LeafletMap';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Tab() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <GoTogetherMap />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
