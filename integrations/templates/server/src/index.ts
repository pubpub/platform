import express from "express";

const app = express();
const integration = express.Router();

app.use(express.static("public"));

integration.get("/:integrationId/configure", (req, res, next) => {
	next();
});

integration.get("/:integrationId/pub/:pubId", (req, res, next) => {
	next();
});

app.use("/integration", integration);

app.all("*", (req, res) => {
	res.status(404).send("Not Found");
});

app.listen(process.env.PORT, () => {
	console.log(`server is running on port ${process.env.PORT}`);
});
