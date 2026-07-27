(function () {
  const params = new URLSearchParams(location.search);
  if (!params.has("__joylo_editor")) return; // only run in editor mode

  console.log("🎨 Joylo Editor Agent initializing...");

  function send(type, payload) {
    window.parent.postMessage({ type, payload }, "*");
  }

  function cssPathFor(el) {
    if (!el) return null;
    if (el.getAttribute("data-fragment-id"))
      return `[data-fragment-id="${el.getAttribute("data-fragment-id")}"]`;
    const parts = [];
    let current = el;
    while (current && current.tagName.toLowerCase() !== "html") {
      let selector = current.tagName.toLowerCase();
      let sib = current.previousElementSibling,
        nth = 1;
      while (sib) {
        nth++;
        sib = sib.previousElementSibling;
      }
      selector += `:nth-child(${nth})`;
      parts.unshift(selector);
      current = current.parentElement;
    }
    return parts.join(" > ");
  }

  function ensureFrag(el) {
    if (!el.getAttribute("data-fragment-id")) {
      el.setAttribute("data-fragment-id", "frag-" + Math.random().toString(36).slice(2, 9));
    }
    return el.getAttribute("data-fragment-id");
  }

  /* ----------------- NEW: Context Extraction ----------------- */
  function inferFileContext(el) {
    // Attempt to extract context from nearby metadata or script tags injected during build
    // (for example, a meta tag or data attributes added by your app)
    const root = document.querySelector("[data-component-path]");
    if (root && root.getAttribute("data-component-path")) {
      const fullPath = root.getAttribute("data-component-path");
      return {
        filePath: fullPath,
        fileName: fullPath.split("/").pop() || "main.tsx",
      };
    }

    // fallback: check closest element with data-file-path
    const fromAncestor = el.closest("[data-file-path]");
    if (fromAncestor) {
      const fp = fromAncestor.getAttribute("data-file-path");
      return {
        filePath: fp,
        fileName: fp.split("/").pop() || "main.tsx",
      };
    }

    // fallback: default to main file
    return {
      filePath: "src/main.tsx",
      fileName: "main.tsx",
    };
  }

  let enabled = false;
  let clickHandler = null;

  function enableEditor() {
    if (enabled) {
      console.log("⚠️ Editor already enabled, skipping re-initialization");
      return;
    }
    enabled = true;
    console.log("✅ Enabling editor mode");

    clickHandler = function (ev) {
      if (!enabled) return;
      ev.preventDefault();
      ev.stopPropagation();

      const el = ev.target;
      if (!(el instanceof Element)) return;
      const fid = ensureFrag(el);

      document.querySelectorAll("[data-highlight]").forEach((n) => n.removeAttribute("data-highlight"));
      el.setAttribute("data-highlight", "true");

      const styles = getComputedStyle(el);
      const selector = cssPathFor(el);

      const fileCtx = inferFileContext(el);

      send("editor:nodeSelected", {
        selector,
        fragmentId: fid,
        tag: el.tagName.toLowerCase(),
        innerText: el.innerText || "",
        styles: {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          fontSize: styles.fontSize,
          padding: styles.padding,
          margin: styles.margin,
          borderRadius: styles.borderRadius,
          width: styles.width,
        },
        attributes: Object.fromEntries(Array.from(el.attributes).map(a => [a.name, a.value])),
        fileName: el.getAttribute("data-filename") || "main.tsx",
        filePath: el.getAttribute("data-filepath") || "src/main.tsx",
      });
    };

    document.addEventListener("click", clickHandler, true);

    window.addEventListener("message", (e) => {
      const d = e.data || {};
      if (d.type === "editor:apply") {
        const { selector, key, value } = d.payload || {};
        if (!selector) return;
        const el = document.querySelector(selector);
        if (!el) return;
        if (key === "innerText") el.innerText = value;
        else if (key === "src") el.setAttribute("src", value);
        else el.style[key] = value;
      }
    });

    send("editor:ready", {});
    console.log("📤 Sent editor:ready message");
  }

  function disableEditor() {
    if (!enabled) return;
    enabled = false;
    console.log("🔴 Disabling editor mode");

    if (clickHandler) {
      document.removeEventListener("click", clickHandler, true);
      clickHandler = null;
    }

    document.querySelectorAll("[data-highlight]").forEach((n) => n.removeAttribute("data-highlight"));
  }

  window.addEventListener("message", (e) => {
    const d = e.data || {};
    if (d.type === "editor:init") {
      console.log("📨 Received editor:init message");
      enableEditor();
    }
    if (d.type === "editor:disable") {
      console.log("📨 Received editor:disable message");
      disableEditor();
    }
  });

  // Style for highlighting
  const style = document.createElement("style");
  style.textContent = `
    [data-highlight]{
      outline:2px solid #06b6d4;
      outline-offset:2px;
      transition:outline .1s ease;
    }
  `;
  document.head.appendChild(style);

  console.log("🎨 Joylo Editor Agent ready, waiting for init message");
})();
