import { createAppSlice } from "@/app/createAppSlice";
import { IUser } from "@/types";
import { PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

interface UserSliceState {
	info?: IUser;
}

const initialState: UserSliceState = {};

export const userSlice = createAppSlice({
	name: "user",
	initialState,
	// Редюсеры
	reducers: (create) => ({
		// Записывает данные пользователя в стейт
		logIn: create.reducer((state, action: PayloadAction<IUser>) => {
			state.info = action.payload;
		}),
		// Удаляет данные из стейта
		logOut: create.reducer((state) => {
			delete state.info;
		}),
	}),
	// Селекторы
	selectors: {
		// Возвращает информацию о юзере
		selectUser: (user) => {
			return user.info;
		},
	},
	// Асинхронные редюсеры
	extraReducers: (builder) => {
		// Подписывает одного пользователя на другого
		builder
			.addCase(subscribe.fulfilled, (state, action) => {
				state.info = action.payload.data;
			})
			.addCase(unsubscribe.fulfilled, (state, action) => {
				state.info = action.payload.data;
			});
	},
});

export const { logIn, logOut } = userSlice.actions;
export const { selectUser } = userSlice.selectors;

interface subscribeProps {
	sender: number;
	receiver: number;
}

export const subscribe = createAsyncThunk(
	"user/subscribe",
	async ({ sender, receiver }: subscribeProps) => {
		const response = await axios.post(import.meta.env.VITE_API + "/user/subscribe", {
			// TODO: Поменять sender на access_token
			sender: sender,
			receiver: receiver,
		});
		return response;
	}
);

export const unsubscribe = createAsyncThunk(
	"user/unsubscribe",
	async ({ sender, receiver }: subscribeProps) => {
		const response = await axios.post(import.meta.env.VITE_API + "/user/unsubscribe", {
			// TODO: Поменять sender на access_token
			sender: sender,
			receiver: receiver,
		});
		return response;
	}
);
