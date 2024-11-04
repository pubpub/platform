import { Button } from "ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "ui/hover-card";

import type { FileUpload } from "~/lib/fields/fileUpload";

export function FileUploadPreview({ files }: { files: FileUpload }) {
	return (
		<ul>
			{files.map((file) => {
				return (
					<li key={file.fileName}>
						<HoverCard>
							<HoverCardTrigger asChild>
								<Button variant="link">{file.fileName}</Button>
							</HoverCardTrigger>
							<HoverCardContent className="m-auto w-auto space-y-1">
								<h4 className="text-sm font-semibold">
									{file.fileName} <br />
								</h4>
								<p className="pb-2 text-sm">
									The file is <strong>{file.fileSize}</strong> bytes in size. Its
									MIME type is <strong>{file.fileType}</strong>.
								</p>
								<Button variant="secondary">
									<a target="_blank" href={file.fileUploadUrl}>
										Open file in new tab
									</a>
								</Button>
							</HoverCardContent>
						</HoverCard>
					</li>
				);
			})}
		</ul>
	);
}
