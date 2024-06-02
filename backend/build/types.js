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
exports.Post = exports.User = void 0;
const db_1 = require("./db");
const utils_1 = require("./utils");
const bcrypt_1 = __importDefault(require("bcrypt"));
const _1 = require(".");
class User {
    constructor(values) {
        this.id = values.id;
        this.username = values.username;
        this.email = values.email;
        this.password = values.password;
        this.display_name = values.display_name;
    }
    static new(values) {
        return __awaiter(this, void 0, void 0, function* () {
            // async constructor for User
            let user = new User(values);
            const { followers, following, friends } = yield User.subs(user.id);
            return Object.assign(Object.assign({}, user), { followers: followers, following: following, friends: friends });
        });
    }
    static subs(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // subscribe user to another user
            const client = yield db_1.pool.connect();
            let following = (yield client.query(`SELECT * FROM subs WHERE sender = ${id}`)).rows.map((a) => a.receiver);
            let followers = (yield client.query(`SELECT * FROM subs WHERE receiver = ${id}`)).rows.map((a) => a.sender);
            client.release();
            const friends = following.filter((val) => {
                return followers.includes(val);
            });
            following = following.filter((val) => !friends.includes(val));
            followers = followers.filter((val) => !friends.includes(val));
            return {
                followers: followers,
                following: following,
                friends: friends,
            };
        });
    }
    static auth(access_token, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const username = (0, utils_1.jwtVerify)(access_token);
            if (username) {
                const client = yield db_1.pool.connect();
                const select = yield client.query(`SELECT * FROM users WHERE username = '${username}'`);
                const user = yield User.new(select.rows[0]);
                client.release();
                delete user.password;
                res.send(user);
            }
            else {
                res.sendStatus(401);
            }
        });
    }
    static login(values, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.pool.connect();
            const select = yield client.query(`SELECT * FROM users WHERE
			(username = '${values.username.toLowerCase()}' OR email = '${values.username.toLowerCase()}')`);
            client.release();
            if (!select.rows[0]) {
                return res.status(409).send("Wrong Username or Email");
            }
            const user = yield User.new(select.rows[0]);
            if (!(yield bcrypt_1.default.compare(values.password, user.password))) {
                return res.status(409).send("Wrong Password");
            }
            delete user.password;
            res
                .cookie("access_token", (0, utils_1.jwtSign)(user.username), { httpOnly: false, domain: "ssdk.dev" })
                .status(200)
                .send(user);
        });
    }
    static register(values, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!values.username || !values.password || !values.email) {
                return res.sendStatus(400);
            }
            const client = yield db_1.pool.connect();
            const select_username = yield client.query(`SELECT * FROM users WHERE username = '${values.username.toLowerCase()}'`);
            if (select_username.rowCount) {
                client.release();
                return res.status(409).send("Username already in use");
            }
            const select_email = yield client.query(`SELECT * FROM users WHERE email = '${values.email.toLowerCase()}'`);
            if (select_email.rowCount) {
                client.release();
                return res.status(409).send("Email already in use");
            }
            const insert = yield client.query(`INSERT INTO users (username, email, password, display_name)
			VALUES (
				'${values.username.toLowerCase()}',
				'${values.email.toLowerCase()}',
				'${yield bcrypt_1.default.hash(values.password, 10)}',
				'${values.username}')
			RETURNING *`);
            client.release();
            const user = yield User.new(insert.rows[0]);
            delete user.password;
            res
                .cookie("access_token", (0, utils_1.jwtSign)(values.username), { httpOnly: false, domain: "ssdk.dev" })
                .status(200)
                .send(user);
        });
    }
    static find(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, username } = options;
            const client = yield db_1.pool.connect();
            let select;
            if (id) {
                select = yield client.query(`SELECT * FROM users WHERE id = ${id}`);
            }
            else if (username) {
                select = yield client.query(`SELECT * FROM users WHERE username = '${username}'`);
            }
            client.release();
            if (select && select.rowCount) {
                const user = yield User.new(select.rows[0]);
                delete user.password;
                return user;
            }
            return;
        });
    }
    static subscribe(sender, receiver) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.pool.connect();
            yield client.query(`
		INSERT INTO subs (sender, receiver)
		VALUES (${sender}, ${receiver})
		ON CONFLICT DO NOTHING`);
            client.release();
        });
    }
    static unsubscribe(sender, receiver) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.pool.connect();
            yield client.query(`DELETE FROM subs WHERE sender = ${sender} AND receiver = ${receiver}`);
            client.release();
        });
    }
}
exports.User = User;
class Post {
    constructor(author, title, description, attachments) {
        this.author = author;
        this.title = title;
        this.description = description;
        this.attachments = attachments;
    }
    static new(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { title, description, attachments } = req.body;
            const { access_token } = req.cookies;
            const username = (0, utils_1.jwtVerify)(access_token);
            const user = username && (yield User.find({ username: username }));
            if (!user)
                return res.sendStatus(400);
            const client = yield db_1.pool.connect();
            const post = (yield client.query(`
			INSERT INTO posts (author, date, title, description, attachments)	VALUES (
				${user.id}, to_timestamp(${Date.now() / 1000.0}), '${title}', '${description}',
				ARRAY[${attachments ? attachments.map((attachment) => `'${attachment}'`) : ""}]::text[]
			) RETURNING *
			`)).rows[0];
            post.comments = (yield client.query(`SELECT * FROM comments WHERE post = ${post.id}`)).rows;
            post.author = yield User.find({ id: post.author });
            client.release();
            _1.io.emit("postNew", post);
            res.send(post);
        });
    }
    static fetch(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.query;
            const client = yield db_1.pool.connect();
            if (id) {
                const post = yield client.query(`SELECT * FROM posts WHERE id = ${id}`);
                if (!post.rowCount)
                    return client.release();
                const user = yield User.find({ id: post.rows[0].author });
                const comments = yield client.query(`
			SELECT comments.*, users.display_name FROM comments
			JOIN users ON (comments.author = users.id)
			WHERE post = ${id}
			ORDER BY date DESC`);
                client.release();
                post.rows[0].comments = comments.rows;
                post.rows[0].author = user;
                return post.rows[0];
            }
            const posts = (yield client.query(`SELECT * FROM posts ORDER BY date DESC`)).rows;
            for (const post of posts) {
                post.author = yield User.find({ id: post.author });
                post.comments = (yield client.query(`SELECT * FROM comments WHERE post = ${post.id}`)).rows;
            }
            client.release();
            return posts;
        });
    }
    static like(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.query;
            const { access_token } = req.cookies;
            const username = (0, utils_1.jwtVerify)(access_token);
            if (!username)
                return res.sendStatus(401);
            const user = yield User.find({ username: username });
            if (!user)
                return res.sendStatus(400);
            const client = yield db_1.pool.connect();
            const update = yield client.query(`
		WITH updated as (UPDATE posts
			SET rating =
				CASE
					WHEN NOT ${user.id} = ANY (rating) THEN ARRAY_APPEND(rating, ${user.id})
					ELSE ARRAY_REMOVE(rating, ${user.id})
				END
			WHERE id = ${id}
			RETURNING rating)
		SELECT rating FROM updated`);
            client.release();
            const { rating } = update.rows[0];
            _1.io.emit("postLike", { id: id, rating: rating });
            res.sendStatus(200);
        });
    }
    static comment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.query;
            const { access_token } = req.cookies;
            const { text } = req.body;
            if (!text)
                return res.status(400).send("Empty comment");
            const username = (0, utils_1.jwtVerify)(access_token);
            if (!username)
                return res.sendStatus(401);
            const user = yield User.find({ username: username });
            if (!user)
                return res.status(400).send("User not found");
            const client = yield db_1.pool.connect();
            const update = yield client.query(`
		WITH updated AS (INSERT INTO comments (author, post, date, text)
		VALUES (${user.id}, ${id}, to_timestamp(${Date.now() / 1000.0}), '${text}') RETURNING *)
		SELECT updated.*, display_name FROM updated
		JOIN users ON (updated.author = users.id)`);
            client.release();
            _1.io.emit("postComment", update.rows[0]);
            res.sendStatus(200);
        });
    }
}
exports.Post = Post;
