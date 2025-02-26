import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function Gamification() {
    return (
        <SafeAreaView>
            <View style={styles.titleContainer}>
                <Text>Gamification</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    headerImage: {
        color: '#808080',
        bottom: -90,
        left: -35,
        position: 'absolute',
    },
    titleContainer: {
        flexDirection: 'row',
        backgroundColor: '#ccc',
        width: '100%',
        height: '100%',
        gap: 8,
        alignItems: 'flex-end'
    },
});
