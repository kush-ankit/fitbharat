import React from "react";
import { View, Text, ScrollView, Image, StyleSheet } from "react-native";
import { Ionicons, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import UserInfo from "../../components/UserInfo";

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* User Info Section */}
      <UserInfo />

      {/* Health Grade Section */}
      <View style={styles.healthCard}>
        <Text style={styles.healthGrade}>90</Text>
        <View>
          <Text style={styles.healthTitle}>Health Grade</Text>
          <Text style={styles.healthMessage}>Perfect progress dude, keep going to apply your fitness activity</Text>
        </View>
      </View>

      {/* Fitness Categories */}
      <View style={styles.categoriesContainer}>
        <View style={styles.category}><Ionicons name="barbell" size={24} color="white" /><Text style={styles.categoryText}>Strength</Text></View>
        <View style={styles.category}><FontAwesome6 name="dumbbell" size={24} color="white" /><Text style={styles.categoryText}>Treadmill</Text></View>
        <View style={styles.category}><MaterialIcons name="fitness-center" size={24} color="white" /><Text style={styles.categoryText}>Gym</Text></View>
      </View>

      {/* Popular Training */}
      <Text style={styles.sectionTitle}>Popular Training 🔥</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Image source={{ uri: "https://source.unsplash.com/600x400/?gym" }} style={styles.trainingImage} />
        <Image source={{ uri: "https://source.unsplash.com/600x400/?workout" }} style={styles.trainingImage} />
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16 },
  healthCard: { backgroundColor: "#90ee90", padding: 16, borderRadius: 12, flexDirection: "row", alignItems: "center", marginVertical: 16 },
  healthGrade: { fontSize: 40, fontWeight: "bold", color: "black", marginRight: 16 },
  healthTitle: { fontSize: 18, fontWeight: "bold" },
  healthMessage: { fontSize: 14, color: "gray" },
  categoriesContainer: { flexDirection: "row", justifyContent: "space-between", marginVertical: 16 },
  category: { backgroundColor: "#222", padding: 10, borderRadius: 10, alignItems: "center", flexDirection: "row", gap: 8 },
  categoryText: { color: "white", fontSize: 14 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "white", marginVertical: 10 },
  trainingImage: { width: 150, height: 100, borderRadius: 10, marginRight: 10 }
});


