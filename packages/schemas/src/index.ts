import { Boolean, DateTime, Email, FileUpload, String, URL, UserId, Vector3 } from "./schemas";

export enum CoreSchemaType {
	String,
	Boolean,
	Vector3,
	DateTime,
	Email,
	URL,
	UserId,
	FileUpload,
}

export function getJsonSchemaByCoreSchemaType(coreSchemaType: CoreSchemaType) {
	switch (coreSchemaType) {
		case CoreSchemaType.String:
			return String;
		case CoreSchemaType.Boolean:
			return Boolean;
		case CoreSchemaType.Vector3:
			return Vector3;
		case CoreSchemaType.DateTime:
			return DateTime;
		case CoreSchemaType.Email:
			return Email;
		case CoreSchemaType.URL:
			return URL;
		case CoreSchemaType.UserId:
			return UserId;
		case CoreSchemaType.FileUpload:
			return FileUpload;
	}
}
