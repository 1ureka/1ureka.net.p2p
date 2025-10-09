import { Card } from "@/ui/components/Card";
import { ConfigsCardHeader, ConfigsCardBody } from "@/ui/configs/ConfigsCardShared";
import { CreateMappingPopover } from "@/ui/configs/ConfigsPopover";
import { RuleCard } from "@/ui/configs/RuleCard";

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
      <ConfigsCardHeader actionDisabled={addDisabled} onAction={handleOpen} />
      <ConfigsCardBody items={mappings.map(({ id, mapping, createdAt }) => ({ id, content: mapping, createdAt }))} />

      <CreateMappingPopover anchorEl={anchorEl} onClose={handleClose} />
    </Card>
  );
};

const ConfigsCard = memo(() => {
  const role = useSession((state) => state.role);

  if (role === "client") return <MappingCard />;
  if (role === "host") return <RuleCard />;
});

ConfigsCard.displayName = "ConfigsCard";

export { ConfigsCard };
