import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";

const UserInfo = () => {
  const user = {
    name: "Aditya",
    age: 24,
    height: "174 cm",
    weight: "89 kg",
    fitnessLevel: 90, // As per the reference image
  };

  return (
    <LinearGradient colors={["#1e1e1e", "#292929"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user.name} 💪</Text>
        <Image
          source={{ uri: "https://via.placeholder.com/50" }} // Replace with actual user image
          style={styles.profilePic}
        />
      </View>

      <View style={styles.healthCard}>
        <Text style={styles.healthText}>Health Grade</Text>
        <Text style={styles.healthNumber}>{user.fitnessLevel}</Text>
        <Text style={styles.healthDescription}>
          Perfect progress, keep pushing!
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <StatCard icon="user" label="Age" value={user.age} />
        <StatCard icon="ruler" label="Height" value={user.height} />
        <StatCard icon="weight" label="Weight" value={user.weight} />
      </View>
    </LinearGradient>
  );
};

const StatCard = ({ icon, label, value }) => (
  <View style={styles.statCard}>
    <FontAwesome5 name={icon} size={24} color="#fff" />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 15,
    margin: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  healthCard: {
    backgroundColor: "#32CD32",
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
  },
  healthText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  healthNumber: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#000",
  },
  healthDescription: {
    fontSize: 12,
    color: "#fff",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  statCard: {
    alignItems: "center",
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 10,
    width: "30%",
  },
  statLabel: {
    color: "#fff",
    fontSize: 14,
  },
  statValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default UserInfo;
