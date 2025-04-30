import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { base_url } from "../base_URL";
import { OutputConfigurationsModel } from "../models/OutputConfigurations";

export const outputConfigurationsApi = createApi({
  reducerPath: "outputConfigurationsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: base_url,
    prepareHeaders: (headers) => {
      headers.set("Accept", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Output Configurations"],
  endpoints: (builder) => ({
    getOutputConfigurations: builder.query<OutputConfigurationsModel, void>({
      query: () => "/output_configurations",
      providesTags: ["Output Configurations"],
    }),
    updateOutputConfigurations: builder.mutation({
      query: (payload) => ({
        url: "/output_configurations/update",
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Output Configurations"],
    }),
  }),
});

export const {
  useGetOutputConfigurationsQuery,
  useUpdateOutputConfigurationsMutation,
} = outputConfigurationsApi;
