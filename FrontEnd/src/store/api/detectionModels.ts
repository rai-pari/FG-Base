import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { base_url } from "../base_URL";
import { DetectionModel } from "../models/DetectionModel";

export const detectionModelsApi = createApi({
  reducerPath: "detectionModelsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: base_url,
    prepareHeaders: (headers) => {
      headers.set("Accept", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Detection Models"],
  endpoints: (builder) => ({
    getDetectionModels: builder.query<DetectionModel[], void>({
      query: () => "/models",
      providesTags: ["Detection Models"],
    }),
    updateDetectionModel: builder.mutation({
      query: (payload) => ({
        url: "/models/update",
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Detection Models"],
    }),
  }),
});

export const { useGetDetectionModelsQuery, useUpdateDetectionModelMutation } =
  detectionModelsApi;
