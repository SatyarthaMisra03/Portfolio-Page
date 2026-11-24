const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---------- time-aware greeting ---------- */
(function () {
  const h = new Date().getHours();
  const part = h < 5 ? "Burning the midnight oil" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 21 ? "Good evening" : "Good night";
  $("#greeting").textContent = "(" + part + " — welcome in)";
})();

/* ---------- live Lucknow clock ---------- */
const clock = $("#clock");
function tick() {
  clock.textContent = new Date().toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true,
  });
}
tick();
setInterval(tick, 20000);

/* ---------- split headline into letters ---------- */
function splitText(el) {
  const label = el.textContent.trim();
  let i = 0;
  const build = (src) => {
    const frag = document.createDocumentFragment();
    src.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span");
          w.className = "word";
          w.setAttribute("aria-hidden", "true");
          [...part].forEach((ch) => {
            const s = document.createElement("span");
            s.className = "ch";
            s.style.setProperty("--i", i++);
            s.textContent = ch;
            w.appendChild(s);
          });
          frag.appendChild(w);
        });
      } else if (node.nodeType === 1) {
        const clone = node.cloneNode(false);
        clone.appendChild(build(node));
        frag.appendChild(clone);
      }
    });
    return frag;
  };
  const out = build(el);
  el.textContent = "";
  el.appendChild(out);
  el.setAttribute("aria-label", label);
}
const headline = $(".split-text");
splitText(headline);

/* ---------- typing rotator ---------- */
function startRotator() {
  const rot = $("#rotator");
  const words = ["Python", "C programming", "Web development", "Data structures", "Databases", "AI & data science"];
  if (reduce) { rot.textContent = words[0]; return; }
  let w = 0, c = 0, del = false;
  (function loop() {
    const word = words[w];
    rot.textContent = word.slice(0, c);
    let delay = del ? 40 : 85;
    if (!del && c === word.length) { del = true; delay = 1500; }
    else if (del && c === 0) { del = false; w = (w + 1) % words.length; delay = 350; }
    else c += del ? -1 : 1;
    setTimeout(loop, delay);
  })();
}

/* ---------- scroll reveal (rows animate one by one) ---------- */
function startReveal() {
  $$(".rows.reveal").forEach((r) => {
    r.classList.remove("reveal");
    $$(".row", r).forEach((row) => row.classList.add("reveal"));
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  $$(".reveal, .motto").forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 70 + "ms";
    io.observe(el);
  });
}

/* ---------- intro loader, then everything starts ---------- */
function start() {
  headline.classList.add("go");
  startReveal();
  startRotator();
}
(function runLoader() {
  const loader = $("#loader");
  if (reduce) { loader.remove(); start(); return; }
  const bar = $("#loaderBar"), pct = $("#loaderPct");
  let p = 0;
  const t = setInterval(() => {
    p = Math.min(100, p + Math.random() * 14 + 4);
    bar.style.width = p + "%";
    pct.textContent = Math.floor(p) + "%";
    if (p >= 100) {
      clearInterval(t);
      setTimeout(() => {
        loader.classList.add("done");
        start();
        setTimeout(() => loader.remove(), 1000);
      }, 250);
    }
  }, 110);
})();

/* ---------- mobile menu ---------- */
const menuBtn = $("#menuBtn"), navLinks = $("#navLinks"), nav = $("#nav");
menuBtn.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.textContent = open ? "Close" : "Menu";
});
$$("a", navLinks).forEach((a) => a.addEventListener("click", () => {
  navLinks.classList.remove("open");
  menuBtn.setAttribute("aria-expanded", "false");
  menuBtn.textContent = "Menu";
}));

/* ---------- active nav link ---------- */
const links = $$("a", navLinks);
const secObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id));
    }
  });
}, { rootMargin: "-45% 0px -50% 0px" });
$$("main section[id]").forEach((s) => secObs.observe(s));

/* ---------- scroll effects: progress bar, hiding nav, parallax, marquee speed ---------- */
const progress = $("#progress");
const heroArt = $(".hero-art");
const track = $(".strip-track");
const marquee = !reduce && track.getAnimations ? track.getAnimations()[0] : null;
let lastY = scrollY, vel = 0, rate = 1;

