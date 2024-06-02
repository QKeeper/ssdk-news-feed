import { pool } from "./db";
import { Request, Response } from "express";
import { jwtSign, jwtVerify } from "./utils";
import bcrypt from "bcrypt";
import { io } from ".";

export class User {
	id: number;
	username: string;
	email: string;
	password?: string;
	display_name: string;
	followers?: number[];
	following?: number[];
	friends?: number[];

	constructor(values: any) {
		this.id = values.id;
		this.username = values.username;
		this.email = values.email;
		this.password = values.password;
		this.display_name = values.display_name;
	}

	static async new(values: any) {
		// async constructor for User
		let user = new User(values);
		const { followers, following, friends } = await User.subs(user.id);
		return { ...user, followers: followers, following: following, friends: friends };
	}

	private static async subs(id: number) {
		// subscribe user to another user
		const client = await pool.connect();
		let following: number[] = (
			await client.query(`SELECT * FROM subs WHERE sender = ${id}`)
		).rows.map((a) => a.receiver);

		let followers: number[] = (
			await client.query(`SELECT * FROM subs WHERE receiver = ${id}`)
		).rows.map((a) => a.sender);

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
	}

	static async auth(access_token: string, res: Response) {
		const username = jwtVerify(access_token);
		if (username) {
			const client = await pool.connect();
			const select = await client.query(`SELECT * FROM users WHERE username = '${username}'`);
			const user = await User.new(select.rows[0]);
			client.release();

			delete user.password;
			res.send(user);
		} else {
			res.sendStatus(401);
		}
	}

	static async login(values: { username: string; password: string }, res: Response) {
		const client = await pool.connect();
		const select = await client.query(
			`SELECT * FROM users WHERE
			(username = '${values.username.toLowerCase()}' OR email = '${values.username.toLowerCase()}')`
		);
		client.release();

		if (!select.rows[0]) {
			return res.status(409).send("Wrong Username or Email");
		}

		const user = await User.new(select.rows[0]);

		if (!(await bcrypt.compare(values.password, user.password!))) {
			return res.status(409).send("Wrong Password");
		}

		delete user.password;
		res
			.cookie("access_token", jwtSign(user.username), { httpOnly: false, domain: "ssdk.dev" })
			.status(200)
			.send(user);
	}

	static async register(
		values: { username: string; email: string; password: string },
		res: Response
	) {
		if (!values.username || !values.password || !values.email) {
			return res.sendStatus(400);
		}

		const client = await pool.connect();

		const select_username = await client.query(
			`SELECT * FROM users WHERE username = '${values.username.toLowerCase()}'`
		);

		if (select_username.rowCount) {
			client.release();
			return res.status(409).send("Username already in use");
		}

		const select_email = await client.query(
			`SELECT * FROM users WHERE email = '${values.email.toLowerCase()}'`
		);

		if (select_email.rowCount) {
			client.release();
			return res.status(409).send("Email already in use");
		}

		const insert = await client.query(
			`INSERT INTO users (username, email, password, display_name)
			VALUES (
				'${values.username.toLowerCase()}',
				'${values.email.toLowerCase()}',
				'${await bcrypt.hash(values.password, 10)}',
				'${values.username}')
			RETURNING *`
		);
		client.release();

		const user = await User.new(insert.rows[0]);
		delete user.password;
		res
			.cookie("access_token", jwtSign(values.username), { httpOnly: false, domain: "ssdk.dev" })
			.status(200)
			.send(user);
	}

	static async find(options: { id?: number | string; username?: string }) {
		const { id, username } = options;
		const client = await pool.connect();
		let select;

		if (id) {
			select = await client.query(`SELECT * FROM users WHERE id = ${id}`);
		} else if (username) {
			select = await client.query(`SELECT * FROM users WHERE username = '${username}'`);
		}

		client.release();

		if (select && select.rowCount) {
			const user = await User.new(select.rows[0]);
			delete user.password;
			return user;
		}
		return;
	}

	static async subscribe(sender: number, receiver: number) {
		const client = await pool.connect();
		await client.query(`
		INSERT INTO subs (sender, receiver)
		VALUES (${sender}, ${receiver})
		ON CONFLICT DO NOTHING`);
		client.release();
	}

	static async unsubscribe(sender: number, receiver: number) {
		const client = await pool.connect();
		await client.query(`DELETE FROM subs WHERE sender = ${sender} AND receiver = ${receiver}`);
		client.release();
	}
}

export class Post {
	constructor(
		public author: User,
		public title: string,
		public description: string,
		public attachments?: File[]
	) {}

	static async new(req: Request, res: Response) {
		const { title, description, attachments } = req.body;
		const { access_token } = req.cookies;
		const username = jwtVerify(access_token);
		const user = username && (await User.find({ username: username }));
		if (!user) return res.sendStatus(400);
		const client = await pool.connect();
		const post: any = (
			await client.query(`
			INSERT INTO posts (author, date, title, description, attachments)	VALUES (
				${user.id}, to_timestamp(${Date.now() / 1000.0}), '${title}', '${description}',
				ARRAY[${attachments ? attachments.map((attachment: string) => `'${attachment}'`) : ""}]::text[]
			) RETURNING *
			`)
		).rows[0];

		post.comments = (await client.query(`SELECT * FROM comments WHERE post = ${post.id}`)).rows;
		post.author = await User.find({ id: post.author });

		client.release();
		io.emit("postNew", post);
		res.send(post);
	}

	static async fetch(req: Request) {
		const { id } = req.query;
		const client = await pool.connect();
		if (id) {
			const post = await client.query(`SELECT * FROM posts WHERE id = ${id}`);
			if (!post.rowCount) return client.release();
			const user = await User.find({ id: post.rows[0].author });
			const comments = await client.query(`
			SELECT comments.*, users.display_name FROM comments
			JOIN users ON (comments.author = users.id)
			WHERE post = ${id}
			ORDER BY date DESC`);
			client.release();

			post.rows[0].comments = comments.rows;
			post.rows[0].author = user;

			return post.rows[0];
		}

		const posts = (await client.query(`SELECT * FROM posts ORDER BY date DESC`)).rows;

		for (const post of posts) {
			post.author = await User.find({ id: post.author });
			post.comments = (await client.query(`SELECT * FROM comments WHERE post = ${post.id}`)).rows;
		}

		client.release();
		return posts;
	}

	static async like(req: Request, res: Response) {
		const { id } = req.query;
		const { access_token } = req.cookies;
		const username = jwtVerify(access_token);
		if (!username) return res.sendStatus(401);
		const user = await User.find({ username: username });
		if (!user) return res.sendStatus(400);

		const client = await pool.connect();
		const update = await client.query(`
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
		io.emit("postLike", { id: id, rating: rating });
		res.sendStatus(200);
	}

	static async comment(req: Request, res: Response) {
		const { id } = req.query;
		const { access_token } = req.cookies;
		const { text } = req.body;
		if (!text) return res.status(400).send("Empty comment");
		const username = jwtVerify(access_token);
		if (!username) return res.sendStatus(401);
		const user = await User.find({ username: username });
		if (!user) return res.status(400).send("User not found");

		const client = await pool.connect();
		const update = await client.query(`
		WITH updated AS (INSERT INTO comments (author, post, date, text)
		VALUES (${user.id}, ${id}, to_timestamp(${Date.now() / 1000.0}), '${text}') RETURNING *)
		SELECT updated.*, display_name FROM updated
		JOIN users ON (updated.author = users.id)`);
		client.release();
		io.emit("postComment", update.rows[0]);
		res.sendStatus(200);
	}
}
