/*
Website System Name: DONORDOC-01 V1
Author: FRONTLENS LLC
License: For personal/business use only. Redistribution, resale, or sublicensing is strictly Copyright (c) 2026 FRONTLENS LLC. All rights reserved.
*/

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

function placeBar() {
  const scope = document.querySelector("[data-purchase-scope]");
  const bar = document.querySelector("[data-purchase-bar]");
  const sheet = document.querySelector(".purchase-bar__sheet");
  const rail = document.querySelector("[data-purchase-rail]");
  const details = document.querySelector("[data-purchase-details]");
  const header = document.getElementById("header");
  const footer = document.getElementById("footer");
  if (!scope || !bar || !sheet || !rail) return;

  sheet.style.transform = "translateY(0px)";
  const scopeBottom = scope.getBoundingClientRect().bottom;
  const release = scopeBottom <= window.innerHeight - 12;
  bar.setAttribute("data-pin", release ? "release" : "stick");

  const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
  const open = bar.getAttribute("data-state") === "open" && details && !details.hasAttribute("hidden");

  if (open) {
    const railBox = rail.getBoundingClientRect();
    const footerTop = footer ? footer.getBoundingClientRect().top : window.innerHeight;
    const above = Math.max(0, railBox.top - headerBottom);
    const belowEdge = release ? footerTop : window.innerHeight;
    const below = Math.max(0, belowEdge - railBox.bottom);
    const need = details.scrollHeight;
    const dir = above >= need || above >= below ? "up" : "down";
    const room = dir === "up" ? above : below;
    bar.setAttribute("data-expand", dir);
    details.style.maxHeight = `${Math.max(48, Math.floor(room))}px`;
    details.style.overflowY = need > room + 1 ? "auto" : "";
  } else {
    bar.setAttribute("data-expand", "up");
    if (details) {
      details.style.maxHeight = "";
      details.style.overflowY = "";
    }
  }

  const railTop = rail.getBoundingClientRect().top;
  const detailsTop = open ? details.getBoundingClientRect().top : railTop;
  const visualTop = Math.min(railTop, detailsTop);
  if (visualTop < headerBottom - 1) {
    sheet.style.transform = `translateY(${headerBottom - visualTop}px)`;
  }
}

function syncPin() {
  placeBar();
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
    placeBar();
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
  placeBar();
  window.addEventListener("load", () => {
    syncMetrics();
    placeBar();
  });
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      placeBar();
    });
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", () => {
    syncMetrics();
    schedule();
  });
}
