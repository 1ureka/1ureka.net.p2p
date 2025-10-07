import AddBoxRoundedIcon from "@mui/icons-material/AddBoxRounded";
import InfoOutlineRoundedIcon from "@mui/icons-material/InfoOutlineRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

import { Box, Typography, Tooltip, Zoom } from "@mui/material";
import { centerTextSx } from "@/ui/theme";
import { Card, CardHeader } from "@/ui/components/Card";
import { GithubButton, GithubHeaderButton } from "@/ui/components/Github";
import { RouteCardList, RouteCardListItem } from "@/ui/components/RouteCardList";
import { CreateMappingPopover, CreateRulePopover } from "@/ui/components/RouteCardDialog";

import { useAdapter } from "@/adapter-state/store";
import { handleStartHostAdapter, handleStartClientAdapter, handleStopAdapter } from "@/adapter-state/handlers";
import { useState } from "react";

type NoItemDisplayProps = {
  type: "mapping" | "rule";
  actionDisabled?: boolean;
  onAction?: (event: React.MouseEvent<HTMLElement>) => void;
};

const NoItemDisplay = ({ type, actionDisabled, onAction }: NoItemDisplayProps) => {
  const title = type === "mapping" ? "No mappings yet" : "No rules defined";
  const description =
    type === "mapping"
      ? "You haven’t added any port mappings yet. Create one to connect local and remote ports."
      : "You haven’t defined any access rules yet. Add one to allow incoming connections.";

  return (
    <Box sx={{ height: 1, display: "grid", placeItems: "center" }}>
      <Box sx={{ p: 2, color: "text.secondary", display: "grid", placeItems: "center" }}>
        <InfoOutlineRoundedIcon fontSize="large" sx={{ opacity: 0.5, mb: 1 }} />

        <Typography variant="subtitle2" sx={{ color: "text.primary" }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ textAlign: "center", maxWidth: 400 }}>
          {description}
        </Typography>

        <GithubButton
          sx={{ mt: 2.5, py: 0.5, px: 1.5, bgcolor: "background.paper", textTransform: "none", ...centerTextSx }}
          startIcon={<AddBoxRoundedIcon />}
          disabled={actionDisabled}
          onClick={onAction}
        >
          <Typography variant="body2">Add</Typography>
        </GithubButton>
      </Box>
    </Box>
  );
};

type ErrorDisplayProps = {
  type: "mapping" | "rule";
  error: string;
  onRetry: () => void;
};

const ErrorDisplay = ({ type, error, onRetry }: ErrorDisplayProps) => {
  const title = type === "mapping" ? "Failed to start client adapter" : "Failed to start host adapter";

  return (
    <Box sx={{ height: 1, display: "grid", placeItems: "center" }}>
      <Box sx={{ p: 2, color: "error.main", display: "grid", placeItems: "center" }}>
        <ErrorOutlineRoundedIcon fontSize="large" sx={{ opacity: 0.8, mb: 1 }} />

        <Typography variant="subtitle2" sx={{ color: "error.main" }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ textAlign: "center", maxWidth: 400, color: "text.secondary" }}>
          {error}
        </Typography>

        <GithubButton
          sx={{ mt: 2.5, py: 0.5, px: 1.5, bgcolor: "background.paper", textTransform: "none", ...centerTextSx }}
          startIcon={<PlayArrowRoundedIcon />}
          onClick={onRetry}
        >
          <Typography variant="body2">Retry</Typography>
        </GithubButton>
      </Box>
    </Box>
  );
};

