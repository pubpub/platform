import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/* clsx allows us to handle conditionals in classNames more easily */
/* twMerge purpose explained well here: https://github.com/dcastil/tailwind-merge/blob/v1.14.0/docs/what-is-it-for.md */

export default function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
