import http from "node:http";
import { type CoarNotifyPayload } from "./coar-notify-payloads";

export class MockPreprintRepo {
	private server: http.Server | null = null;
	private receivedNotifications: CoarNotifyPayload[] = [];
	public port = 0;
	public url = "";

	async start(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.server = http.createServer((req, res) => {
				// CORS headers
				res.setHeader("Access-Control-Allow-Origin", "*");
				res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
				res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

				if (req.method === "OPTIONS") {
					res.writeHead(204);
					res.end();
					return;
				}

				if (req.method === "POST" && req.url === "/inbox") {
					let body = "";
					req.on("data", (chunk) => {
						body += chunk.toString();
					});
					req.on("end", () => {
						try {
							const payload = JSON.parse(body) as CoarNotifyPayload;
							this.receivedNotifications.push(payload);
							res.writeHead(201, { "Content-Type": "application/json" });
							res.end(JSON.stringify({ status: "accepted" }));
						} catch (error) {
							res.writeHead(400, { "Content-Type": "application/json" });
							res.end(JSON.stringify({ error: "Invalid JSON" }));
						}
					});
				} else {
					res.writeHead(404);
					res.end();
				}
			});

			this.server.listen(0, () => {
				const address = this.server?.address();
				if (address && typeof address === "object") {
					this.port = address.port;
					this.url = `http://localhost:${this.port}`;
					resolve();
				} else {
					reject(new Error("Failed to get server address"));
				}
			});

			this.server.on("error", (err) => {
				reject(err);
			});
		});
	}

	async stop(): Promise<void> {
		return new Promise((resolve) => {
			if (this.server) {
				this.server.close(() => {
					resolve();
				});
			} else {
				resolve();
			}
		});
	}

	getReceivedNotifications(): CoarNotifyPayload[] {
		return this.receivedNotifications;
	}

	clearReceivedNotifications(): void {
		this.receivedNotifications = [];
	}

	async sendNotification(targetUrl: string, payload: CoarNotifyPayload): Promise<void> {
		return new Promise((resolve, reject) => {
			const url = new URL(targetUrl);
			const options = {
				hostname: url.hostname,
				port: url.port,
				path: url.pathname + url.search,
				method: "POST",
				headers: {
					"Content-Type": "application/ld+json",
				},
			};

			const req = http.request(options, (res) => {
				if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
					resolve();
				} else {
					reject(new Error(`Failed to send notification: ${res.statusCode}`));
				}
			});

			req.on("error", (err) => {
				reject(err);
			});

			req.write(JSON.stringify(payload));
			req.end();
		});
	}
}

