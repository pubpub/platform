"use client";

import dynamic from "next/dynamic";

import type { CopyButtonProps } from "ui/copy-button";

type Props = Omit<CopyButtonProps, "value">;

const CopyButton = dynamic(() => import("ui/copy-button").then((module) => module.CopyButton), {
	ssr: false,
});

export const CopyCurrentUrlButton = (props: Props) => {
	return <CopyButton value={window.location.href} {...props} />;
};
