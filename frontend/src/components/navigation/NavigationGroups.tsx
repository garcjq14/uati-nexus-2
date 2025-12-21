import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface NavigationGroup {
  title: string;
  items: ReactNode[];
}

interface NavigationGroupsProps {
  groups: NavigationGroup[];
}

export function NavigationGroups({ groups }: NavigationGroupsProps) {
  return (
    <div className="space-y-6">
      {groups.map((group, groupIndex) => (
        <motion.div
          key={group.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIndex * 0.1 }}
        >
          <h3 className="px-5 mb-2 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/70">
            {group.title}
          </h3>
          <div className="space-y-1">
            {group.items.map((item, itemIndex) => (
              <motion.div
                key={itemIndex}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: groupIndex * 0.1 + itemIndex * 0.05 }}
              >
                {item}
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}





