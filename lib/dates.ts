export const getMonthAndDateString = () => {
	const date = new Date();
	return date.toLocaleString("default", { month: "short", day: "numeric" });
};