const MappingCard = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mappings = useAdapter((state) => state.mappings);
  const instance = useAdapter((state) => state.instance);

  const isAdapterRunning = instance !== null;
  const addDisabled = !isAdapterRunning;
  const startDisabled = isAdapterRunning;
  const stopDisabled = !isAdapterRunning;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      await handleStartClientAdapter();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await handleStopAdapter();
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <CardHeader>
        <Typography variant="subtitle1" component="h2">
          Mappings
        </Typography>

        <Box sx={{ flex: 1 }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip
            title={startDisabled ? "Adapter is already running" : ""}
            arrow
            placement="top"
            slots={{ transition: Zoom }}
          >
            <Box>
              <GithubHeaderButton
                StartIcon={PlayArrowRoundedIcon}
                disabled={startDisabled}
                loading={loading}
                onClick={handleStart}
              >
                start
              </GithubHeaderButton>
            </Box>
          </Tooltip>

          <Tooltip
            title={stopDisabled ? "Adapter is not running" : ""}
            arrow
            placement="top"
            slots={{ transition: Zoom }}
          >
            <Box>
              <GithubHeaderButton
                color="warning"
                StartIcon={StopRoundedIcon}
                disabled={stopDisabled}
                loading={loading}
                onClick={handleStop}
              >
                stop
              </GithubHeaderButton>
            </Box>
          </Tooltip>

          <Tooltip title={addDisabled ? "Start adapter first" : ""} arrow placement="top" slots={{ transition: Zoom }}>
            <Box>
              <GithubHeaderButton StartIcon={AddBoxRoundedIcon} disabled={addDisabled} onClick={handleOpen}>
                add
              </GithubHeaderButton>
            </Box>
          </Tooltip>
        </Box>
        <CreateMappingPopover anchorEl={anchorEl} onClose={handleClose} />
      </CardHeader>

      <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {error && <ErrorDisplay type="mapping" error={error} onRetry={handleStart} />}
        {!error && mappings.length <= 0 && (
          <NoItemDisplay type="mapping" actionDisabled={addDisabled} onAction={handleOpen} />
        )}
        {!error && mappings.length > 0 && (
          <RouteCardList>
            {mappings.map(({ id, mapping, createdAt }) => (
              <RouteCardListItem key={id} id={id} type="mapping" content={mapping} createdAt={createdAt} />
            ))}
          </RouteCardList>
        )}
      </Box>

      <Box sx={{ p: 1 }} />
    </Card>
  );
};

const RuleCard = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rules = useAdapter((state) => state.rules);
  const instance = useAdapter((state) => state.instance);

  const isAdapterRunning = instance !== null;
  const addDisabled = !isAdapterRunning;
  const startDisabled = isAdapterRunning;
  const stopDisabled = !isAdapterRunning;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      await handleStartHostAdapter();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await handleStopAdapter();
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <CardHeader>
        <Typography variant="subtitle1" component="h2">
          Rules
        </Typography>

        <Box sx={{ flex: 1 }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip
            title={startDisabled ? "Adapter is already running" : ""}
            arrow
            placement="top"
            slots={{ transition: Zoom }}
          >
            <Box>
              <GithubHeaderButton
                StartIcon={PlayArrowRoundedIcon}
                disabled={startDisabled}
                loading={loading}
                onClick={handleStart}
              >
                start
              </GithubHeaderButton>
            </Box>
          </Tooltip>

          <Tooltip
            title={stopDisabled ? "Adapter is not running" : ""}
            arrow
            placement="top"
            slots={{ transition: Zoom }}
          >
            <Box>
              <GithubHeaderButton
                color="warning"
                StartIcon={StopRoundedIcon}
                disabled={stopDisabled}
                loading={loading}
                onClick={handleStop}
              >
                stop
              </GithubHeaderButton>
            </Box>
          </Tooltip>

          <Tooltip title={addDisabled ? "Start adapter first" : ""} arrow placement="top" slots={{ transition: Zoom }}>
            <Box>
              <GithubHeaderButton StartIcon={AddBoxRoundedIcon} disabled={addDisabled} onClick={handleOpen}>
                add
              </GithubHeaderButton>
            </Box>
          </Tooltip>
        </Box>
        <CreateRulePopover anchorEl={anchorEl} onClose={handleClose} />
      </CardHeader>

      <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {error && <ErrorDisplay type="rule" error={error} onRetry={handleStart} />}
        {!error && rules.length <= 0 && (
          <NoItemDisplay type="rule" actionDisabled={addDisabled} onAction={handleOpen} />
        )}
        {!error && rules.length > 0 && (
          <RouteCardList>
            {rules.map(({ id, pattern, createdAt }) => (
              <RouteCardListItem key={id} id={id} type="rule" content={pattern} createdAt={createdAt} />
            ))}
          </RouteCardList>
        )}
      </Box>

      <Box sx={{ p: 1 }} />
    </Card>
  );
};

export { MappingCard, RuleCard };
