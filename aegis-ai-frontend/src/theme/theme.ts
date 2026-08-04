import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "dark",

    primary: {
      main: "#2f80ed",
    },

    secondary: {
      main: "#00c2a8",
    },

    background: {
      default: "#07111f",
      paper: "#101d2e",
    },

    text: {
      primary: "#f5f8fc",
      secondary: "#a7b4c5",
    },

    success: {
      main: "#27ae60",
    },

    warning: {
      main: "#f2c94c",
    },

    error: {
      main: "#eb5757",
    },
  },

  typography: {
    fontFamily: "Inter, Roboto, Arial, sans-serif",

    h1: {
      fontWeight: 700,
    },

    h2: {
      fontWeight: 700,
    },

    h3: {
      fontWeight: 600,
    },

    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },

  shape: {
    borderRadius: 12,
  },
});
