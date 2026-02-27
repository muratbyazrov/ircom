import { createDomainApi } from "./client";

const dictionaryApi = createDomainApi("dictionary");

export const getListingCategoriesRequest = (params) => dictionaryApi("getListingCategories", params);

export const getServiceCategoriesRequest = (params) => dictionaryApi("getServiceCategories", params);

export const getKitchenCategoriesRequest = (params) => dictionaryApi("getKitchenCategories", params);

export const getDictionariesRequest = (params) => dictionaryApi("getDictionaries", params);
