import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import "@/ui/renderer.css";
import { App } from "@/ui/components/App";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#71A5BF" },
    background: { default: "#3C3C3C", paper: "#0005" },
  },
  typography: {
    fontFamily: `"Comfortaa", "jf openhuninn"`,
    fontSize: 14,
    button: { textTransform: "none", lineHeight: 1.2 },
  },
  spacing: "0.5rem",
  shape: { borderRadius: 6 },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
