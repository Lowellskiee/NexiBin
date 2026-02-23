import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // TODO: Add real login logic here
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    console.log({ email, password });

    // Navigate to dashboard after login (example)
    router.replace("/dashboard");
  };

  return (
    <View style={styles.container}>
      {/* Top Section */}
      <Text style={styles.welcomeText}>Welcome To</Text>

    {/* Logo */}
          <Image
            source={require("../assets/images/NexibinLogo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

      {/* Description */}
            <Text style={styles.description}>
              Login to continue to your Account.
            </Text>
            
      {/* Form Container */}
      <View style={styles.formContainer}>
        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          placeholder="Password"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Login Button */}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>

        {/* Register Link */}
        <TouchableOpacity onPress={() => router.push("/register")}>
          <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>

        {/* Description */}
            <Text style={styles.description}>
              By Continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  logo: {
    width: 300,
    height: 120,
    marginBottom: 20,
  },

   description: {
    textAlign: "center",
    fontSize: 16,
    color: "#555",
    marginBottom: 30,
  },

  formContainer: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#006ff7",
    paddingVertical: 14,
    borderRadius: 25,
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  linkText: {
    color: "#006ff7",
    textAlign: "center",
  },
});
