import { Card } from "@/ui/components/Card";
import { ConfigsCardHeader, ConfigsCardBody } from "@/ui/configs/ConfigsCardShared";
import { CreateMappingPopover, CreateRulePopover } from "@/ui/configs/ConfigsPopover";

import { useAdapter } from "@/adapter-state/store";
import { useState, memo } from "react";
import { useSession } from "@/transport-state/store";

const MappingCard = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const mappings = useAdapter((state) => state.mappings);
  const instance = useAdapter((state) => state.instance);
  const addDisabled = instance === null;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <ConfigsCardHeader type="mapping" actionDisabled={addDisabled} onAction={handleOpen} />
      <ConfigsCardBody
        type="mapping"
        items={mappings.map(({ id, mapping, createdAt }) => ({ id, content: mapping, createdAt }))}
      />

      <CreateMappingPopover anchorEl={anchorEl} onClose={handleClose} />
    </Card>
  );
};

const RuleCard = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const rules = useAdapter((state) => state.rules);
  const instance = useAdapter((state) => state.instance);
  const addDisabled = instance === null;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <ConfigsCardHeader type="rule" actionDisabled={addDisabled} onAction={handleOpen} />
      <ConfigsCardBody
        type="rule"
        items={rules.map(({ id, pattern, createdAt }) => ({ id, content: pattern, createdAt }))}
      />

      <CreateRulePopover anchorEl={anchorEl} onClose={handleClose} />
    </Card>
  );
};

const ConfigsCard = memo(() => {
  const role = useSession((state) => state.role);

  if (role === "client") return <MappingCard />;
  if (role === "host") return <RuleCard />;

  throw new Error("ConfigsCard must be used when role is either 'client' or 'host'");
});

ConfigsCard.displayName = "ConfigsCard";

export { ConfigsCard };
