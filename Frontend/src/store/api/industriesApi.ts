import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { base_url } from "../base_URL";

export const industriesApi = createApi({
    reducerPath: "industriesApi",
    baseQuery: fetchBaseQuery({
        baseUrl: base_url,
        prepareHeaders: (headers) => {
            headers.set("Accept", "application/json");
            return headers;
        },
    }),
    tagTypes: ["Industries"],
    endpoints: (builder) => ({
        getIndustries: builder.query<any[], void>({
            query: () => "/industries",
            providesTags: ["Industries"],
        }),
        selectIndustry: builder.mutation({
            query: (industryId) => ({
                url: `/select-industry/${industryId}`,
                method: "POST",
            }),
        }),
    }),
});

export const { useGetIndustriesQuery, useSelectIndustryMutation } = industriesApi; 