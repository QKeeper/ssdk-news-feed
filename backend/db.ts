import "dotenv/config";
import { Pool } from "pg";

export const pool = new Pool({
	host: process.env.PG_HOST,
	user: process.env.PG_USER,
	password: process.env.PG_PASS,
	database: process.env.PG_DATABASE,
	max: 3,
});
