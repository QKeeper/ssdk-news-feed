import axios from "axios";
import { useState, useEffect } from "react";
import { socket } from "@/features/socket/socket";
import CreatePost from "@/components/CreatePost";
import Post from "@/components/Post";
import { IComment, IPost } from "@/types";
import { Loader2 } from "lucide-react";

const Feed = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [posts, setPosts] = useState<IPost[]>([]);

	function onNewPost(value: any) {
		setPosts((posts) => [value, ...posts]);
	}

	function onPostLike(value: any) {
		setPosts((posts) =>
			posts.map((post) => (post.id == value.id ? { ...post, rating: value.rating } : post))
		);
	}

	function onPostComment(comment: IComment) {
		setPosts((posts) =>
			posts.map((post) =>
				post.id == comment.post ? { ...post, comments: [comment, ...post.comments] } : post
			)
		);
	}

	useEffect(() => {
		axios
			.get(import.meta.env.VITE_API + "/post")
			.then((res) => {
				setPosts(res.data);
				setIsLoading(false);
			})
			.catch((err) => console.log(err));

		socket.on("foo", (values) => console.log(values));
		socket.on("postNew", onNewPost);
		socket.on("postLike", onPostLike);
		socket.on("postComment", onPostComment);

		return () => {
			socket.off("foo");
			socket.off("postNew");
			socket.off("postLike");
			socket.off("postComment");
		};
	}, []);

	if (isLoading) {
		return <Loader2 className="animate-spin size-10 mx-auto" />;
	}

	return (
		<div className="max-w-[600px] mx-auto w-full space-y-2 mb-32">
			<CreatePost />
			{posts.map((post) => {
				return <Post {...post} key={post.id} />;
			})}
		</div>
	);
};

export default Feed;
