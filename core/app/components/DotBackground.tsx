import { cn } from "utils";

export const DotBackground = ({ className }: { className?: string }) => (
	<svg
		aria-hidden="true"
		className={cn(
			"pointer-events-none absolute inset-0 z-0 h-full w-full fill-neutral-500/80",
			className
		)}
	>
		<defs>
			<pattern
				id=":r2R0:"
				width="24"
				height="24"
				patternUnits="userSpaceOnUse"
				patternContentUnits="userSpaceOnUse"
				x="0"
				y="0"
			>
				<circle id="pattern-circle" cx="1" cy="1" r="1"></circle>
			</pattern>
		</defs>
		<rect width="100%" height="100%" stroke-width="0" fill="url(#:r2R0:)"></rect>
	</svg>
);
