import adsHero from "../assets/ads-hero.svg";
import restaurantHero from "../assets/restaurant-hero.svg";
import serviceHero from "../assets/service-hero.svg";
import taxiHero from "../assets/taxi-hero.svg";

const SECTION_FALLBACKS = {
  ads: adsHero,
  restaurant: restaurantHero,
  services: serviceHero,
  food: restaurantHero,
  taxi: taxiHero,
  default: adsHero,
};

export function getSectionFallbackImage(section) {
  return SECTION_FALLBACKS[section] || SECTION_FALLBACKS.default;
}

export function applyImageFallback(event, section) {
  const img = event.currentTarget;
  if (!img || img.dataset.fallbackApplied === "1") return;
  img.dataset.fallbackApplied = "1";
  img.src = getSectionFallbackImage(section);
}
