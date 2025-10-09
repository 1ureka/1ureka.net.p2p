import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface TypeBackground {
    header: string;
    tooltip: string;
  }
}

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#58A6FF" },
    background: { header: "#151b23", default: "#212830", paper: "#2a313c", tooltip: "#3d444d" },
    text: { primary: "#C9D1D9", secondary: "#8B949E", disabled: "#484F58" },
    divider: "#3d444d",
  },
  typography: {
    fontFamily: `"Comfortaa", "jf openhuninn"`,
    fontSize: 14,
    h6: { lineHeight: 1 },
  },
  components: {
    MuiDivider: {
      styleOverrides: { root: { borderWidth: "1px" } },
    },
  },
});

export const ellipsisSx = {
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "pre-wrap",
} as const;

export const centerTextSx = {
  textBox: "trim-both cap alphabetic",
};

export const generateColorMix = (color1: string, color2: string, percentage: number) => {
  return `color-mix(in srgb, ${color1} ${percentage}%, ${color2} ${100 - percentage}%)`;
};
