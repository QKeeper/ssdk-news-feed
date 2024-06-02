import { selectUser } from "@/features/user/userSlice";
import { useAppSelector } from "@/hooks/redux";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Forward, Heart, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { IPost } from "@/types";

function Post(post: IPost) {
	const user = useAppSelector(selectUser);
	const navigate = useNavigate();

	const handleLike = () => {
		axios
			.post(import.meta.env.VITE_API + "/post/like?id=" + post.id, {}, { withCredentials: true })
			.catch((err) => console.error(err));
	};

	return (
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
				<Button size="sm" variant="ghost" className="px-2" disabled={!user} onClick={handleLike}>
					<Heart
						className={cn(
							"w-4 h-4 mr-2",
							user && post.rating.includes(user.id) && "fill-red-500 text-red-500"
						)}
					/>
					<p>{post.rating.length}</p>
				</Button>
				<Button
					size="sm"
					variant="ghost"
					className="px-2"
					onClick={() => navigate("/post/" + post.id)}
				>
					<MessageSquare className="w-4 h-4 mr-2" />
					<p>{post.comments.length} Comments</p>
				</Button>
				<Button size="sm" variant="ghost" className="px-2">
					<Forward className="w-4 h-4 mr-2" />
					<p>Share</p>
				</Button>
			</div>
		</div>
	);
}

export default Post;
