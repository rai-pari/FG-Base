import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { base_url } from "../base_URL";

export const areaCoordinatesApi = createApi({
    reducerPath: "areaCoordinatesApi",
    baseQuery: fetchBaseQuery({
        baseUrl: base_url,
        prepareHeaders: (headers) => {
            headers.set("Accept", "application/json");
            return headers;
        },
    }),
    tagTypes: ["Area Coordinates"],
    endpoints: (builder) => ({
        createAreaCoordinates: builder.mutation({
            query: (payload) => ({
                url: "/process_rectangle/",
                method: "POST",
                body: payload
            }),
            invalidatesTags: ["Area Coordinates"],
        }),
    }),
});

export const { useCreateAreaCoordinatesMutation } = areaCoordinatesApi;