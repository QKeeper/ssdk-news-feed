import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import path from "path";
import "dotenv/config";
import { existsSync } from "fs";
import { Server } from "socket.io";
import { Post, User } from "./types";
import "colors";
import bodyParser from "body-parser";

const app = express();

const storage = multer.diskStorage({
	destination(req, file, cb) {
		cb(null, "./attachments");
	},
	filename(req, file, cb) {
		const id = (Math.random() + 1).toString(36).substring(2);
		const { originalname } = file;
		const extension = file.originalname.split(".").pop();
		const filename = `${id}.${extension}`;
		cb(null, filename);
	},
});
const upload = multer({ storage: storage });

const server = http.createServer(app);

export const io = new Server(server, { cors: { origin: "*" } });

app.use(
	cors({
		origin: "https://ssdk.dev",
		methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true,
		exposedHeaders: ["set-cookie"],
	})
);

app.use(express.json());
app.use(cookieParser());

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

server.listen(process.env.SERVER_PORT || 5174, undefined, () => {
	console.log(`[Server] Stated at port ${process.env.SERVER_PORT}`.green);
});

app.post("/register", async (req, res) => {
	await User.register(req.body, res);
});

app.post("/login", async (req, res) => {
	await User.login(req.body, res);
});

app.post("/auth", async (req, res) => {
	const { access_token } = req.cookies;
	await User.auth(access_token, res);
});

app.get("/user/by-username", async (req, res) => {
	const username = req.query.username as string;
	if (!username) return res.status(400).send("Username required");
	const user = await User.find({ username: username });
	user ? res.status(200).send(user) : res.status(400).send("User not found");
});

app.get("/user", async (req, res) => {
	const user = await User.find(req.query);
	return user ? res.send(user) : res.status(404).send({ error: "User not found" });
});

app.post("/user/subscribe", async (req, res) => {
	const { sender, receiver } = req.body;
	if (sender && receiver) {
		await User.subscribe(sender, receiver);
		return res.status(200).send(await User.find({ id: sender }));
	}
	return res.sendStatus(400);
});

app.post("/user/unsubscribe", async (req, res) => {
	const { sender, receiver } = req.body;
	if (sender && receiver) {
		await User.unsubscribe(sender, receiver);
		return res.status(200).send(await User.find({ id: sender }));
	}
	return res.sendStatus(400);
});

app.get("/post", async (req, res) => {
	const post = await Post.fetch(req);
	if (post) res.status(200).send(post);
	else res.status(404).send("Post not found");
});

app.post("/post", async (req, res) => {
	const { title } = req.body;
	if (!title) return res.status(400).send("Empty title");
	Post.new(req, res);
});

app.post("/post/attachment", upload.array("attachments"), async (req, res) => {
	if (Array.isArray(req.files)) {
		const uploadedFileNames = req.files.map((file) => file.filename);
		res.send(uploadedFileNames);
	}
});

app.post("/post/like", async (req, res) => {
	Post.like(req, res);
});

app.post("/post/comment", async (req, res) => {
	await Post.comment(req, res);
});

app.get("/attachment/:id", (req, res) => {
	const file_path = path.join(__dirname, "../attachments/" + req.params.id);
	if (existsSync(file_path)) res.sendFile(file_path);
	else res.status(404).send("File does not exists");
});

io.on("connection", (socket) => {
	// console.log("✅ connected");
	socket.on("disconnect", () => {
		// console.log("❌ disconnected");
	});
});
