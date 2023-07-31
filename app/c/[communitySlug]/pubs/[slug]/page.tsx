export default function Page({ params }: { params: { slug: string } }) {
	return (
		<>
			<h1>Pub: {params.slug}</h1>
		</>
	);
}
