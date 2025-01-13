import * as React from "react"

type Props = React.SVGProps<SVGSVGElement>

export const PubpubLogo = (props: Props) => (
	<svg xmlns="http://www.w3.org/2000/svg" width={100} height={114} {...props}>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={100}
			height={114}
			fill="none"
			viewBox="0 0 100 114"
			{...props}
		>
			<g fill="#000" opacity={0.89}>
				<rect width={80} height={60} x={20} rx={30} />
				<rect width={50} height={45} y={69} rx={22.5} />
			</g>
		</svg>
	</svg>
)
