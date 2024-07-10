import type { SVGProps } from "react";

import { cn } from "utils";

const Logo = ({ className, ...props }: SVGProps<SVGSVGElement>) => {
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
export default Logo;
