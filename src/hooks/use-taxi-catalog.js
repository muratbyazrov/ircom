import { useEffect, useMemo } from "react";
import { sortItems } from "../utils/helpers";
import { buildRecurringTaxiOccurrences, parseTaxiWhenValue } from "../utils/taxi";

export function useTaxiCatalog({
  customTaxiItems,
  taxiTemplates,
  mockTaxi,
  feedbackByItem,
  decorateWithFeedback,
  taxiRequestedAt,
  setTaxiRequestedAt,
  taxiCategory,
  taxiSort,
  favorites,
}) {
  const recurringTaxiItems = useMemo(() => buildRecurringTaxiOccurrences(taxiTemplates, 14), [taxiTemplates]);
  const allTaxiItems = useMemo(() => [...customTaxiItems, ...recurringTaxiItems, ...mockTaxi], [customTaxiItems, recurringTaxiItems, mockTaxi]);
  const taxiCatalog = useMemo(() => allTaxiItems.map((item) => decorateWithFeedback(item)), [allTaxiItems, feedbackByItem]);

  const taxiRequestTime = useMemo(() => {
    if (!taxiRequestedAt) return null;
    const parsed = new Date(taxiRequestedAt);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [taxiRequestedAt]);

  const taxiItems = useMemo(() => {
    const byCategory = taxiCatalog.filter((x) => x.category === taxiCategory);
    if (!taxiRequestTime || taxiCategory === "Такси по Цхинвалу") return sortItems(byCategory, taxiSort, favorites);

    const filteredByTime = byCategory.filter((item) => {
      const rideDate = parseTaxiWhenValue(item.when);
      if (!rideDate) return false;
      return rideDate.getTime() >= taxiRequestTime.getTime();
    });
    return sortItems(filteredByTime, taxiSort, favorites);
  }, [taxiCatalog, taxiCategory, taxiSort, favorites, taxiRequestTime]);

  useEffect(() => {
    if (taxiCategory === "Такси по Цхинвалу" && taxiRequestedAt) setTaxiRequestedAt("");
  }, [taxiCategory, taxiRequestedAt, setTaxiRequestedAt]);

  return { taxiCatalog, taxiItems };
}
