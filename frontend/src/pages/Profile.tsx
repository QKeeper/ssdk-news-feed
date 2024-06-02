import { useState } from "react";
import { logOut, selectUser, subscribe, unsubscribe } from "@/features/user/userSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import axios from "axios";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, Mail, Pencil, UserMinus2, UserPlus2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCookie } from "react-use";
import { IUser } from "@/types";

const Profile = () => {
	const username = useParams().username;
	const dispatch = useAppDispatch();
	const auth_user = useAppSelector(selectUser);
	const own_profile = auth_user && auth_user.username == username;
	const [user, setUser] = useState<IUser>();
	const navigate = useNavigate();

	useEffect(() => {
		axios
			.get(import.meta.env.VITE_API + "/user?username=" + username)
			.then((res) => {
				setUser(res.data);
			})
			.catch((err) => {
				if (err.response.status == 404) navigate("/404");
			});
	}, [username]);

	if (!user) return <Loader2 className="size-10 mx-auto animate-spin" />;

	return (
		<div className="flex flex-col gap-2 mt-8">
			<h2 className="text-center text-4xl font-medium">{user.display_name}</h2>
			<p className="text-center text-xl text-muted-foreground">@{user.username}</p>
			{own_profile ? (
				<OwnButtons className="mx-auto mt-4" />
			) : (
				<OtherButtons
					className="mx-auto mt-4"
					auth_user={auth_user!}
					user={user}
					dispatch={dispatch}
				/>
			)}
		</div>
	);
};

export default Profile;

interface OwnButtonsProps {
	className?: string;
}

function OwnButtons({ className }: OwnButtonsProps) {
	const [, , deleteToken] = useCookie("access_token");
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	return (
		<div className={cn("grid grid-cols-2 w-[320px] gap-2", className)}>
			<Button variant="outline" disabled={true}>
				<Pencil className="size-4 mr-2" />
				Edit
			</Button>
			<Button
				variant="outline"
				onClick={() => {
					dispatch(logOut());
					deleteToken();
					navigate("/login");
				}}
			>
				<LogOut className="size-4 mr-2" />
				Log out
			</Button>
			<Button variant="outline" disabled={true}>
				<Users className="size-4 mr-2" />
				Friends
			</Button>
		</div>
	);
}

interface OtherButtonsProps {
	className?: string;
	auth_user: IUser;
	user: IUser;
	dispatch: any;
}

function OtherButtons(props: OtherButtonsProps) {
	const { auth_user, user, dispatch, className } = props;
	let mainButton;
	if (!auth_user) {
		mainButton = null;
	} else if (auth_user.friends.includes(user.id) || auth_user.following.includes(user.id))
		mainButton = (
			<Button
				variant="secondary"
				onClick={() => dispatch(unsubscribe({ sender: auth_user.id, receiver: user.id }))}
			>
				<UserMinus2 className="size-4 mr-2" />
				{auth_user.friends.includes(user.id) ? "Unfriend" : "Unfollow"}
			</Button>
		);
	else
		mainButton = (
			<Button onClick={() => dispatch(subscribe({ sender: auth_user.id, receiver: user.id }))}>
				<UserPlus2 className="size-4 mr-2" />
				{auth_user.followers.includes(user.id) ? "Accept" : "Add Friend"}
			</Button>
		);

	return (
		<div className={cn("grid grid-cols-2 w-[320px] gap-2", className)}>
			{mainButton}
			{auth_user && (
				<Button disabled={true}>
					<Mail className="size-4 mr-2" />
					Message
				</Button>
			)}
			<Button variant="outline" disabled={true}>
				<Users className="size-4 mr-2" />
				Friends
			</Button>
		</div>
	);
}
