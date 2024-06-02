"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
require("dotenv/config");
const fs_1 = require("fs");
const socket_io_1 = require("socket.io");
const types_1 = require("./types");
require("colors");
const body_parser_1 = __importDefault(require("body-parser"));
const app = (0, express_1.default)();
const storage = multer_1.default.diskStorage({
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
const upload = (0, multer_1.default)({ storage: storage });
const server = http_1.default.createServer(app);
exports.io = new socket_io_1.Server(server, { cors: { origin: "*" } });
app.use((0, cors_1.default)({
    origin: "https://ssdk.dev",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    exposedHeaders: ["set-cookie"],
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(body_parser_1.default.json({ limit: "50mb" }));
app.use(body_parser_1.default.urlencoded({ extended: true, limit: "50mb" }));
server.listen(process.env.SERVER_PORT || 5174, undefined, () => {
    console.log(`[Server] Stated at port ${process.env.SERVER_PORT}`.green);
});
app.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield types_1.User.register(req.body, res);
}));
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield types_1.User.login(req.body, res);
}));
app.post("/auth", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { access_token } = req.cookies;
    yield types_1.User.auth(access_token, res);
}));
app.get("/user/by-username", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.query.username;
    if (!username)
        return res.status(400).send("Username required");
    const user = yield types_1.User.find({ username: username });
    user ? res.status(200).send(user) : res.status(400).send("User not found");
}));
app.get("/user", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield types_1.User.find(req.query);
    return user ? res.send(user) : res.status(404).send({ error: "User not found" });
}));
app.post("/user/subscribe", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sender, receiver } = req.body;
    if (sender && receiver) {
        yield types_1.User.subscribe(sender, receiver);
        return res.status(200).send(yield types_1.User.find({ id: sender }));
    }
    return res.sendStatus(400);
}));
app.post("/user/unsubscribe", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sender, receiver } = req.body;
    if (sender && receiver) {
        yield types_1.User.unsubscribe(sender, receiver);
        return res.status(200).send(yield types_1.User.find({ id: sender }));
    }
    return res.sendStatus(400);
}));
app.get("/post", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const post = yield types_1.Post.fetch(req);
    if (post)
        res.status(200).send(post);
    else
        res.status(404).send("Post not found");
}));
app.post("/post", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title } = req.body;
    if (!title)
        return res.status(400).send("Empty title");
    types_1.Post.new(req, res);
}));
app.post("/post/attachment", upload.array("attachments"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (Array.isArray(req.files)) {
        const uploadedFileNames = req.files.map((file) => file.filename);
        res.send(uploadedFileNames);
    }
}));
app.post("/post/like", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    types_1.Post.like(req, res);
}));
app.post("/post/comment", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield types_1.Post.comment(req, res);
}));
app.get("/attachment/:id", (req, res) => {
    const file_path = path_1.default.join(__dirname, "../attachments/" + req.params.id);
    if ((0, fs_1.existsSync)(file_path))
        res.sendFile(file_path);
    else
        res.status(404).send("File does not exists");
});
exports.io.on("connection", (socket) => {
    // console.log("✅ connected");
    socket.on("disconnect", () => {
        // console.log("❌ disconnected");
    });
});
