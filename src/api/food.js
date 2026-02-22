import { createDomainApi } from "./client";

const foodApi = createDomainApi("food");

export const createOrUpdateRestaurantRequest = (params) => foodApi("createOrUpdateRestaurant", params);

export const getMyRestaurantRequest = (params) => foodApi("getMyRestaurant", params);

export const getRestaurantsRequest = (params) => foodApi("getRestaurants", params);

export const createMenuItemRequest = (params) => foodApi("createMenuItem", params);

export const updateMenuItemRequest = (params) => foodApi("updateMenuItem", params);

export const deleteMenuItemRequest = (params) => foodApi("deleteMenuItem", params);

export const getMenuItemsRequest = (params) => foodApi("getMenuItems", params);

export const toggleMenuItemFavoriteRequest = (params) => foodApi("toggleMenuItemFavorite", params);
