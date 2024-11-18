"use client";

import type { CopyButtonProps } from "ui/copy-button";
import { CopyButton } from "ui/copy-button";

type Props = Omit<CopyButtonProps, "value">;

export const FormLinkCopyButton = (props: Props) => {
	return <CopyButton value={window.location.href} {...props} />;
};
