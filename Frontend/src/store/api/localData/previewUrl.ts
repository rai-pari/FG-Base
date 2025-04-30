import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PreviewUrl {
    previewUrl: string | null;
}

const initialState: PreviewUrl = {
    previewUrl: null
}

const previewUrlSlice = createSlice({
    name: "previewUrl",
    initialState,
    reducers: {
        setPreivewUrl: ( state, action: PayloadAction<string | null>) => {
            state.previewUrl = action.payload;
        }
    }
});

export const { setPreivewUrl } = previewUrlSlice.actions; 
export default previewUrlSlice.reducer;