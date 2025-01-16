"use client";

import dynamic from "next/dynamic";

import type { CopyButtonProps } from "ui/copy-button";
import { CopyButton } from "ui/copy-button";

type Props = Omit<CopyButtonProps, "value">;

const CopyCurrentUrlButtonBase = (props: Props) => {
	return <CopyButton value={window.location.href} {...props} />;
};

// necessary in order to disable SSR, as window is not available on the server
export const CopyCurrentUrlButton = dynamic(() => Promise.resolve(CopyCurrentUrlButtonBase), {
	ssr: false,
});