addEventListener("scroll", () => {
  const y = scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";

  if (!navLinks.classList.contains("open")) {
    if (y > lastY + 4 && y > 220) nav.classList.add("hide");
    else if (y < lastY - 4) nav.classList.remove("hide");
  }
  if (y < innerHeight && !reduce) heroArt.style.setProperty("--sy", y * 0.14 + "px");

  vel = Math.max(vel, Math.abs(y - lastY));
  lastY = y;
}, { passive: true });

(function loop() {
  vel *= 0.92;
  const target = 1 + Math.min(vel, 70) / 6;
  rate += (target - rate) * 0.1;
  if (marquee) marquee.playbackRate = rate;
  requestAnimationFrame(loop);
})();

/* ---------- id-card tilt + disc parallax following the mouse ---------- */
if (!reduce && finePointer) {
  const card = $(".id-card");
  heroArt.addEventListener("mousemove", (e) => {
    const r = heroArt.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.setProperty("--ry", x * 16 + "deg");
    card.style.setProperty("--rx", -y * 16 + "deg");
    heroArt.style.setProperty("--dx", -x * 28 + "px");
    heroArt.style.setProperty("--dy", -y * 28 + "px");
  });
  heroArt.addEventListener("mouseleave", () => {
    ["--rx", "--ry", "--dx", "--dy"].forEach((v) => heroArt.style.removeProperty(v));
    ["--rx", "--ry"].forEach((v) => card.style.removeProperty(v));
  });
}

/* ---------- magnetic buttons ---------- */
if (!reduce && finePointer) {
  $$(".btn, .nav-cta, .socials a").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * 0.28;
      const dy = (e.clientY - (r.top + r.height / 2)) * 0.35;
      el.style.transform = "translate(" + dx + "px," + dy + "px)";
    });
    el.addEventListener("mouseleave", () => (el.style.transform = ""));
  });
}

/* ---------- cursor follower ---------- */
if (!reduce && finePointer) {
  const cur = $("#cursor");
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; cur.classList.add("on"); });
  document.addEventListener("mouseleave", () => cur.classList.remove("on"));
  document.addEventListener("mouseover", (e) => {
    cur.classList.toggle("big", !!e.target.closest("a, button, input, textarea, .skill"));
  });
  (function follow() {
    cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
    cur.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";
    requestAnimationFrame(follow);
  })();
}

/* ---------- logo text scramble on hover ---------- */
(function () {
  const logo = $(".nav-logo"), orig = logo.textContent, pool = "abcdefghijklmnopqrstuvwxyz{}<>/;_";
  let busy = false;
  logo.addEventListener("mouseenter", () => {
    if (busy || reduce) return;
    busy = true;
    let f = 0;
    const t = setInterval(() => {
      logo.textContent = [...orig].map((ch, i) => (i < f / 2 || ch === " " || ch === "." ? ch : pool[(Math.random() * pool.length) | 0])).join("");
      if (++f > orig.length * 2) { clearInterval(t); logo.textContent = orig; busy = false; }
    }, 35);
  });
})();

/* ---------- toast + copy email ---------- */
const toastEl = $("#toast");
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}
$("#copyEmail").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("misrasatyartha3@gmail.com");
    toast("Email copied to clipboard ✺");
  } catch (e) {
    toast("Couldn't copy — select the address manually");
  }
});

/* ---------- contact form (opens visitor's email app, no backend needed) ---------- */
const form = $("#contactForm"), statusEl = $("#formStatus");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();
  const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  statusEl.className = "form-status";
  if (!name || !message || !okEmail) {
    statusEl.textContent = "Please fill in every field with a valid email.";
    statusEl.classList.add("err");
    form.classList.remove("shake");
    void form.offsetWidth; // restart the shake animation
    form.classList.add("shake");
    return;
  }
  const subject = encodeURIComponent("Hello from your portfolio, " + name);
  const body = encodeURIComponent(message + "\n\n— " + name + " (" + email + ")");
  window.location.href = "mailto:misrasatyartha3@gmail.com?subject=" + subject + "&body=" + body;
  statusEl.textContent = "Opening your email app. Thanks for reaching out!";
  statusEl.classList.add("ok");
  toast("Message ready to send ✺");
  form.reset();
});

/* ---------- playful tab title + footer year ---------- */
const baseTitle = document.title;
document.addEventListener("visibilitychange", () => {
  document.title = document.hidden ? "Come back, I'm still building ✺" : baseTitle;
});
$("#year").textContent = new Date().getFullYear();
