import type { LucideProps } from "lucide-react";

import * as Icons from "./icon";

export type IconConfig = {
	name: string;
	variant?: "solid" | "outline";
	color?: string;
};

type DynamicIconProps = {
	icon: IconConfig | null | undefined;
	fallback?: keyof typeof Icons;
	size?: number | string;
	className?: string;
} & Omit<LucideProps, "size" | "color" | "className">;

const iconNameToComponent = (name: string): keyof typeof Icons | null => {
	const normalized = name
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join("");

	if (normalized in Icons) {
		return normalized as keyof typeof Icons;
	}

	return null;
};

export const DynamicIcon = ({
	icon,
	fallback = "Bot",
	size = 16,
	className,
	...props
}: DynamicIconProps) => {
	if (!icon?.name) {
		const FallbackIcon = Icons[fallback];
		return <FallbackIcon size={size} className={className} {...props} />;
	}

	const iconKey = iconNameToComponent(icon.name);

	if (!iconKey) {
		const FallbackIcon = Icons[fallback];
		return <FallbackIcon size={size} className={className} {...props} />;
	}

	const IconComponent = Icons[iconKey];

	return (
		<IconComponent
			size={size}
			className={className}
			style={icon.color ? { color: icon.color } : undefined}
			{...props}
		/>
	);
};
