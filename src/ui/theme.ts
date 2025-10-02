import { createTheme } from "@mui/material/styles";

const publicGithubPalette = {
  primary: { main: "#58A6FF" }, // GitHub 夜間主題裡的 accent 藍色
  background: {
    default: "#0D1117", // GitHub Dark 的主背景色
    paper: "#161B22", // 較淺一層背景色
  },
  text: {
    primary: "#C9D1D9", // 主要文字色
    secondary: "#8B949E", // 輔助文字
    disabled: "#484F58", // 禁用文字
  },
  divider: "#30363D", // 分隔線顏色
} as const;

const loginGithubPalette = {
  primary: { main: "#58A6FF" }, // GitHub 夜間主題裡的 accent 藍色
  background: {
    default: "#151b23", // GitHub Dark 的主背景色
    paper: "#212830", // 較淺一層背景色
  },
  text: {
    primary: "#C9D1D9", // 主要文字色
    secondary: "#8B949E", // 輔助文字
    disabled: "#484F58", // 禁用文字
  },
  divider: "#30363D", // 分隔線顏色
} as const;

export const theme = createTheme({
  palette: {
    mode: "dark",
    // primary: { main: "#71A5BF" },
    // background: { default: "#0b0f10", paper: "#192024" },
    ...loginGithubPalette,
  },
  typography: {
    fontFamily: `"Comfortaa", "jf openhuninn"`,
    fontSize: 14,
    h6: { lineHeight: 1 },
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
