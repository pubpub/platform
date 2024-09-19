import React from "react";

import { Skeleton } from "ui/skeleton";
import { cn } from "utils";

export const SkeletonButton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<Skeleton className={cn("h-8 w-full", className)} {...props} />
);
