import type { z } from "zod";

import { useContext } from "react";

import { BlankContext } from "./defineFormContextClientInner";

export const useActionContext = <C extends z.ZodObject<any, any>>(context: C) => {
	return useContext(BlankContext as unknown as React.Context<z.infer<C>>);
};
