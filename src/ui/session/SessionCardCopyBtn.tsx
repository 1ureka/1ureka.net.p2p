import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import { Box, Button } from "@mui/material";
import { GithubTooltip } from "@/ui/components/Github";
import { useSession } from "@/transport-state/store";
import { useState, useEffect, useRef } from "react";

const SessionCardCopyButton = () => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const session = useSession((state) => state.session);

  const handleCopy = async () => {
    if (timer.current !== null) clearTimeout(timer.current);
    await navigator.clipboard.writeText(session.id);
    setCopied(true);
  };

  useEffect(() => {
    if (!copied) return;
    timer.current = setTimeout(() => setCopied(false), 2000);
  }, [copied]);

  return (
    <Box sx={{ color: "text.secondary", translate: "0px -1.5px", height: 0, display: "grid", placeItems: "center" }}>
      <Button sx={{ m: 0, p: 0.5, minWidth: 0, height: 0, opacity: 0 }} color="inherit">
        <ContentCopyRoundedIcon fontSize="small" />
      </Button>

      <GithubTooltip
        title={copied ? "Copied!" : "Copy to clipboard"}
        placement="right"
        boxProps={{ sx: { position: "absolute" } }}
      >
        <Button sx={{ m: 0, p: 0.5, minWidth: 0 }} color="inherit" onClick={handleCopy} disabled={copied}>
          {copied ? <DoneRoundedIcon fontSize="small" /> : <ContentCopyRoundedIcon fontSize="small" />}
        </Button>
      </GithubTooltip>
    </Box>
  );
};

export { SessionCardCopyButton };
