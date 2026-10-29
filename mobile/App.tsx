import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./src/firebase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") return null;

  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    Constants.easConfig?.projectId ||
    Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return null;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    registerForPushNotifications().then((token) => {
      // TODO: send token to the protected server API and associate it with this user.
      // Do not store or send tokens from an unauthenticated session.
      if (token) console.info("FLYApp push token registered on device.");
    }).catch((reason) => console.warn("Push notification setup unavailable:", reason));
  }, [user]);

  async function submitAuth() {
    if (!auth) {
      setError("Firebase isn't configured yet. Add the Firebase values to mobile/.env.");
      return;
    }
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (creatingAccount) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in right now.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (auth) await signOut(auth);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>F</Text></View>
          <Text style={styles.brand}>FLYAPP</Text>
          <Text style={styles.subtitle}>YOUR SHOW. YOUR MOMENT.</Text>

          {!isFirebaseConfigured ? (
            <View style={styles.panel}>
              <Text style={styles.heading}>Mobile app foundation</Text>
              <Text style={styles.body}>
                The native iOS and Android project is ready for configuration. Add the Firebase web
                app settings to mobile/.env to activate account sign-in.
              </Text>
              <Text style={styles.note}>This app is separate from the legacy Base44 web app.</Text>
            </View>
          ) : user ? (
            <View style={styles.panel}>
              <Text style={styles.heading}>Welcome to FLYApp</Text>
              <Text style={styles.body}>Signed in as {user.email}</Text>
              <Text style={styles.body}>
                Your event schedule, assigned looks, styling notes, and role-specific dashboard
                will appear here as the protected backend is connected.
              </Text>
              <View style={styles.notice}>
                <Text style={styles.noticeText}>Push notifications will be enabled after device setup and backend registration.</Text>
              </View>
              <TouchableOpacity style={styles.secondaryButton} onPress={logout}>
                <Text style={styles.secondaryButtonText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.panel}>
              <Text style={styles.heading}>{creatingAccount ? "Create your account" : "Welcome back"}</Text>
              <Text style={styles.body}>Sign in to stay connected to your show.</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="Email address"
                placeholderTextColor="#A8A2B0"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />
              <TextInput
                autoCapitalize="none"
                autoComplete={creatingAccount ? "new-password" : "password"}
                placeholder="Password"
                placeholderTextColor="#A8A2B0"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.input}
              />
              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              <TouchableOpacity style={styles.primaryButton} onPress={submitAuth} disabled={busy}>
                {busy ? <ActivityIndicator color="#161616" /> : <Text style={styles.primaryButtonText}>{creatingAccount ? "Create account" : "Sign in"}</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setCreatingAccount(!creatingAccount); setError(""); }}>
                <Text style={styles.switchText}>{creatingAccount ? "Already have an account? Sign in" : "New to FLYApp? Create an account"}</Text>
              </TouchableOpacity>
              <Text style={styles.note}>Event access and role approval will be enforced by the backend.</Text>
            </View>
          )}
          <Text style={styles.footer}>FLY SHOWCASE · FASHION • PEOPLE • PRODUCTION</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#161616" },
  flex: { flex: 1 },
  page: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 38, maxWidth: 560, width: "100%", alignSelf: "center" },
  brandMark: { alignSelf: "center", width: 58, height: 58, borderWidth: 1, borderColor: "#DEB64B", borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  brandMarkText: { color: "#DEB64B", fontSize: 32, fontWeight: "300", fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" },
  brand: { color: "#FFFFFF", textAlign: "center", fontSize: 30, fontWeight: "700", letterSpacing: 5 },
  subtitle: { color: "#DEB64B", textAlign: "center", fontSize: 10, letterSpacing: 3, marginTop: 8, marginBottom: 34 },
  panel: { backgroundColor: "#222124", borderColor: "#39353D", borderWidth: 1, borderRadius: 20, padding: 22, gap: 14 },
  heading: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" },
  body: { color: "#C9C4CD", fontSize: 15, lineHeight: 23 },
  input: { color: "#FFFFFF", backgroundColor: "#171619", borderWidth: 1, borderColor: "#49434D", borderRadius: 12, paddingHorizontal: 15, paddingVertical: 14, fontSize: 16 },
  primaryButton: { backgroundColor: "#DEB64B", borderRadius: 12, minHeight: 50, alignItems: "center", justifyContent: "center", marginTop: 4 },
  primaryButtonText: { color: "#161616", fontWeight: "800", fontSize: 16 },
  secondaryButton: { borderColor: "#DEB64B", borderWidth: 1, borderRadius: 12, padding: 14, alignItems: "center" },
  secondaryButtonText: { color: "#DEB64B", fontWeight: "700" },
  switchText: { color: "#DEB64B", textAlign: "center", paddingVertical: 4, fontWeight: "600" },
  note: { color: "#938C99", fontSize: 12, lineHeight: 18 },
  error: { color: "#FF8F8F", fontSize: 13 },
  notice: { backgroundColor: "#302B1F", padding: 12, borderRadius: 10 },
  noticeText: { color: "#E8D39A", fontSize: 13, lineHeight: 19 },
  footer: { color: "#726C78", fontSize: 9, letterSpacing: 1.6, textAlign: "center", marginTop: 28 },
});
