// SWE Foundry landing page behavior. Plain JavaScript, no build step.
// The page is readable without JavaScript, except the tabbed panels beyond
// the first: this file adds navigation, tabs, copy buttons and reveal effects.

// Single place to update when a new version is published. Every element with
// data-release-link / data-release-version is kept in sync with these values;
// the static HTML carries the same defaults as a no-JS fallback.
const RELEASE = {
  version: "0.5.1",
  url: "https://github.com/SysCake/swe-foundry-site/releases/latest",
};


const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function applyRelease() {
  document.querySelectorAll("[data-release-link]").forEach((a) => { a.href = RELEASE.url; });
  document.querySelectorAll("[data-release-version]").forEach((el) => { el.textContent = RELEASE.version; });
}

function setupHeader() {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const links = document.querySelector("[data-nav-links]");

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const close = () => {
    toggle.setAttribute("aria-expanded", "false");
    links.classList.remove("is-open");
  };
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    links.classList.toggle("is-open", open);
  });
  links.addEventListener("click", (e) => { if (e.target.closest("a")) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
}

// Accessible tabs (WAI-ARIA pattern with automatic activation). Each
// [role=tab] names its panel via aria-controls; panels toggle `hidden`.
function setupTabs(root) {
  const tabs = Array.from(root.querySelectorAll('[role="tab"]'));

  const select = (tab, focus) => {
    tabs.forEach((t) => {
      const active = t === tab;
      t.setAttribute("aria-selected", String(active));
      t.tabIndex = active ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !active;
    });
    if (focus) tab.focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab, false));
    tab.addEventListener("keydown", (e) => {
      const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      select(tabs[(keys[e.key] + tabs.length) % tabs.length], true);
    });
  });
}

function setupCopy() {
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const text = button.parentElement.querySelector("code").textContent;
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = "Copied";
        button.classList.add("is-copied");
      } catch {
        button.textContent = "Select & copy";
      }
      setTimeout(() => {
        button.textContent = "Copy";
        button.classList.remove("is-copied");
      }, 1800);
    });
  });
}

// Plays the hero conversation once, the first time it scrolls into view.
// Agent turns are preceded by a short typing indicator.
function setupSession() {
  const session = document.querySelector("[data-session]");
  if (!session) return;
  const steps = Array.from(session.querySelectorAll("[data-step]"));

  if (reducedMotion || !("IntersectionObserver" in window)) {
    steps.forEach((s) => s.classList.add("is-shown"));
    return;
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const play = async () => {
    for (const step of steps) {
      if (step.classList.contains("msg-agent")) {
        const typing = document.createElement("div");
        typing.className = "typing";
        typing.setAttribute("aria-hidden", "true");
        typing.innerHTML = "<i></i><i></i><i></i>";
        session.insertBefore(typing, step);
        await wait(900);
        typing.remove();
      }
      step.classList.add("is-shown");
      await wait(step.classList.contains("files") ? 700 : 500);
    }
  };

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      setTimeout(play, 300);
    }
  }, { threshold: 0.3 });
  observer.observe(session);
}

function setupReveal() {
  const targets = document.querySelectorAll(
    ".section-head, .contrast, .feature, .lifecycle, .entry, .layer, .skill-grid li, .control, .step, .cta-inner"
  );
  if (reducedMotion || !("IntersectionObserver" in window)) return;

  targets.forEach((el) => el.classList.add("reveal"));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      // Stagger siblings in the same grid so cards cascade instead of popping together.
      const siblings = Array.from(entry.target.parentElement.children).filter((c) => c.classList.contains("reveal"));
      entry.target.style.transitionDelay = `${Math.min(siblings.indexOf(entry.target), 5) * 70}ms`;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  targets.forEach((el) => observer.observe(el));
}

applyRelease();
setupHeader();
document.querySelectorAll("[data-lifecycle], [data-tabs]").forEach(setupTabs);
setupCopy();
setupSession();
setupReveal();
