export default function Page({ params }: { params: { slug: string } }) {
	return (
		<>
			<h1>Workflow: {params.slug}</h1>
		</>
	);
}
