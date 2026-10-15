/**
 * Public Portfolio Render Script
 * Loads data from PortfolioStore and dynamically renders the portfolio
 */

document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();

  if (!window.PortfolioStore) return;

  // Realtime subscriber: updates immediately when admin saves to Firestore
  window.PortfolioStore.subscribeRealtime((data) => {
    if (!data) return;
    renderProfile(data.profile);
    renderSkills(data.skills);
    renderProjects(data.projects);
    renderExperience(data.experience);
    renderCertificates(data.certificates);
    renderContact(data.contact);
    setupFilters(data.projects);
  });

  setupCertLightbox();
});

function setupMobileMenu() {
  const toggleBtn = document.getElementById("nav-toggle-btn");
  const navMenu = document.getElementById("nav-menu");
  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener("click", () => {
    toggleBtn.classList.toggle("active");
    navMenu.classList.toggle("open");
  });

  navMenu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      toggleBtn.classList.remove("active");
      navMenu.classList.remove("open");
    });
  });
}

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
    const avatarSrc = (profile.avatarUrl && profile.avatarUrl.trim()) 
      ? profile.avatarUrl.trim() 
      : "images/avatar.jpg";
    avatarEl.src = avatarSrc;
    avatarEl.onerror = () => {
      // Fallback if image fails to load
      avatarEl.src = "images/avatar.jpg";
    };
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

function renderExperience(experience) {
  const container = document.getElementById("experience-container");
  if (!container) return;

  const list = experience || [];
  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-dim);">
        <p>ยังไม่มีข้อมูลประสบการณ์ทำงาน</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(item => {
    const skillsHtml = (item.skills || []).map(s => `<span class="tag-badge">${s}</span>`).join("");
    return `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <div class="timeline-header">
            <div>
              <h3 class="timeline-role">${item.role}</h3>
              <div class="timeline-company">🏢 ${item.company}</div>
            </div>
            <span class="timeline-period-badge">📅 ${item.period || ""}</span>
          </div>
          <p class="timeline-desc">${item.desc || ""}</p>
          ${skillsHtml ? `<div class="timeline-skills">${skillsHtml}</div>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

function renderCertificates(certificates) {
  const container = document.getElementById("certificates-container");
  if (!container) return;

  const list = certificates || [];
  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-dim);">
        <p>ยังไม่มีรายการใบประกาศนียบัตร</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(cert => {
    const fallbackImg = "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&auto=format&fit=crop&q=80";
    const certImg = cert.imageUrl || fallbackImg;
    const verifyBtn = cert.credentialUrl && cert.credentialUrl !== "#"
      ? `<a href="${cert.credentialUrl}" target="_blank" rel="noopener" class="cert-link-btn cert-link-verify">🌐 ตรวจสอบออนไลน์</a>`
      : "";

    return `
      <div class="cert-card">
        <div class="cert-thumb-wrap" onclick="openCertLightbox('${certImg}', '${escapeHtml(cert.title)} - ${escapeHtml(cert.issuer || "")}')">
          <img class="cert-thumb" src="${certImg}" alt="${cert.title}" loading="lazy" onerror="this.src='${fallbackImg}'" />
          <span class="cert-zoom-hint">🔍 คลิกดูรูปใหญ่</span>
          <span class="cert-date-badge">${cert.date || ""}</span>
        </div>
        <div class="cert-content">
          <h3 class="cert-title">${cert.title}</h3>
          <div class="cert-issuer">
            <span>🏛️</span>
            <span>${cert.issuer || "ผู้มอบใบรับรอง"}</span>
          </div>
          <div class="cert-actions">
            <button type="button" class="cert-link-btn" onclick="openCertLightbox('${certImg}', '${escapeHtml(cert.title)} - ${escapeHtml(cert.issuer || "")}')">
              🔍 ดูรูปใบประกาศฯ
            </button>
            ${verifyBtn}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function setupCertLightbox() {
  const modal = document.getElementById("cert-lightbox");
  const closeBtn = document.getElementById("cert-modal-close-btn");
  if (!modal || !closeBtn) return;

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display === "flex") {
      modal.style.display = "none";
    }
  });
}

window.openCertLightbox = function(imgSrc, caption) {
  const modal = document.getElementById("cert-lightbox");
  const modalImg = document.getElementById("cert-modal-img");
  const modalCaption = document.getElementById("cert-modal-caption");

  if (!modal || !modalImg) return;
  modalImg.src = imgSrc;
  if (modalCaption) modalCaption.textContent = caption || "";
  modal.style.display = "flex";
};

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

