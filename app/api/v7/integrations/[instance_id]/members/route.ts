/**
 * @swagger
 * /api/integration/{instanceId}/members:
 *   get:
 *     description: Returns members for this instances stage
 *     responses:
 *       200:
 *         description: List of members 
 *         
 */
export async function GET(request: Request) {
	// Return all members in this instance's stage? TODO: clarify the use cases for this endpoint
}
