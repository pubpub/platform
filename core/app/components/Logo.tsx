import type { SVGProps } from "react";

import { cn } from "utils";

export const Logo = ({ className, ...props }: SVGProps<SVGSVGElement>) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={100}
			height={114}
			className={cn("text-black dark:invert", className)}
			{...props}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width={100}
				height={114}
				fill="none"
				viewBox="0 0 100 114"
				{...props}
			>
				<g opacity={0.89}>
					<rect width={80} height={60} x={20} fill="currentColor" rx={30} />
					<rect width={50} height={45} y={69} fill="currentColor" rx={22.5} />
				</g>
			</svg>
		</svg>
	);
};

export const LogoWithText = ({ className }: { className?: string }) => (
	<div className={cn("container mx-auto flex items-center gap-2 py-5", className)}>
		<Logo width={24} height={24} />
		<span className="text-xl">
			<span className="font-medium text-muted-foreground">PubPub</span>{" "}
			<span className="font-bold">Platform</span>
		</span>
	</div>
);
