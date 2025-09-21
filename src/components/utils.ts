export const transition = "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)";

export const buttonWithStartIconSx = {
  pl: 1.5,
  borderRadius: 2,
};

export const buttonContainedSx = {
  scale: "1.001",
  borderRadius: 2,
  "&:hover": { bgcolor: "primary.light", scale: "1.05" },
  "&:active": { scale: "0.97" },
  transition,
};

export const ellipsisSx = {
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textOverflow: "ellipsis",
  wordBreak: "break-all",
  whiteSpace: "pre-wrap",
} as const;
