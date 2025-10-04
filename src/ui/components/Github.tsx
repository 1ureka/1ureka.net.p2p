import { styled } from "@mui/material/styles";
import { Button, TextField } from "@mui/material";

const GithubTextField = styled(TextField)(({ theme }) => ({
  "& .MuiFormLabel-root": { fontSize: "0.85rem" },
  "& .MuiOutlinedInput-root": {
    borderRadius: 6,
    backgroundColor: theme.palette.background.paper,
    fontSize: "0.85rem",
    "& fieldset": { borderWidth: 2, fontSize: "0.85rem", borderColor: theme.palette.divider },
    "&:hover fieldset": { borderColor: theme.palette.text.disabled },
    "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
    "& input::placeholder": { color: "#6e7781", opacity: 1 },
  },
}));

const GithubButton = styled(Button)(({ theme }) => ({
  borderRadius: 6,
  color: theme.palette.text.primary,
  textTransform: "none",
  textWrap: "nowrap",
  border: "2px solid",
  borderColor: theme.palette.divider,
  backgroundColor: theme.palette.background.paper,
  "&:hover": { filter: "brightness(1.2)" },
  fontWeight: "bold",
}));

export { GithubButton, GithubTextField };
