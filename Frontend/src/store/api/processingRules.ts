import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { base_url } from "../base_URL";
import { ProcessingRulesModel } from "../models/ProcessingRules";

export const processingRulesApi = createApi({
  reducerPath: "processingRulesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: base_url,
    prepareHeaders: (headers) => {
      headers.set("Accept", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Processing Rules"],
  endpoints: (builder) => ({
    getProcessingRules: builder.query<ProcessingRulesModel[], void>({
      query: () => "/rules",
      providesTags: ["Processing Rules"],
    }),
    getProcessingRulesByModel: builder.query<ProcessingRulesModel[], { industry: string; modelId: string }>({
      query: ({ industry, modelId }) => `/rules/by-model/${modelId}?industry=${industry}`,
      providesTags: ["Processing Rules"],
    }),    
    updateProcessingRule: builder.mutation({
      query: (payload) => ({
        url: "/rules/update",
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Processing Rules"],
    }),
  }),
});

export const {
  useGetProcessingRulesQuery,
  useGetProcessingRulesByModelQuery,
  useUpdateProcessingRuleMutation
} = processingRulesApi;