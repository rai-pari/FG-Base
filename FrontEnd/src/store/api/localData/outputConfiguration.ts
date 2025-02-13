import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface OutputConfiguration{
    isToggled: boolean | null
    outputConfig: string[]
    saveDetectionImages: boolean | null
}

const initialState: OutputConfiguration = {
    isToggled: null,
    outputConfig: [],
    saveDetectionImages: null
}

const outputConfigurationSlice = createSlice({
    name: "output",
    initialState,
    reducers: {
        setIsToggled: (state, action: PayloadAction<boolean | null>) => {
            state.isToggled = action.payload ?? false;
        },
        setOutputConfig: (state, action: PayloadAction<string[]>) => {
          state.outputConfig = action.payload;  
        },
        setSaveDetectionImages: (state, action: PayloadAction<boolean | null>) => {
            state.saveDetectionImages = action.payload ?? false;
        }
    }
});

export const { setIsToggled, setOutputConfig, setSaveDetectionImages} = outputConfigurationSlice.actions;
export default outputConfigurationSlice.reducer;