export type Manifest = {
	read?: { [key: string]: { id: string } }
	write?: { [key: string]: { id: string } }
	register?: { [key: string]: { id: string } }
}
