/* Canonical D3 State Bar. Copy this file unchanged into mockups/state-bar.js. */
(function () {
  var STEP_MS = 800;
  var HAPPY_DEFAULT = ["idle", "dummy-loading", "dummy-success"];
  var playTimer = null;

  function list(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function containers() {
    return list("[data-d3-state]");
  }

  function screens() {
    return list("[data-d3-screen]");
  }

  function uniqueStates() {
    var seen = {};
    var states = [];
    containers().forEach(function (el) {
      var id = el.getAttribute("data-d3-state");
      if (id && !seen[id]) {
        seen[id] = true;
        states.push(id);
      }
    });
    return states;
  }

  function label(id) {
    return id.split("-").map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(" ");
  }

  function buttonStyle(active) {
    return "padding:6px 10px;border:0;border-radius:6px;cursor:pointer;background:" +
      (active ? "#fff" : "#333") + ";color:" + (active ? "#111" : "#fff") + ";";
  }

  function happyPath() {
    var seen = {};
    var path = [];
    containers().forEach(function (el) {
      var id = el.getAttribute("data-d3-state");
      var marked = el.hasAttribute("data-d3-happy");
      var included = marked || HAPPY_DEFAULT.indexOf(id) !== -1;
      if (id === "dummy-failure" && !marked) included = false;
      if (included && id && !seen[id]) {
        seen[id] = true;
        path.push(id);
      }
    });
    return path;
  }

  function showScreen(name) {
    screens().forEach(function (el) {
      if (el.getAttribute("data-d3-screen") === name) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    });
    list("[data-d3-bar] button[data-d3-screen-tab]").forEach(function (btn) {
      var on = btn.getAttribute("data-d3-screen-tab") === name;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.style.cssText = buttonStyle(on);
    });
  }

  function show(state) {
    var active = null;
    containers().forEach(function (el) {
      if (!active && el.getAttribute("data-d3-state") === state) active = el;
    });
    if (active) {
      var screen = active.closest("[data-d3-screen]");
      if (screen) showScreen(screen.getAttribute("data-d3-screen"));
    }
    containers().forEach(function (el) {
      if (el.getAttribute("data-d3-state") === state) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    });
    var inspector = document.querySelector("[data-d3-inspector]");
    if (inspector) {
      inspector.textContent = active
        ? (active.getAttribute("data-d3-ticket") || "no ticket") + " — " +
          (active.getAttribute("data-d3-summary") || "no summary")
        : "No container for " + state;
    }
    list("[data-d3-bar] button[data-d3-goto]").forEach(function (btn) {
      var on = btn.getAttribute("data-d3-goto") === state;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.style.cssText = buttonStyle(on);
    });
    try {
      var url = new URL(location.href);
      url.searchParams.set("d3_state", state);
      history.replaceState(null, "", url);
    } catch (err) {}
    document.dispatchEvent(new CustomEvent("d3:state", { detail: { state: state } }));
  }

  function play() {
    if (playTimer) clearTimeout(playTimer);
    var path = happyPath();
    var index = 0;
    function step() {
      if (index >= path.length) return;
      show(path[index]);
      index += 1;
      if (index < path.length) playTimer = setTimeout(step, STEP_MS);
    }
    step();
  }

  function makeButton(text, active) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = text;
    btn.style.cssText = buttonStyle(active);
    return btn;
  }

  function boot() {
    var bar = document.createElement("div");
    bar.setAttribute("data-d3-bar", "");
    bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 12px;background:#111;color:#fff;font:14px/1.4 system-ui,sans-serif;z-index:9999;";

    var title = document.createElement("strong");
    title.textContent = "D3";
    bar.appendChild(title);

    var seenScreens = {};
    screens().forEach(function (el) {
      var name = el.getAttribute("data-d3-screen");
      if (!name || seenScreens[name]) return;
      seenScreens[name] = true;
      var tab = makeButton(label(name), false);
      tab.setAttribute("data-d3-screen-tab", name);
      tab.addEventListener("click", function () {
        var first = containers().filter(function (container) {
          return container.closest("[data-d3-screen]") === el;
        })[0];
        if (first) show(first.getAttribute("data-d3-state"));
        else showScreen(name);
      });
      bar.appendChild(tab);
    });

    uniqueStates().forEach(function (id) {
      var btn = makeButton(label(id), false);
      btn.setAttribute("data-d3-goto", id);
      btn.addEventListener("click", function () { show(id); });
      bar.appendChild(btn);
    });

    var playButton = makeButton("Play Happy Path", false);
    playButton.style.cssText = "padding:6px 10px;border:0;border-radius:6px;cursor:pointer;background:#0a7;color:#fff;";
    playButton.addEventListener("click", play);
    bar.appendChild(playButton);

    var inspector = document.createElement("span");
    inspector.setAttribute("data-d3-inspector", "");
    inspector.setAttribute("aria-live", "polite");
    inspector.style.cssText = "margin-left:auto;";
    bar.appendChild(inspector);

    document.body.appendChild(bar);
    document.body.style.paddingBottom = "72px";

    var states = uniqueStates();
    var requested = new URLSearchParams(location.search).get("d3_state");
    var initial = requested && states.indexOf(requested) !== -1
      ? requested
      : (states.indexOf("idle") !== -1 ? "idle" : states[0]);
    if (initial) show(initial);
    else inspector.textContent = "No states found";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
