export type ManifestJson = {
	read?: { [key: string]: { id: string } } | string
	write?: { [key: string]: { id: string } } | string
	register?: { [key: string]: { id: string } }
}

export type Manifest = {
	read?: { [key: string]: { id: string } } | "*"
	write?: { [key: string]: { id: string } } | "*"
	register?: { [key: string]: { id: string } }
}
