import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Register() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"user" | "staff">("user");

  const handleRegister = () => {
    // TODO: Add real signup logic here
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    console.log({ name, email, password, role });

    // Navigate to dashboard after registration (example)
    router.replace("./tabs/dashboard");
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

      {/* Form Container */}
      <View style={styles.formContainer}>
        <TextInput
          placeholder="Name"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

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

        <TextInput
          placeholder="Confirm Password"
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {/* Role Selection */}
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              role === "user" && styles.roleButtonSelected,
            ]}
            onPress={() => setRole("user")}
          >
            <Text
              style={[
                styles.roleButtonText,
                role === "user" && styles.roleButtonTextSelected,
              ]}
            >
              User
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleButton,
              role === "staff" && styles.roleButtonSelected,
            ]}
            onPress={() => setRole("staff")}
          >
            <Text
              style={[
                styles.roleButtonText,
                role === "staff" && styles.roleButtonTextSelected,
              ]}
            >
              Staff
            </Text>
          </TouchableOpacity>
        </View>

        {/* Signup Button */}
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        {/* Login Link */}
        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
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
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#006ff7",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  roleButtonSelected: {
    backgroundColor: "#006ff7",
  },
  roleButtonText: {
    color: "#006ff7",
    fontWeight: "bold",
  },
  roleButtonTextSelected: {
    color: "#fff",
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
