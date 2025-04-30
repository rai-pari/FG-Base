import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isConnected: false,
  dbType: 'mongodb',
  dbName: ''
};

export const databaseSlice = createSlice({
  name: 'database',
  initialState,
  reducers: {
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload;
    },
    setDatabaseInfo: (state, action) => {
      state.dbType = action.payload.dbType;
      state.dbName = action.payload.dbName;
    },
    resetDatabaseState: (state) => {
      state.isConnected = false;
      state.dbType = 'mongodb';
      state.dbName = '';
    }
  }
});

export const { setConnectionStatus, setDatabaseInfo, resetDatabaseState } = databaseSlice.actions;

export default databaseSlice.reducer;