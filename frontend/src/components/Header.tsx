import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { GalleryVertical, Home, LogIn, User } from "lucide-react";
import { useAppSelector } from "@/hooks/redux";
import { selectUser } from "@/features/user/userSlice";
import { IUser } from "@/types";

const Header = () => {
	const navigate = useNavigate();
	const user = useAppSelector(selectUser);

	return (
		<div className="container flex items-center gap-4 h-12">
			<Button variant="ghost" disabled={true} onClick={() => navigate("/")}>
				<Home className="w-4 h-4 mr-2" />
				Home
			</Button>
			<Button variant="ghost" onClick={() => navigate("/feed")}>
				<GalleryVertical className="w-4 h-4 mr-2" />
				Feed
			</Button>
			{user ? (
				<ProfileButton className="ml-auto" user={user} />
			) : (
				<LoginButton className="ml-auto" />
			)}
		</div>
	);
};

export default Header;

function LoginButton(props: { className?: string }) {
	const navigate = useNavigate();
	return (
		<Button variant="ghost" onClick={() => navigate("/login")} className={props.className}>
			<LogIn className="w-4 h-4 mr-2" />
			Log in
		</Button>
	);
}

function ProfileButton(props: { className?: string; user: IUser }) {
	const navigate = useNavigate();

	return (
		<Button
			variant="ghost"
			onClick={() => navigate("/user/" + props.user.username)}
			className={props.className}
		>
			<User className="w-4 h-4 mr-2" />
			{props.user.display_name}
		</Button>
	);
}
