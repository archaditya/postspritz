import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import analyticsReducer from './slices/analyticsSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    analytics: analyticsReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
