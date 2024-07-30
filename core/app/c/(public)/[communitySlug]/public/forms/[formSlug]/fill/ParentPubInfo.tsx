import { HEADER_HEIGHT } from "~/lib/ui";

// Need to offset by the height of the nav bar since that is also sticky so taken out of flow layout
const OFFSET = HEADER_HEIGHT + 16;

export const ParentPubInfo = () => {
	return (
		<div className={`sticky rounded bg-gray-50 px-4 py-2`} style={{ top: `${OFFSET}px` }}>
			<p>TODO: parent pub info.</p> Lorem ipsum dolor sit amet, consectetur adipiscing elit.
			Donec posuere felis vel nisi rutrum, id tristique dolor ornare. Fusce dictum feugiat mi
			eget malesuada. In eu tincidunt nisi. Duis justo orci, hendrerit ac varius non, pretium
			a mi. Nullam sed mi sit amet ante hendrerit semper.
		</div>
	);
};
