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

export function replaceImageWithEmpty(event, className = "restaurant-list-photo-empty", text = "Нет фото") {
  const img = event.currentTarget;
  if (!img || img.dataset.fallbackApplied === "1") return;
  const parent = img.parentElement;
  if (!parent) return;

  img.dataset.fallbackApplied = "1";
  const placeholder = document.createElement("div");
  placeholder.className = className;
  placeholder.textContent = text;
  parent.replaceChild(placeholder, img);
}
