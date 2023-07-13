document.addEventListener("alpine:init", () => {
	Alpine.data("apply", () => ({
		words: 0,
		lines: 0,
		updated: false,
		async fetch() {
			const params = new URLSearchParams({
				instanceId: window.Alpine.store("instance").id,
				pubId: window.Alpine.store("pubId"),
			});
			const response = await fetch(`/apply?${params}`, {
				method: "POST",
			});
			if (response.ok) {
				Object.assign(this, await response.json());
				this.updated = true;
			}
		},
	}));
});
