import type { Route } from "next/types";

import { usePathname } from "next/navigation";

export const useTypedPathname = () => {
	const pathname = usePathname();
	return pathname as __next_route_internal_types__.RouteImpl<Route>;
};
