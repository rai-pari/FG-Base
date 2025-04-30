import { configureStore } from "@reduxjs/toolkit";
import { mediaProcessingApi } from "../api/mediaProcessing";
import { detectionModelsApi } from "../api/detectionModels";
import { processingRulesApi } from "../api/processingRules";
import { outputConfigurationsApi } from "../api/outputConfigurations";
import { areaCoordinatesApi } from "../api/areaCoordinates";
import { industriesApi } from "../api/industriesApi";

import previewUrlReducer from "../api/localData/previewUrl";
import detectionModelReducer from "../api/localData/detectionModel";
import outputConfigurationReducer from "../api/localData/outputConfiguration";
import videoResultsReducer from "../api/localData/videoResultsData";
import sessionReducer from "../api/localData/sessionSlice";
import databaseReducer from '../api/localData/databaseSlice';

export const store = configureStore({
  reducer: {
    [mediaProcessingApi.reducerPath]: mediaProcessingApi.reducer,
    [detectionModelsApi.reducerPath]: detectionModelsApi.reducer,
    [processingRulesApi.reducerPath]: processingRulesApi.reducer,
    [outputConfigurationsApi.reducerPath]: outputConfigurationsApi.reducer,
    [areaCoordinatesApi.reducerPath]: areaCoordinatesApi.reducer,
    [industriesApi.reducerPath]: industriesApi.reducer,
    previewUrl: previewUrlReducer,
    detectionModel: detectionModelReducer,
    outputConfiguration: outputConfigurationReducer,
    videoResults: videoResultsReducer,
    database: databaseReducer,
    session: sessionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      mediaProcessingApi.middleware,
      detectionModelsApi.middleware,
      processingRulesApi.middleware,
      outputConfigurationsApi.middleware,
      areaCoordinatesApi.middleware,
      industriesApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
