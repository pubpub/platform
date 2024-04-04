"use client";

import AutoForm from "ui/auto-form";
import { ZodObject } from "zod";
import { Action } from "~/actions/types";

export type Props = {
	action: Action;
};

export const StagePanelActionConfig = (props: Props) => {
	return <AutoForm formSchema={props.action.config as ZodObject<{}>} />;
};
