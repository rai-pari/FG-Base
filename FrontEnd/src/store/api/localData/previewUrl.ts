import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Crop } from "react-image-crop";

interface PreviewUrl {
    previewUrl: string | null;
    capturedFrame: string | null,
    cropArea: Crop,
    isCoordinatesSent: boolean,
    isRegionSelected: boolean,
}

const initialState: PreviewUrl = {
    previewUrl: null,
    capturedFrame: null,
    cropArea: {
        unit: "px",
        x: 0,
        y: 0,
        width: 0,
        height: 0
    },
    isCoordinatesSent: false,
    isRegionSelected: false
}

const previewUrlSlice = createSlice({
    name: "previewUrl",
    initialState,
    reducers: {
        setPreivewUrl: ( state, action: PayloadAction<string | null>) => {
            state.previewUrl = action.payload;
        },
        setGlobalCapturedFrame: (state, action: PayloadAction<string | null>) => {
            state.capturedFrame = action.payload;
        },
        setCropArea: (state, action: PayloadAction<Crop>) => {
            state.cropArea = action.payload;
        },
        setIsCoordinatesSent: (state, action: PayloadAction<boolean>) => {
            state.isCoordinatesSent = action.payload;
        },
        setIsRegionSelected: (state, action: PayloadAction<boolean>) => {
            state.isRegionSelected = action.payload;
        },
    }
});

export const { setPreivewUrl, setGlobalCapturedFrame, setCropArea, setIsCoordinatesSent, setIsRegionSelected } = previewUrlSlice.actions; 
export default previewUrlSlice.reducer;