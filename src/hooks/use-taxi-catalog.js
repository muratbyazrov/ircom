import { useMemo } from "react";
import { sortItems } from "../utils/helpers";
import { parseTaxiDateTimeInputInMoscow, parseTaxiWhenValue } from "../utils/taxi";
import { TAXI_CITY_CATEGORY } from "../utils/app-domain";

export function useTaxiCatalog({
  customTaxiItems,
  mockTaxi,
  decorateWithFeedback,
  taxiRequestedAt,
  taxiCategory,
  taxiSort,
  favorites,
}) {
  const allTaxiItems = useMemo(() => [...customTaxiItems, ...mockTaxi], [customTaxiItems, mockTaxi]);
  const taxiCatalog = useMemo(
    () => allTaxiItems.map((item) => {
      const rideDate = parseTaxiWhenValue(item.when);

    return decorateWithFeedback({
        ...item,
        dateSortValue: rideDate ? rideDate.getTime() : item.dateSortValue,
      });
    }),
    [allTaxiItems, decorateWithFeedback]
  );

  const taxiRequestTime = useMemo(() => {
    if (!taxiRequestedAt) return null;
    return parseTaxiDateTimeInputInMoscow(taxiRequestedAt);
  }, [taxiRequestedAt]);

  const taxiItems = useMemo(() => {
    const byCategory = taxiCatalog.filter((x) => x.category === taxiCategory);
    if (!taxiRequestTime || taxiCategory === TAXI_CITY_CATEGORY) return sortItems(byCategory, taxiSort, favorites);

    const filteredByTime = byCategory.filter((item) => {
      const rideDate = parseTaxiWhenValue(item.when);
      if (!rideDate) return false;
      return rideDate.getTime() >= taxiRequestTime.getTime();
    });
    return sortItems(filteredByTime, taxiSort, favorites);
  }, [taxiCatalog, taxiCategory, taxiSort, favorites, taxiRequestTime]);

  return { taxiCatalog, taxiItems };
}
