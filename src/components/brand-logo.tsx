import { Image, StyleSheet } from "react-native";

export function BrandLogo({ size = 64 }: { size?: number }) {
  return (
    <Image
      source={require("@/assets/images/icon.png")}
      accessibilityLabel="ORA LODGE"
      resizeMode="contain"
      style={[styles.logo, { width: size, height: size }]}
    />
  );
}

const styles = StyleSheet.create({
  logo: { backgroundColor: "#fff" },
});
