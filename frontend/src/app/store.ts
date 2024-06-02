import { counterSlice } from "@/features/counter/counterSlice";
import { userSlice } from "@/features/user/userSlice";
import { combineSlices, configureStore } from "@reduxjs/toolkit";

const rootReducer = combineSlices(counterSlice, userSlice);

export const store = configureStore({
	reducer: rootReducer,
	middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
