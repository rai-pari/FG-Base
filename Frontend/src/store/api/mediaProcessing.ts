import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { base_url } from "../base_URL";

export const mediaProcessingApi = createApi({
  reducerPath: "mediaProcessingApi",
  baseQuery: fetchBaseQuery({
    baseUrl: base_url,
    prepareHeaders: (headers) => {
      headers.set("Accept", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Media Processing"],
  endpoints: (builder) => ({
    createMediaProcessing: builder.mutation({
      query: ({ payload, save_output, enabled_rule_ids }) => ({
        url: `/process-video/?save_output=${save_output}&rule_id=${enabled_rule_ids}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Media Processing"],
    }),
  }),
});

export const { useCreateMediaProcessingMutation } = mediaProcessingApi;
