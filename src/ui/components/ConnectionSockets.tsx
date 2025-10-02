import { AnimatePresence, motion } from "motion/react";
import { LayoutColumn, LayoutText } from "@/ui/components/Layout";
import { ellipsisSx } from "@/ui/components/Property";

import { useAdapter } from "@/adapter/store";
import { stringifySocketPair, stringifyAddress } from "@/adapter/ip";

const ConnectionSockets = () => {
  const sockets = useAdapter((state) => state.sockets);

  return (
    <LayoutColumn sx={{ position: "relative", overflow: "hidden", p: 1.5, height: 1, overflowY: "auto" }}>
      <AnimatePresence>
        {sockets.map((socketPair) => (
          <motion.div
            key={stringifySocketPair(socketPair)}
            style={{ display: "grid", gridTemplateColumns: "1fr 30px 1fr", width: "100%" }}
            layout
            initial={{ opacity: 0, scale: 0.95, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <LayoutText
              sx={{ ...ellipsisSx, textAlign: "center" }}
            >{`${stringifyAddress(socketPair.srcAddr)}:${socketPair.srcPort}`}</LayoutText>
            <LayoutText sx={{ justifySelf: "center" }}>→</LayoutText>
            <LayoutText
              sx={{ ...ellipsisSx, textAlign: "center" }}
            >{`${stringifyAddress(socketPair.dstAddr)}:${socketPair.dstPort}`}</LayoutText>
          </motion.div>
        ))}
      </AnimatePresence>
    </LayoutColumn>
  );
};

export { ConnectionSockets };
