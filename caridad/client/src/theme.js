import { createTheme } from "@mui/material/styles";

const bodyFont = [
  "ui-sans-serif",
  "system-ui",
  "-apple-system",
  '"Segoe UI"',
  "Roboto",
  '"Helvetica Neue"',
  "Arial",
  "sans-serif",
].join(", ");

const displayFont = '"DM Serif Display", "Iowan Old Style", Georgia, serif';

export const adminTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0e872c",
      dark: "#096b21",
      light: "#79ff9b",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#1d9e5b",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f8edef",
      paper: "#ffffff",
    },
    text: {
      primary: "#102a1a",
      secondary: "#3f5546",
    },
    divider: "#e7d8dc",
    success: { main: "#0e872c" },
    warning: { main: "#c47c12" },
    error: { main: "#a33a4d" },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: bodyFont,
    h1: { fontFamily: displayFont, fontWeight: 400 },
    h2: { fontFamily: displayFont, fontWeight: 400 },
    h3: { fontFamily: displayFont, fontWeight: 400 },
    h4: { fontFamily: displayFont, fontWeight: 400 },
    h5: { fontFamily: displayFont, fontWeight: 400 },
    h6: { fontFamily: displayFont, fontWeight: 400 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #e7d8dc",
          boxShadow: "0 8px 24px -18px rgba(8, 40, 15, 0.3)",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999 },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
    },
  },
});
