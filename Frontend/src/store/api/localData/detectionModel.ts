import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface DetectionModel {
    selectedModel: string;
}

const initialState: DetectionModel = {
    selectedModel: "",
}

const detectionModelSlice = createSlice({
    name: "detectionModel",
    initialState,
    reducers: {
        setDetectionModel: (state, action: PayloadAction<string>) => {
            state.selectedModel = action.payload;
        }
    }
});

export const { setDetectionModel } = detectionModelSlice.actions;
export default detectionModelSlice.reducer;