import { Card } from "@/ui/components/Card";
import { ConfigsCardHeader, ConfigsCardBody } from "@/ui/configs/ConfigsCardShared";
import { CreateMappingPopover } from "@/ui/configs/ConfigsPopover";
import { useAdapter } from "@/adapter-state/store";
import { useState } from "react";

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

export { MappingCard };
