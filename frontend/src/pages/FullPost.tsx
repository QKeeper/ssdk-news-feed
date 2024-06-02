import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { socket } from "@/features/socket/socket";
import { selectUser } from "@/features/user/userSlice";
import { useAppSelector } from "@/hooks/redux";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Forward, Heart, Loader2, MessageSquare, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IPost } from "@/types";

function FullPost() {
	const id = useParams().id;
	const user = useAppSelector(selectUser);
	const navigate = useNavigate();
	const [post, setPost] = useState<IPost>();

	useEffect(() => {
		axios
			.get(import.meta.env.VITE_API + "/post?id=" + id)
			.then((res) => setPost(res.data))
			.catch((err) => {
				if (err.response.status == 404) navigate("/404");
			});

		socket.on("postLike", (values) => {
			const { id, rating } = values;
			setPost((post) => {
				if (post?.id && post.id == id) return { ...post, rating: rating };
				return post;
			});
		});

		socket.on("postComment", (value) => {
			setPost((post) => {
				if (post && post.id == value.post) {
					return { ...post, comments: [value, ...post.comments] };
				}
				return post;
			});
		});

		return () => {
			socket.off("postLike");
			socket.off("postComment");
		};
	}, []);

	const handleLike = () => {
		axios
			.post(import.meta.env.VITE_API + "/post/like?id=" + post?.id, {}, { withCredentials: true })
			.catch((err) => console.error(err));
	};

	const inputField = useRef<HTMLTextAreaElement>(null);
	const handleSubmit = () => {
		if (inputField.current) {
			axios.post(
				import.meta.env.VITE_API + "/post/comment?id=" + post?.id,
				{ text: inputField.current.value },
				{ withCredentials: true }
			);
			inputField.current.value = "";
		}
	};

	if (!post) {
		return <Loader2 className="animate-spin size-10 mx-auto" />;
	}

	return (
		<div className="max-w-[600px] mx-auto w-full space-y-2 mb-32">
			<div className="bg-neutral-900 border rounded-lg p-4 break-words">
				<p className="text-muted-foreground text-sm">
					Posted by{" "}
					<span
						onClick={() =>
							axios
								.get(import.meta.env.VITE_API + "/user?id=" + post.author.id)
								.then((res) => navigate("/user/" + res.data.username))
								.catch((err) => console.error(err.response.data))
						}
						className="inline-flex items-center justify-center cursor-pointer whitespace-nowrap rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none hover:bg-accent hover:text-accent-foreground p-1 -mx-1"
					>
						{post.author.display_name}
					</span>{" "}
					at {new Date(post.date).toLocaleString()}
				</p>
				<h2 className="text-xl font-medium mt-2">{post.title}</h2>
				<p className="text-muted-foreground mt-2">{post.description}</p>

				<div about="attachments" className="flex flex-col gap-2 mt-2">
					{post.attachments.map((attachment) => (
						<div key={attachment} className="overflow-hidden rounded-xl max-h-[566px]">
							<img
								src={import.meta.env.VITE_API + "/attachment/" + attachment}
								className="w-full object-cover"
							/>
						</div>
					))}
				</div>

				<div about="footer" className="flex items-center gap-2 mt-2">
					<Button
						size="sm"
						variant="ghost"
						className="px-2"
						disabled={!user}
						onClick={() => {
							if (user) {
								handleLike();
							}
						}}
					>
						<Heart
							className={cn(
								"w-4 h-4 mr-2",
								user && post?.rating.includes(user.id) && "fill-red-500 text-red-500"
							)}
						/>
						<p>{post?.rating.length}</p>
					</Button>
					<Button size="sm" variant="ghost" className="px-2">
						<MessageSquare className="w-4 h-4 mr-2" />
						{post.comments.length} Comments
					</Button>
					<Button size="sm" variant="ghost" className="px-2">
						<Forward className="w-4 h-4 mr-2" />
						Share
					</Button>
				</div>
			</div>

			{!!user ? (
				<div className="bg-neutral-900 border rounded-lg p-4 break-words flex gap-2 items-center">
					<Textarea
						ref={inputField}
						placeholder="What are you thoughts?"
						className="bg-neutral-950"
					/>
					<Button size="icon" variant="ghost" onClick={handleSubmit}>
						<Send />
					</Button>
				</div>
			) : (
				<Button variant="secondary" onClick={() => navigate("/login")} className="w-full">
					Log in to your account to post comments.
				</Button>
			)}

			{post.comments.map((comment) => (
				<div className="bg-neutral-900 border rounded-lg p-4 break-words" key={comment.id}>
					<p className="text-sm text-muted-foreground">
						<span
							onClick={() =>
								axios
									.get(import.meta.env.VITE_API + "/user?id=" + comment.author)
									.then((res) => navigate("/user/" + res.data.username))
									.catch((err) => console.error(err.response.data))
							}
							className="inline-flex items-center justify-center cursor-pointer whitespace-nowrap rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none hover:bg-accent hover:text-accent-foreground p-1 -mx-1"
						>
							{comment.display_name}
						</span>{" "}
						• {new Date(comment.date).toLocaleString()}
					</p>
					<p>{comment.text}</p>
				</div>
			))}
		</div>
	);
}

export default FullPost;
