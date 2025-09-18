import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Stack } from "@mui/material";

import "./renderer.css";

import { Background } from "./components/Background";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Body } from "./components/Body";

const App = () => {
  return (
    <Stack sx={{ position: "fixed", inset: 0 }}>
      <Background />
      <Header />
      <Body />
      <Footer />
    </Stack>
  );
};

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#71A5BF" },
    background: { default: "#202020", paper: "#202020" },
  },
  typography: { fontFamily: `"jf openhuninn"`, button: { fontSize: "1rem" } },
  spacing: "0.5rem",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
