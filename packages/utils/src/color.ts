export const isColorDark = (color: string) => {
	// Convert hex to RGB
	const hex = color.replace("#", "")
	const r = parseInt(hex.substring(0, 2), 16)
	const g = parseInt(hex.substring(2, 4), 16)
	const b = parseInt(hex.substring(4, 6), 16)

	// Calculate perceived brightness using the formula
	// (0.299*R + 0.587*G + 0.114*B)
	const brightness = 0.299 * r + 0.587 * g + 0.114 * b

	// Return true if the color is dark (brightness < 128)
	return brightness < 128
}
