(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------ Footer year ------------------------------ */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* -------------------------------- Navbar ---------------------------------- */
  const navbar = document.querySelector(".navbar");
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  const onScroll = () => {
    if (!navbar) return;
    navbar.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------------------------- Hero word rotator ---------------------------- */
  const rotator = document.querySelector("[data-rotator]");
  if (rotator) {
    let words;
    try {
      words = JSON.parse(rotator.getAttribute("data-rotator"));
    } catch (e) {
      words = null;
    }
    if (Array.isArray(words) && words.length > 1 && !prefersReducedMotion) {
      let index = 0;
      rotator.textContent = words[0];
      setInterval(() => {
        rotator.style.opacity = "0";
        rotator.style.transform = "translateY(8px)";
        setTimeout(() => {
          index = (index + 1) % words.length;
          rotator.textContent = words[index];
          rotator.style.opacity = "1";
          rotator.style.transform = "translateY(0)";
        }, 380);
      }, 2600);
      rotator.style.transition = "opacity 0.38s ease, transform 0.38s ease";
    }
  }

  /* ------------------------------ Scroll reveal ------------------------------ */
  const revealTargets = document.querySelectorAll("[data-reveal], [data-reveal-group]");
  if ("IntersectionObserver" in window && revealTargets.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  /* --------------------------------- Counters --------------------------------- */
  const counters = document.querySelectorAll("[data-counter]");
  if (counters.length) {
    const animateCounter = (el) => {
      const target = parseFloat(el.getAttribute("data-counter"));
      const suffix = el.getAttribute("data-suffix") || "";
      const duration = 1400;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = target % 1 === 0 ? Math.round(target * eased) : (target * eased).toFixed(1);
        el.textContent = value + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      };

      if (prefersReducedMotion) {
        el.textContent = target + suffix;
      } else {
        requestAnimationFrame(tick);
      }
    };

    if ("IntersectionObserver" in window) {
      const counterIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              counterIo.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach((el) => counterIo.observe(el));
    } else {
      counters.forEach(animateCounter);
    }
  }

  /* -------------------------------- Timeline steps -------------------------------- */
  const timelineSteps = document.querySelectorAll(".timeline-step");
  if ("IntersectionObserver" in window && timelineSteps.length) {
    const tlIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.6 }
    );
    timelineSteps.forEach((el) => tlIo.observe(el));
  }

  /* ------------------------------ Card pointer glow ------------------------------ */
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
  });

  /* --------------------------- Network canvas background --------------------------- */
  function initNetworkCanvas(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width, height, nodes, animationFrame;
    const density = parseInt(canvas.getAttribute("data-density") || "70", 10);
    const maxLinkDist = 150;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(24, Math.round((width * height) / (1000000 / density)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.4 + 0.6,
        isAmber: Math.random() < 0.1,
      }));
    }

    function step() {
      ctx.clearRect(0, 0, width, height);

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxLinkDist) {
            const opacity = (1 - dist / maxLinkDist) * 0.35;
            ctx.strokeStyle = `rgba(47, 92, 134, ${opacity * 1.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.isAmber ? "rgba(176, 141, 87, 0.85)" : "rgba(47, 92, 134, 0.55)";
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(step);
    }

    resize();
    if (!prefersReducedMotion) {
      step();
    } else {
      // draw a single static frame
      ctx.clearRect(0, 0, width, height);
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.isAmber ? "rgba(176, 141, 87, 0.85)" : "rgba(47, 92, 134, 0.55)";
        ctx.fill();
      });
    }

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cancelAnimationFrame(animationFrame);
        resize();
        if (!prefersReducedMotion) step();
      }, 200);
    });
  }

  document.querySelectorAll("[data-network-canvas]").forEach(initNetworkCanvas);

  /* ------------------------------- Contact form ------------------------------- */
  const form = document.querySelector("[data-contact-form]");
  if (form) {
    const successBox = form.querySelector(".form-success");

    const validators = {
      name: (v) => v.trim().length >= 2,
      company: (v) => v.trim().length >= 2,
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      phone: (v) => v.trim().length === 0 || /^[+()\-.\s\d]{7,}$/.test(v.trim()),
      country: (v) => v.trim().length > 0,
      message: (v) => v.trim().length >= 10,
    };

    const setFieldState = (field, valid) => {
      field.classList.toggle("has-error", !valid);
    };

    form.querySelectorAll("input, select, textarea").forEach((input) => {
      input.addEventListener("blur", () => {
        const rule = validators[input.name];
        if (!rule) return;
        const field = input.closest(".field");
        if (field) setFieldState(field, rule(input.value));
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let isValid = true;

      form.querySelectorAll("input, select, textarea").forEach((input) => {
        const rule = validators[input.name];
        if (!rule) return;
        const field = input.closest(".field");
        const valid = rule(input.value);
        if (field) setFieldState(field, valid);
        if (!valid) isValid = false;
      });

      if (!isValid) {
        const firstError = form.querySelector(".has-error input, .has-error select, .has-error textarea");
        if (firstError) firstError.focus();
        return;
      }

      if (successBox) {
        successBox.classList.add("is-visible");
      }
      form.reset();
    });
  }
})();
