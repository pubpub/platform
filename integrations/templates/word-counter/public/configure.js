/**
 *
 * @this {import("../types").Config}
 */
async function updateConfig() {
	const instance = window.Alpine.store("instance");
	const response = await fetch(`/api/instance/${instance.id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			words: this.words,
			lines: this.lines,
		}),
	});
	if (response.ok) {
		this.updated = true;
	}
	return response.json();
}

/**
 *
 * @this {import("../types").Config}
 */
function toggleLines(event) {
	if (this.lines && !this.words) {
		event.preventDefault();
	} else {
		this.lines = !this.lines;
	}
	updateConfig.call(this);
}

/**
 *
 * @this {import("../types").Config}
 */
function toggleWords(event) {
	if (this.words && !this.lines) {
		event.preventDefault();
	} else {
		this.words = !this.words;
	}
	updateConfig.call(this);
}
