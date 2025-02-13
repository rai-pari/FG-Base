import { configureStore } from "@reduxjs/toolkit";
import { mediaProcessingApi } from "../api/mediaProcessing";
import { detectionModelsApi } from "../api/detectionModels";
import { processingRulesApi } from "../api/processingRules";
import { outputConfigurationsApi } from "../api/outputConfigurations";
import { areaCoordinatesApi } from "../api/areaCoordinates";
import previewUrlReducer from "../api/localData/previewUrl";
import detectionModelReducer from "../api/localData/detectionModel";
import outputConfigurationReducer from "../api/localData/outputConfiguration"
import videoResultsReducer from "../api/localData/videoResultsData"
import processingLogicReducer from "../api/localData/processingLogic"

export const store = configureStore({
  reducer: {
    [mediaProcessingApi.reducerPath]: mediaProcessingApi.reducer,
    [detectionModelsApi.reducerPath]: detectionModelsApi.reducer,
    [processingRulesApi.reducerPath]: processingRulesApi.reducer,
    [outputConfigurationsApi.reducerPath]: outputConfigurationsApi.reducer,
    [areaCoordinatesApi.reducerPath]: areaCoordinatesApi.reducer,
    previewUrl: previewUrlReducer,
    detectionModel: detectionModelReducer,
    outputConfiguration: outputConfigurationReducer,
    videoResults: videoResultsReducer,
    processingLogic: processingLogicReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      mediaProcessingApi.middleware,
      detectionModelsApi.middleware,
      processingRulesApi.middleware,
      outputConfigurationsApi.middleware,
      areaCoordinatesApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
