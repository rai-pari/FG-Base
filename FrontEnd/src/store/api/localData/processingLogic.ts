import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface ProcessingLogic {
    rule1: boolean,
    rule2: boolean
}

const initialState: ProcessingLogic ={
    rule1: true,
    rule2: true
}

const processingLogicSlice = createSlice({
    name: "processingLogic",
    initialState,
    reducers: {
        setRule1: (state, action: PayloadAction<boolean>) => {
            state.rule1 = action.payload;
        },
        setRule2: (state, action: PayloadAction<boolean>) => {
            state.rule2 = action.payload;
        }
    }
});

export const { setRule1, setRule2 } = processingLogicSlice.actions;
export default processingLogicSlice.reducer;