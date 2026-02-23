import { useRouter } from "expo-router"; // <-- Import useRouter
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const router = useRouter(); // <-- Initialize router

  const handleGetStarted = () => {
    // Navigate to the login page
    router.push("/login");
  };

  return (
    <View style={styles.container}>
      {/* Welcome Text */}
      <Text style={styles.welcomeText}>Welcome To</Text>

      {/* Logo */}
      <Image
        source={require("../../assets/images/NexibinLogo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Description */}
      <Text style={styles.description}>
        This project is stressing me out. Press Get Started to Start Shit.
      </Text>

      {/* Get Started Button */}
      <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  logo: {
    width: 400,
    height: 150,
    marginBottom: 20,
  },
  description: {
    textAlign: "center",
    fontSize: 16,
    color: "#555",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#006ff7",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
