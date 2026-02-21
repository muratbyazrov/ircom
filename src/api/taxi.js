import { createDomainApi } from "./client";

const taxiApi = createDomainApi("taxi");

export const createTaxiOfferRequest = (params) => taxiApi("createTaxiOffer", params);

export const updateTaxiOfferRequest = (params) => taxiApi("updateTaxiOffer", params);

export const getTaxiOffersRequest = (params) => taxiApi("getTaxiOffers", params);

export const getMyTaxiOffersRequest = (params) => taxiApi("getMyTaxiOffers", params);

export const toggleTaxiFavoriteRequest = (params) => taxiApi("toggleTaxiFavorite", params);
