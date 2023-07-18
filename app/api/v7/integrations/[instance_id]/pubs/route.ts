/**
 * @swagger
 * /api/integration/{instanceId}/pubs:
 *   get:
 *     description: Returns all Pubs in an instance by Pubs
 *     responses:
 *       200:
 *         description: A pub
 *       400:
 *          Invalid ID
 *       404:
 *          Pub not found
 */
export async function GET(request: Request) {
	// Return all pubs in scope for this instance
}

/*
export async function POST(request: Request) {
    // Create a new pub
}
*/
