/*
Website System Name: DONORDOC-01 V1
Author: FRONTLENS LLC
License: For personal/business use only. Redistribution, resale, or sublicensing is strictly Copyright (c) 2026 FRONTLENS LLC. All rights reserved.
*/

import { throttle } from "../utilities/throttle.js";

const SECTION_SPACING = 24;

function metrics() {
  const header = document.getElementById("header");
  const rail = document.querySelector("[data-purchase-rail]");
  const headerH = header ? header.offsetHeight : 0;
  const barH = rail ? rail.offsetHeight : 0;
  return {
    headerH,
    barH,
    offset: headerH + barH + SECTION_SPACING,
  };
}

function syncPin() {
  const scope = document.querySelector("[data-purchase-scope]");
  const bar = document.querySelector("[data-purchase-bar]");
  if (!scope || !bar) return;
  const scopeBottom = scope.getBoundingClientRect().bottom;
  const stickLine = window.innerHeight - 12;
  bar.setAttribute("data-pin", scopeBottom <= stickLine ? "release" : "stick");
}

function syncMetrics() {
  const { barH, offset } = metrics();
  const root = document.documentElement;
  root.style.setProperty("--purchase-bar-h", `${barH}px`);
  root.style.setProperty("--purchase-scroll-offset", `${offset}px`);
  document
    .querySelectorAll("section[data-section], header, footer")
    .forEach((el) => {
      el.style.scrollMarginTop = `${offset}px`;
    });
}

export function collapsePurchaseBar() {
  const bar = document.querySelector("[data-purchase-bar]");
  const toggle = document.querySelector("[data-purchase-toggle]");
  const details = document.querySelector("[data-purchase-details]");
  if (!bar || bar.getAttribute("data-state") !== "open") return;
  if (details && details.contains(document.activeElement) && toggle) {
    toggle.focus();
  }
  bar.setAttribute("data-state", "closed");
  if (toggle) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Show purchase details");
  }
  if (details) details.setAttribute("hidden", "");
  syncMetrics();
  syncPin();
}

export function initPurchaseBar() {
  const bar = document.querySelector("[data-purchase-bar]");
  const toggle = document.querySelector("[data-purchase-toggle]");
  const details = document.querySelector("[data-purchase-details]");
  if (!bar || !toggle || !details) return;

  const setOpen = (open) => {
    bar.setAttribute("data-state", open ? "open" : "closed");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute(
      "aria-label",
      open ? "Hide purchase details" : "Show purchase details",
    );
    if (open) details.removeAttribute("hidden");
    else details.setAttribute("hidden", "");
    syncMetrics();
  };

  const openBar = () => {
    const menu = document.getElementById("offcanvasNavbar");
    if (menu && menu.classList.contains("show")) {
      const onClose = () => setOpen(true);
      document.addEventListener("mobilenav:close", onClose, { once: true });
      document.dispatchEvent(new CustomEvent("purchasebar:before-open"));
      return;
    }
    setOpen(true);
  };

  toggle.addEventListener("click", () => {
    if (bar.getAttribute("data-state") === "open") collapsePurchaseBar();
    else openBar();
  });

  document.addEventListener("purchasebar:request-close", collapsePurchaseBar);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") collapsePurchaseBar();
  });

  syncMetrics();
  syncPin();
  window.addEventListener("load", () => {
    syncMetrics();
    syncPin();
  });
  const onScroll = throttle(() => {
    syncPin();
  }, 50);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener(
    "resize",
    throttle(() => {
      syncMetrics();
      syncPin();
    }, 100),
  );
}
