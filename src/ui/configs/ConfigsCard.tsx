import { memo } from "react";
import { RuleCard } from "@/ui/configs/RuleCard";
import { MappingCard } from "@/ui/configs/MappingCard";
import { useSession } from "@/transport-state/store";

const ConfigsCard = memo(() => {
  const role = useSession((state) => state.role);

  if (role === "client") return <MappingCard />;
  if (role === "host") return <RuleCard />;
});

ConfigsCard.displayName = "ConfigsCard";

export { ConfigsCard };
