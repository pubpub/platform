"use client";

import { useState, useRef, useEffect } from "react";

export default function Features() {
	const [tab, setTab] = useState<number>(1);

	const tabs = useRef<HTMLDivElement>(null);

	const heightFix = () => {
		if (tabs.current && tabs.current.parentElement)
			tabs.current.parentElement.style.height = `${tabs.current.clientHeight}px`;
	};

	useEffect(() => {
		heightFix();
	}, []);

	return (
		<section className="relative">
			{/* Section background (needs .relative class on parent and next sibling elements) */}
			<div
				className="absolute inset-0 bg-gray-100 pointer-events-none mb-16"
				aria-hidden="true"
			></div>
			<div className="absolute left-0 right-0 m-auto w-px p-px h-20 bg-gray-200 transform -translate-y-1/2"></div>

			<div className="relative max-w-6xl mx-auto px-4 sm:px-6">
				<div className="pt-12 md:pt-20">
					{/* Section header */}
					<div className="max-w-3xl mx-auto text-center pb-12 md:pb-16">
						<h1 className="h2 mb-4">
							Enhancing open publishing by giving you the flexibility to collaborate
							the way you want
						</h1>
						<p className="text-xl text-gray-600">
							We provide core integrations for your workflows that allow you to submit
							pubs to your Community
						</p>
					</div>

					{/* Section content */}
					<div className="max-w-3xl mx-auto text-center pb-12 md:pb-16">
						{/* Content */}
						<div
							className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-7 lg:col-span-6 md:mt-6"
							data-aos="fade-right"
						>
							<div className="md:pr-4 lg:pr-12 xl:pr-16 mb-8">
								<h3 className="h3 mb-3">
									Minimally configured tools for publishing
								</h3>
								<p className="text-xl text-gray-600">
									Our platform along with our core integrations make managing your
									publishing process easy. We provide the tools to help you expand
									the platform to meet your needs.
								</p>
							</div>
							{/* Tabs buttons */}
							<div className="mb-8 md:mb-0">
								<a
									className={`flex items-center text-lg p-5 rounded border transition duration-300 ease-in-out mb-3 ${
										tab !== 1
											? "bg-white shadow-md border-gray-200 hover:shadow-lg"
											: "bg-gray-200 border-transparent"
									}`}
									href="#0"
									onClick={(e) => {
										e.preventDefault();
										setTab(1);
									}}
								>
									<div>
										<div className="font-bold leading-snug tracking-tight mb-1">
											Pubs
										</div>
										<div className="text-gray-600">
											Define arbitrailry structured content to publish,
											review, and currate. Literally anything. Yes, anything.
										</div>
									</div>
								</a>
								<a
									className={`flex items-center text-lg p-5 rounded border transition duration-300 ease-in-out mb-3 ${
										tab !== 2
											? "bg-white shadow-md border-gray-200 hover:shadow-lg"
											: "bg-gray-200 border-transparent"
									}`}
									href="#0"
									onClick={(e) => {
										e.preventDefault();
										setTab(2);
									}}
								>
									<div>
										<div className="font-bold leading-snug tracking-tight mb-1">
											Stages
										</div>
										<div className="text-gray-600">
											Move pubs between stages your community defines to
											create incredibly flexible workflows.
										</div>
									</div>
								</a>
								<a
									className={`flex items-center text-lg p-5 rounded border transition duration-300 ease-in-out mb-3 ${
										tab !== 3
											? "bg-white shadow-md border-gray-200 hover:shadow-lg"
											: "bg-gray-200 border-transparent"
									}`}
									href="#0"
									onClick={(e) => {
										e.preventDefault();
										setTab(3);
									}}
								>
									<div>
										<div className="font-bold leading-snug tracking-tight mb-1">
											Integrations
										</div>
										<div className="text-gray-600">
											Our core integrations are powerful enough for you to set
											up powerful workflows, but we can't do everything. We
											provide the tools to help you expand the platform to
											meet your needs.
										</div>
									</div>
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
