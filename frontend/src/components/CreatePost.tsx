import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { selectUser } from "@/features/user/userSlice";
import { useAppSelector } from "@/hooks/redux";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Image, X } from "lucide-react";
import axios from "axios";

const CreatePost = () => {
	const navigate = useNavigate();
	const user = useAppSelector(selectUser);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [attachments, setAttachments] = useState<File[]>([]);
	const [sending, setSending] = useState(false);
	const closeButton = useRef<HTMLButtonElement>(null);

	const onDrop = useCallback((acceptedFiles: File[]) => {
		const supportedTypes = ["image/jpg", "image/jpeg", "image/png", "image/webp", "image/gif"];
		acceptedFiles = acceptedFiles.filter((file) => supportedTypes.includes(file.type)); // Filter types
		acceptedFiles = acceptedFiles.filter((file) => file.size < 50 * 1024 * 1024); // Up to 50 MB
		setAttachments((attachments) => {
			// Exclude duplicates
			acceptedFiles = acceptedFiles.filter(
				(file) => !attachments.map((attachment) => attachment.name).includes(file.name)
			);
			return [...attachments, ...acceptedFiles];
		});
	}, []);

	const { getRootProps, getInputProps } = useDropzone({ onDrop });

	async function onSubmit() {
		if (title.length < 2) return;
		setSending(true);

		// Uploading attachments to server
		let files;
		if (attachments.length) {
			const fd = new FormData();
			attachments.forEach((attachment) => fd.append("attachments", attachment));
			files = await axios
				.post(import.meta.env.VITE_API + "/post/attachment", fd, {
					withCredentials: true,
					headers: { "Content-Type": "multipart/form-data" },
				})
				.then((res) => res.data)
				.catch((err) => console.error(err));
		}

		// Create a new post
		await axios
			.post(
				import.meta.env.VITE_API + "/post",
				{
					title: title,
					description: description,
					attachments: files,
				},
				{
					withCredentials: true,
				}
			)
			.catch((err) => console.error(err));

		setTimeout(() => setSending(false), 250);
	}

	if (!user)
		return (
			<Button variant="secondary" onClick={() => navigate("/login")} className="w-full">
				Log in to your account to create new posts
			</Button>
		);

	return (
		<Dialog>
			<DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 py-2 w-full">
				Create new Post
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create new post</DialogTitle>
				</DialogHeader>
				<div about="title">
					<Label htmlFor="title" className={cn(title.length < 2 && "text-red-500")}>
						Title
					</Label>
					<Input
						id="title"
						className="font-medium"
						value={title}
						onChange={(e) => setTitle(e.currentTarget.value)}
					/>
				</div>
				<div about="description">
					<Label htmlFor="description">Description</Label>
					<Textarea
						id="description"
						value={description}
						onChange={(e) => setDescription(e.currentTarget.value)}
					/>
				</div>
				<div className="grid grid-cols-5 gap-2">
					{attachments.map((image) => (
						<div
							key={image.name}
							className="aspect-square rounded-xl overflow-hidden relative"
							onClick={() => {
								setAttachments((attachments) =>
									attachments.filter((attachment) => attachment.name != image.name)
								);
							}}
						>
							<X className="absolute left-0 top-0 w-full h-full p-6 bg-neutral-950 bg-opacity-65 opacity-0 hover:opacity-100 duration-100" />
							<img
								src={URL.createObjectURL(image)}
								className="pointer-events-none select-none object-cover w-full h-full"
							/>
						</div>
					))}
				</div>

				<DialogFooter>
					<Button variant="ghost" className="mr-auto" {...getRootProps()}>
						<Input {...getInputProps()} />
						<Image className="w-4 h-4 mr-2" />
						Attach image
					</Button>
					<DialogClose type="submit" onClick={onSubmit} asChild>
						<Button disabled={sending || title.length < 2}>Post</Button>
					</DialogClose>
					<DialogClose ref={closeButton} className="hidden"></DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default CreatePost;
