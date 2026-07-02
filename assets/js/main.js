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

  /* --------------------------- Brain data-flow canvas --------------------------- */
  function initBrainFlowCanvas(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width, height, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let brainNodes = [], brainEdges = [], particles = [], animationFrame;

    function buildBrain() {
      brainNodes = [];
      const cx = width * 0.74;
      const cy = height * 0.42;
      const baseR = Math.min(width * 0.5, height) * 0.2;
      const ringCount = 26;
      for (let i = 0; i < ringCount; i++) {
        const t = (i / ringCount) * Math.PI * 2;
        const wobble = 1 + 0.22 * Math.sin(3 * t + 0.4) + 0.13 * Math.sin(7 * t + 1.2) + 0.08 * Math.sin(2 * t);
        const r = baseR * wobble;
        brainNodes.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r * 0.82, pulse: 0 });
      }
      for (let i = 0; i < 14; i++) {
        const t = Math.random() * Math.PI * 2;
        const r = baseR * (0.15 + Math.random() * 0.55);
        brainNodes.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r * 0.82, pulse: 0 });
      }
      brainEdges = [];
      for (let i = 0; i < brainNodes.length; i++) {
        const dists = brainNodes
          .map((n, j) => [j, Math.hypot(n.x - brainNodes[i].x, n.y - brainNodes[i].y)])
          .filter(([j]) => j !== i)
          .sort((a, b) => a[1] - b[1]);
        for (let k = 0; k < 2; k++) {
          const j = dists[k][0];
          if (j > i) brainEdges.push([i, j]);
        }
      }
    }

    function spawnParticle() {
      const edge = Math.floor(Math.random() * 4);
      let sx, sy;
      if (edge === 0) { sx = 0; sy = Math.random() * height; }
      else if (edge === 1) { sx = width; sy = Math.random() * height; }
      else if (edge === 2) { sx = Math.random() * width; sy = 0; }
      else { sx = Math.random() * width; sy = height; }
      const target = brainNodes[Math.floor(Math.random() * brainNodes.length)];
      const cx = (sx + target.x) / 2 + (Math.random() - 0.5) * 180;
      const cy = (sy + target.y) / 2 + (Math.random() - 0.5) * 180;
      return {
        sx, sy, cx, cy, tx: target.x, ty: target.y, targetNode: target,
        t: 0, speed: 0.0035 + Math.random() * 0.004, trail: [],
        isAmber: Math.random() < 0.15,
      };
    }

    function bezierPoint(t, x0, y0, x1, y1, x2, y2) {
      const mt = 1 - t;
      return [mt * mt * x0 + 2 * mt * t * x1 + t * t * x2, mt * mt * y0 + 2 * mt * t * y1 + t * t * y2];
    }

    function drawStatic() {
      ctx.clearRect(0, 0, width, height);
      brainEdges.forEach(([i, j]) => {
        const a = brainNodes[i], b = brainNodes[j];
        ctx.strokeStyle = "rgba(95, 208, 255, 0.18)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });
      brainNodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(61, 139, 255, 0.55)";
        ctx.fill();
      });
    }

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildBrain();
      particles = Array.from({ length: 16 }, () => {
        const p = spawnParticle();
        p.t = Math.random();
        return p;
      });
    }

    function step() {
      ctx.clearRect(0, 0, width, height);

      brainEdges.forEach(([i, j]) => {
        const a = brainNodes[i], b = brainNodes[j];
        ctx.strokeStyle = "rgba(95, 208, 255, 0.18)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });

      brainNodes.forEach((n) => {
        n.pulse *= 0.94;
        const r = 2.2 + n.pulse * 4;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = n.pulse > 0.05 ? `rgba(255, 171, 64, ${0.5 + n.pulse * 0.5})` : "rgba(61, 139, 255, 0.55)";
        ctx.fill();
      });

      particles.forEach((p, idx) => {
        p.t += p.speed;
        const [x, y] = bezierPoint(Math.min(p.t, 1), p.sx, p.sy, p.cx, p.cy, p.tx, p.ty);
        p.trail.push([x, y]);
        if (p.trail.length > 14) p.trail.shift();

        for (let k = 0; k < p.trail.length; k++) {
          const [tx, ty] = p.trail[k];
          const alpha = (k / p.trail.length) * 0.5;
          ctx.beginPath();
          ctx.arc(tx, ty, 1.6, 0, Math.PI * 2);
          ctx.fillStyle = p.isAmber ? `rgba(255, 171, 64, ${alpha})` : `rgba(95, 208, 255, ${alpha})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = p.isAmber ? "rgba(255, 196, 120, 0.95)" : "rgba(160, 220, 255, 0.95)";
        ctx.fill();

        if (p.t >= 1) {
          p.targetNode.pulse = 1;
          particles[idx] = spawnParticle();
        }
      });

      animationFrame = requestAnimationFrame(step);
    }

    resize();
    if (!prefersReducedMotion) {
      step();
    } else {
      drawStatic();
    }

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cancelAnimationFrame(animationFrame);
        resize();
        if (!prefersReducedMotion) step();
        else drawStatic();
      }, 200);
    });
  }

  document.querySelectorAll("[data-brain-flow]").forEach(initBrainFlowCanvas);

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
