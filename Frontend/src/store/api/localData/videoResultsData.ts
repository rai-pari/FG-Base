import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface VideoResults {
    peopleCount: number | null,
    durationRate: number | null
}

const initialState: VideoResults = {
    peopleCount: null,
    durationRate: null
}

const videoResultsSlice = createSlice({
    name: "videoResults",
    initialState,
    reducers: {
        setPeopleCount: (state, action: PayloadAction<number |null>) => {
            state.peopleCount = action.payload;
        },
        setDurationRate: (state, action: PayloadAction<number | null>) => {
            state.durationRate = action.payload;
        }
    }
});

export const { setPeopleCount, setDurationRate } = videoResultsSlice.actions;
export default videoResultsSlice.reducer;