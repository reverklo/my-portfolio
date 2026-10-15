/**
 * Public Portfolio Render Script
 * Loads data from PortfolioStore and dynamically renders the portfolio
 */

document.addEventListener("DOMContentLoaded", () => {
  if (!window.PortfolioStore) return;

  // Realtime subscriber: updates immediately when admin saves to Firestore
  window.PortfolioStore.subscribeRealtime((data) => {
    if (!data) return;
    renderProfile(data.profile);
    renderSkills(data.skills);
    renderProjects(data.projects);
    renderContact(data.contact);
    setupFilters(data.projects);
  });
});

function renderProfile(profile) {
  if (!profile) return;
  
  const nameEl = document.getElementById("profile-name");
  const enNameEl = document.getElementById("profile-en-name");
  const titleEl = document.getElementById("profile-title");
  const statusEl = document.getElementById("profile-status");
  const bioEl = document.getElementById("profile-bio");
  const avatarEl = document.getElementById("profile-avatar");
  const resumeBtn = document.getElementById("resume-btn");

  if (nameEl) nameEl.textContent = profile.name;
  if (enNameEl) enNameEl.textContent = profile.englishName || "";
  if (titleEl) titleEl.textContent = profile.title;
  if (statusEl) statusEl.textContent = profile.statusText || "เปิดรับงาน";
  if (bioEl) bioEl.textContent = profile.bio;
  if (avatarEl) {
    const avatarSrc = (profile.avatarUrl && !profile.avatarUrl.includes("unsplash")) 
      ? profile.avatarUrl 
      : "images/avatar.jpg";
    avatarEl.src = avatarSrc;
  }
  if (resumeBtn && profile.resumeLink) {
    resumeBtn.href = profile.resumeLink;
    if (profile.resumeLink === "#") {
      resumeBtn.style.display = "none";
    }
  }
}

function renderSkills(skills) {
  const container = document.getElementById("skills-container");
  if (!container || !skills) return;

  container.innerHTML = skills.map(skill => `
    <div class="skill-card">
      <span class="skill-icon">${skill.icon || "💻"}</span>
      <div class="skill-name">${skill.name}</div>
      <div class="skill-level">${skill.level || ""}</div>
    </div>
  `).join("");
}

let activeCategory = "all";

function setupFilters(projects) {
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.getAttribute("data-category");
      renderProjects(projects, activeCategory);
    });
  });
}

function renderProjects(projects, category = "all") {
  const container = document.getElementById("projects-container");
  if (!container || !projects) return;

  const filtered = category === "all" 
    ? projects 
    : projects.filter(p => (p.category || "").toLowerCase() === category.toLowerCase());

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-dim);">
        <p>ยังไม่มีผลงานในหมวดหมู่นี้</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(proj => {
    const tagsHtml = (proj.tags || []).map(t => `<span class="tag-badge">${t}</span>`).join("");
    const demoBtn = proj.demoUrl && proj.demoUrl !== "#" 
      ? `<a href="${proj.demoUrl}" target="_blank" rel="noopener" class="project-link-btn">🚀 ดูเว็บไซต์จริง</a>` 
      : "";
    const githubBtn = proj.githubUrl && proj.githubUrl !== "#"
      ? `<a href="${proj.githubUrl}" target="_blank" rel="noopener" class="project-link-btn">🐙 ดูโค้ด GitHub</a>`
      : "";

    return `
      <div class="project-card">
        <div class="project-thumb-wrap">
          <img class="project-thumb" src="${proj.imageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600'}" alt="${proj.title}" loading="lazy" />
          <span class="project-badge">${proj.category || 'Project'}</span>
        </div>
        <div class="project-content">
          <h3 class="project-title">${proj.title}</h3>
          <p class="project-desc">${proj.desc || ''}</p>
          <div class="project-tags">${tagsHtml}</div>
          <div class="project-actions">
            ${demoBtn}
            ${githubBtn}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderContact(contact) {
  if (!contact) return;
  const emailLink = document.getElementById("contact-email");
  const githubLink = document.getElementById("contact-github");
  const linkedinLink = document.getElementById("contact-linkedin");
  const facebookLink = document.getElementById("contact-facebook");

  if (emailLink && contact.email) {
    emailLink.href = `mailto:${contact.email}`;
    emailLink.style.display = "inline-flex";
  }
  if (githubLink && contact.github) {
    githubLink.href = contact.github;
    githubLink.style.display = "inline-flex";
  }
  if (linkedinLink && contact.linkedin) {
    linkedinLink.href = contact.linkedin;
    linkedinLink.style.display = "inline-flex";
  }
  if (facebookLink && contact.facebook) {
    facebookLink.href = contact.facebook;
    facebookLink.style.display = "inline-flex";
  }
}
