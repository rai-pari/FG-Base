import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface OutputConfiguration{
    isToggled: boolean | null
    storageLocation: string,
    outputFormat: string,
    saveDetectionImages: boolean | null
}

const initialState: OutputConfiguration = {
    isToggled: null,
    storageLocation: "Cloud Storage",
    outputFormat: "CSV",
    saveDetectionImages: null
}

const outputConfigurationSlice = createSlice({
    name: "output",
    initialState,
    reducers: {
        setIsToggled: (state, action: PayloadAction<boolean | null>) => {
            state.isToggled = action.payload ?? false;
        },
        setStorageLocation: (state, action: PayloadAction<string>) => {
            state.storageLocation = action.payload
        },
        setOutputFormat: (state, action: PayloadAction<string>) => {
            state.outputFormat = action.payload;
        },
        setSaveDetectionImages: (state, action: PayloadAction<boolean | null>) => {
            state.saveDetectionImages = action.payload ?? false;
        }
    }
});

export const { setIsToggled, setStorageLocation, setOutputFormat, setSaveDetectionImages} = outputConfigurationSlice.actions;
export default outputConfigurationSlice.reducer;