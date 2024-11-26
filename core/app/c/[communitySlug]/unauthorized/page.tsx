type Props = {
	params: {
		communitySlug: string;
	};
};

export default async function Page(props: Props) {
	return (
		<div className="flex h-full items-center justify-center">
			<div className="flex max-w-[444px] flex-col items-center justify-center">
				<h2 className="mb-2 text-2xl font-semibold text-gray-800">Unauthorized</h2>
				<p className="mb-6 text-center text-gray-600">
					You are not authorized to view this page.
				</p>
			</div>
		</div>
	);
}
