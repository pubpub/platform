"use client";

import { ZodObject } from "zod";

import AutoForm from "ui/auto-form";

import { Action } from "~/actions/types";

export type Props = {
	action: Action;
};

export const StagePanelActionConfig = (props: Props) => {
	return <AutoForm formSchema={props.action.config as ZodObject<{}>} />;
};
