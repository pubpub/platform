/**
 * @swagger
 * /api/integration/{instanceId}/pubs:
 *   get:
 *     tags:
 *       - Pubs
 *     summary: Finds all Pubs in an instance
 *     description: Returns all Pubs in an instance by Pubs
 *     responses:
 *       200:
 *         description: A pub
 *       400:
 *         description: Invalid ID
 *       404:
*          description: Pub not found
 */
export async function GET(request: Request) {
	// Return all pubs in scope for this instance
}

/*
export async function POST(request: Request) {
    // Create a new pub
}
*/
