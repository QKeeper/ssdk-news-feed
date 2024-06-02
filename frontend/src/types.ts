export interface IUser {
	id: number;
	username: string;
	email: string;
	display_name: string;
	followers: number[];
	following: number[];
	friends: number[];
}

export interface IPost {
	id: number;
	author: IUser;
	date: string;
	title: string;
	description: string;
	rating: number[];
	attachments: string[];
	comments: IComment[];
}

export interface IComment {
	id: number;
	author: number;
	display_name: string;
	post: number;
	text: string;
	date: string;
}
