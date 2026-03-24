import { createDomainApi } from "./client";

const listingApi = createDomainApi("listing");

export const createListingRequest = (params) => listingApi("createListing", params);

export const updateListingRequest = (params) => listingApi("updateListing", params);

export const getListingsRequest = (params) => listingApi("getListings", params);

export const getMyListingsRequest = (params) => listingApi("getMyListings", params);

export const toggleListingFavoriteRequest = (params) => listingApi("toggleListingFavorite", params);

export const deleteMyListingRequest = (params) => listingApi("deleteMyListingById", params);
