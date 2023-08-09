export async function POST(request: Request) {
	// TODO: is this too much power for integrations? should we approve templates? a malicious
	// integration sending a mass email on our behalf can't be undone
	// send email to specified users, substituting values from pubs/recipients, and creating users if they don't exist
	// return identity tokens for newly created users
}
