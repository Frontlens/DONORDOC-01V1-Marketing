/*
Website System Name: DONORDOC-01 V1
Author: FRONTLENS LLC
License: For personal/business use only. Redistribution, resale, or sublicensing is strictly Copyright (c) 2026 FRONTLENS LLC. All rights reserved.
*/

import { initPreloader } from "./components/preloader.js";
import { initStickyHeader, initNavScroll, initMobileMenu } from "./components/navigation.js";
import { initBackToTop } from "./components/back-to-top.js";
import { initLazyImages } from "./utilities/lazy-images.js";
import { initSiteConfig } from "./utilities/site-config.js";
import { initPricing } from "./sections/pricing.js";
import { initTestimonials } from "./sections/testimonials.js";
import { initServicesReveal } from "./sections/services.js";
import { initConsultationSection } from "./sections/consultation.js";
import { initFaqAccordion } from "./sections/faq.js";
import { initFooterYear, initFooterAccordion } from "./sections/footer.js";
import { initPurchaseBar } from "./components/purchase-bar.js";

initPreloader();

document.addEventListener("DOMContentLoaded", function () {
  initPurchaseBar();
  initSiteConfig().then(function () {
    initStickyHeader();
    initNavScroll();
    initMobileMenu();
    initPricing();
    initTestimonials();
    initServicesReveal();
    initBackToTop();
    initLazyImages();
    initFooterYear();
    initConsultationSection();
    initFaqAccordion();
    initFooterAccordion();
  });
});
