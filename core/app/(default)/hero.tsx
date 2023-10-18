import Link from "next/link";

export default function Hero() {
	return (
		<section className="relative">
			{/* Illustration behind hero content */}
			<div
				className="absolute left-1/2 transform -translate-x-1/2 bottom-0 pointer-events-none -z-1"
				aria-hidden="true"
			>
				<svg
					width="1360"
					height="578"
					viewBox="0 0 1360 578"
					xmlns="http://www.w3.org/2000/svg"
				>
					<defs>
						<linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="illustration-01">
							<stop stopColor="#FFF" offset="0%" />
							<stop stopColor="#EAEAEA" offset="77.402%" />
							<stop stopColor="#DFDFDF" offset="100%" />
						</linearGradient>
					</defs>
					<g fill="url(#illustration-01)" fillRule="evenodd">
						<circle cx="1232" cy="128" r="128" />
						<circle cx="155" cy="443" r="64" />
					</g>
				</svg>
			</div>

			<div className="max-w-6xl mx-auto px-4 sm:px-6">
				{/* Hero content */}
				<div className="pt-32 pb-12 md:pt-40 md:pb-20">
					{/* Section header */}
					<div className="text-center pb-12 md:pb-16">
						<h1 className="text-4xl md:text-5xl font-extrabold leading-tighter tracking-tighter mb-4">
							FISCH
						</h1>
						<h1 className="text-4xl md:text-5xl font-extrabold leading-tighter tracking-tighter mb-4">
							Wonderful workflows for{" "}
							<span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-teal-400">
								publishing
							</span>
						</h1>
						<div className="max-w-3xl mx-auto">
							<p
								className="text-xl text-gray-600 mb-8"
								data-aos="zoom-y-out"
								data-aos-delay="150"
							>
								We provide the flexibility for you to define various stages to move
								your digital artifacts through your publishing proccess. These
								artifacts can be arbitraitly defined by you and your community.
							</p>
							<div
								className="max-w-xs mx-auto sm:max-w-none sm:flex sm:justify-center"
								data-aos="zoom-y-out"
								data-aos-delay="300"
							>
								<div>
									<Link
										className="btn text-white bg-purple-600 hover:bg-purple-700 w-full mb-4 sm:w-auto sm:mb-0"
										href="c/join"
									>
										Join a community
									</Link>
								</div>

								<div>
									<Link
										className="btn text-white bg-teal-500 hover:bg-teal-800 w-full sm:w-auto sm:ml-4"
										href="pricing"
									>
										Pricing
									</Link>
								</div>
								<div>
									<Link
										className="btn text-white bg-gray-900 hover:bg-gray-800 w-full sm:w-auto sm:ml-4"
										href="blog"
									>
										Learn more
									</Link>
								</div>
							</div>
						</div>
					</div>

					{/* Hero image */}
				</div>
			</div>
		</section>
	);
}
