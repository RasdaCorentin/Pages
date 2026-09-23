// Composant Alpine.js unique de la page. Contenu 100% statique (transcrit du
// README) : pas de fetch, juste de la navigation (sidebar active, accordéons).
document.addEventListener("alpine:init", () => {
  Alpine.data("readme", () => ({
    activeSection: "presentation",
    openPanels: {},

    init() {
      const sections = [...document.querySelectorAll("section[id]")];
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (visible) this.activeSection = visible.target.id;
        },
        { rootMargin: "-15% 0px -70% 0px", threshold: [0, 0.25, 0.5, 1] }
      );
      sections.forEach((s) => observer.observe(s));
    },

    isActive(id) {
      return this.activeSection === id;
    },

    togglePanel(id) {
      this.openPanels[id] = !this.openPanels[id];
    },

    isOpen(id) {
      return !!this.openPanels[id];
    },
  }));
});
