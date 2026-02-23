import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons"; // expo vector icons
import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Dashboard() {
  // Sample user initials
  const userInitials = "UN";

  // Sample rewards data
  const rewards = [
    {
      id: 1,
      name: "Jeonghan Rare",
      description:
        "Visit Nanatour 2023",
      points: 30,
      locked: false,
    },
    {
      id: 2,
      name: "cheolito",
      description:
        "buff cutie cherry",
      points: 100,
      locked: true,
    },
    {
      id: 3,
      name: "Wonwoo",
      description:
        "Ganda lang",
      points: 100,
      locked: true,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: Logo + User Initials */}
        <View style={styles.header}>
          {/* Logo */}
                    <Image
                      source={require("../../assets/images/NexibinLogo.png")}
                      style={styles.logo}
                      resizeMode="contain"
                    />
          <View style={styles.userCircle}>
            <Text style={styles.userInitials}>{userInitials}</Text>
          </View>
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeBack}>Welcome back</Text>
          <Text style={styles.userName}>User!</Text>
        </View>

        {/* Points Box */}
        <View style={styles.pointsBox}>
          <Text style={styles.pointsValue}>30.60</Text>
          <Text style={styles.pointsUnit}>pts</Text>
        </View>

        {/* Rewards Header */}
        <View style={styles.rewardsHeader}>
          <Text style={styles.rewardsTitle}>Rewards</Text>
          <Text style={styles.rewardsChoose}>Choose Reward to Redeem</Text>
        </View>

        {/* Rewards List */}
        {rewards.map((reward) => (
          <View
            key={reward.id}
            style={[styles.rewardCard, reward.locked && styles.lockedCard]}
          >
            <View style={styles.rewardPointsContainer}>
              <Text style={styles.rewardPoints}>{reward.points}</Text>
              <Text style={styles.rewardPointsLabel}>pts</Text>
              {reward.locked && (
                <MaterialIcons
                  name="lock-outline"
                  size={20}
                  color="#555"
                  style={{ marginLeft: 5 }}
                />
              )}
            </View>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardName}>{reward.name}</Text>
              <Text style={styles.rewardDescription}>{reward.description}</Text>
            </View>
            <TouchableOpacity style={styles.redeemButton}>
              <Text style={styles.redeemText}>Redeem</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navIcon}>
          <Ionicons name="home" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navIcon}>
          <FontAwesome name="camera" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navIcon}>
          <Ionicons name="settings-sharp" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navIcon}>
          <Ionicons name="log-out" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 80, // space for bottom nav
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },
  logo: {
    width: 300,
    height: 120,
    marginBottom: 20,
  },

  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0f0f5c", // dark blue
    letterSpacing: 2,
  },
  userCircle: {
    backgroundColor: "#aec9ff",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  userInitials: {
    color: "#0f0f5c",
    fontWeight: "bold",
    fontSize: 18,
  },
  welcomeContainer: {
    marginTop: 25,
  },
  welcomeBack: {
    color: "#0f0f5c",
    fontWeight: "bold",
    fontSize: 16,
  },
  userName: {
    color: "#0f0f5c",
    fontWeight: "bold",
    fontSize: 22,
  },
  pointsBox: {
    marginTop: 20,
    backgroundColor: "#0f0f5c",
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 25,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  pointsValue: {
    fontSize: 44,
    fontWeight: "bold",
    color: "#fff",
    marginRight: 8,
  },
  pointsUnit: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 6,
  },
  rewardsHeader: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rewardsTitle: {
    fontWeight: "bold",
    fontSize: 20,
    color: "#0f0f5c",
    flex: 1,
  },
  rewardsDetails: {
    fontSize: 14,
    color: "#0f0f5c",
    flex: 1,
  },
  rewardsChoose: {
    fontSize: 14,
    color: "#0f0f5c",
    flex: 1,
    textAlign: "right",
  },
  rewardCard: {
    backgroundColor: "#d6e2ff",
    borderRadius: 12,
    marginTop: 15,
    padding: 15,
  },
  lockedCard: {
    backgroundColor: "#c6cbd1",
  },
  rewardPointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  rewardPoints: {
    fontWeight: "bold",
    fontSize: 26,
    color: "#0f0f5c",
  },
  rewardPointsLabel: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#0f0f5c",
    marginLeft: 6,
  },
  rewardInfo: {
    marginBottom: 8,
  },
  rewardName: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#0f0f5c",
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 12,
    color: "#0f0f5c",
  },
  redeemButton: {
    backgroundColor: "#0f0f5c",
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  redeemText: {
    color: "#fff",
    fontWeight: "600",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    height: 60,
    width: "100%",
    backgroundColor: "#0f0f5c",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navIcon: {
    padding: 10,
  },
});
