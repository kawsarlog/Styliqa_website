(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Nav scroll state ---------- */
  const nav = document.getElementById("nav");
  const onScroll = () => {
    if (window.scrollY > 24) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const burger = document.getElementById("burger");
  const mobileMenu = document.getElementById("mobileMenu");
  if (burger && mobileMenu) {
    const closeMenu = () => {
      burger.setAttribute("aria-expanded", "false");
      mobileMenu.classList.remove("is-open");
    };
    burger.addEventListener("click", () => {
      const open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      mobileMenu.classList.toggle("is-open", !open);
    });
    mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    const groups = new Map();
    revealEls.forEach((el) => {
      const parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });
    groups.forEach((els) => {
      els.forEach((el, i) => el.style.setProperty("--reveal-delay", `${Math.min(i * 90, 360)}ms`));
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Stat count-up ---------- */
  const counters = document.querySelectorAll(".count");
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const isPlain = el.dataset.plain === "true";
    const isFloat = !Number.isInteger(target);
    if (reduceMotion) {
      el.textContent = isFloat ? target.toFixed(1) : target;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      const value = target * eased;
      el.textContent = isPlain
        ? Math.round(value)
        : isFloat
        ? value.toFixed(1)
        : Math.round(value);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window && counters.length) {
    const countIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => countIo.observe(el));
  }

  /* ---------- Hero parallax (subtle, disabled under reduced motion) ---------- */
  const heroSvg = document.querySelector(".hero__svg");
  if (heroSvg && !reduceMotion) {
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      heroSvg.style.transform = `translateY(${y * 0.12}px) scale(${1 + Math.min(y * 0.0002, 0.08)})`;
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  /* ---------- Work tile tilt ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".work__tile").forEach((tile) => {
      tile.addEventListener("mousemove", (e) => {
        const rect = tile.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        tile.style.transform = `perspective(600px) rotateX(${py * -6}deg) rotateY(${px * 6}deg) translateY(-4px)`;
      });
      tile.addEventListener("mouseleave", () => {
        tile.style.transform = "";
      });
    });
  }

  /* ---------- Contact form → mailto fallback ---------- */
  const form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const project = form.project.value;
      const message = form.message.value.trim();

      const subject = encodeURIComponent(`New project inquiry — ${project}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nProject type: ${project}\n\n${message}`
      );
      window.location.href = `mailto:hello@styliqa.studio?subject=${subject}&body=${body}`;
    });
  }

  /* ---------- Reviews marquee: keep each half >= viewport so -50% never exposes a gap ---------- */
  const setupReviewMarquees = () => {
    const marquees = document.querySelector(".reviews__marquees");
    if (!marquees) return;

    marquees.querySelectorAll(".reviews__row").forEach((row) => {
      const tracks = [...row.querySelectorAll(".reviews__track")];
      if (tracks.length < 2) return;

      const seedTrack = tracks[0];
      if (!seedTrack.dataset.marqueeSeed) {
        seedTrack.dataset.marqueeSeed = "true";
        seedTrack._marqueeSeed = [...seedTrack.children].map((node) => node.cloneNode(true));
      }
      const seed = seedTrack._marqueeSeed;
      if (!seed?.length) return;

      const fillTrack = (track) => {
        track.replaceChildren(...seed.map((node) => node.cloneNode(true)));
        let guard = 0;
        while (track.scrollWidth < marquees.clientWidth && guard < 12) {
          seed.forEach((node) => track.appendChild(node.cloneNode(true)));
          guard += 1;
        }
      };

      fillTrack(seedTrack);
      const cloneChildren = [...seedTrack.children].map((node) => node.cloneNode(true));
      tracks.slice(1).forEach((track) => {
        track.replaceChildren(...cloneChildren.map((node) => node.cloneNode(true)));
      });
    });
  };

  if (!reduceMotion) {
    setupReviewMarquees();
    let resizeTimer = 0;
    window.addEventListener(
      "resize",
      () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(setupReviewMarquees, 150);
      },
      { passive: true }
    );
  }
})();
