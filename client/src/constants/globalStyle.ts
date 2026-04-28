import { StyleSheet } from "react-native";
import { Colors, Fonts } from "./theme";

export const globalStyle = StyleSheet.create({
  // Aggressive, terminal-style headings
  bigTitle: {
    color: Colors.text,
    fontSize: 24,
    fontFamily: Fonts.mono,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -1, // Tight kerning for impact
  },

  // Slap this on ANY View to instantly make it brutalist
  brutalistBox: {
    backgroundColor: Colors.white,
    borderWidth: 4,
    borderColor: Colors.text,
    // The signature hard offset shadow
    borderBottomWidth: 8,
    borderRightWidth: 8,
    padding: 16,
  },

  // Use this for interactive elements (Buttons)
  brutalistBoxPressed: {
    borderBottomWidth: 4,
    borderRightWidth: 4,
    transform: [{ translateX: 4 }, { translateY: 4 }],
  }
});
