/**
 * Admin Panel Logic
 * Authentication, Tab Switching, Profile/Project/Skill CRUD, Data Export/Import
 */

let appData = null;
let editingProjectId = null;

document.addEventListener("DOMContentLoaded", () => {
  if (!window.PortfolioStore) {
    alert("ไม่พบโมดูล PortfolioStore กรุณาตรวจสอบไฟล์ js/data.js");
    return;
  }

  appData = window.PortfolioStore.getData();

  initAuth();
  initTabs();
  initForms();
  renderAllAdminViews();
});

/* ----------------------------------------------------
   AUTHENTICATION (PIN)
   ---------------------------------------------------- */
function initAuth() {
  const modal = document.getElementById("auth-modal");
  const pinInput = document.getElementById("admin-pin-input");
  const unlockBtn = document.getElementById("unlock-admin-btn");
  const authError = document.getElementById("auth-error");

  const isUnlocked = sessionStorage.getItem("admin_unlocked") === "true";
  if (isUnlocked) {
    modal.style.display = "none";
  }

  unlockBtn.addEventListener("click", () => {
    checkPin();
  });

  pinInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") checkPin();
  });

  function checkPin() {
    const currentPin = (appData.admin && appData.admin.pin) || "1234";
    if (pinInput.value === currentPin) {
      sessionStorage.setItem("admin_unlocked", "true");
      modal.style.display = "none";
      authError.style.display = "none";
    } else {
      authError.style.display = "block";
      authError.textContent = "รหัส PIN ไม่ถูกต้อง (ค่าเริ่มต้นคือ 1234)";
    }
  }
}

/* ----------------------------------------------------
   TAB SWITCHING
   ---------------------------------------------------- */
function initTabs() {
  const tabs = document.querySelectorAll(".admin-tab-btn");
  const contents = document.querySelectorAll(".admin-tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.style.display = "none");

      tab.classList.add("active");
      const target = tab.getAttribute("data-tab");
      const activeContent = document.getElementById(`tab-${target}`);
      if (activeContent) activeContent.style.display = "block";
    });
  });
}

/* ----------------------------------------------------
   RENDER ADMIN VIEWS
   ---------------------------------------------------- */
function renderAllAdminViews() {
  loadProfileForm();
  renderProjectTable();
  renderSkillList();
  loadContactForm();
}

function loadProfileForm() {
  const p = appData.profile || {};
  document.getElementById("input-name").value = p.name || "";
  document.getElementById("input-en-name").value = p.englishName || "";
  document.getElementById("input-title").value = p.title || "";
  document.getElementById("input-status").value = p.statusText || "";
  
  const avatarPath = (p.avatarUrl && !p.avatarUrl.includes("unsplash")) ? p.avatarUrl : "images/avatar.jpg";
  document.getElementById("input-avatar").value = avatarPath;
  const previewImg = document.getElementById("avatar-preview-img");
  if (previewImg) previewImg.src = avatarPath;

  document.getElementById("input-bio").value = p.bio || "";
  document.getElementById("input-resume").value = p.resumeLink || "";
}

function renderProjectTable() {
  const tbody = document.getElementById("projects-table-body");
  if (!tbody) return;

  const projects = appData.projects || [];
  if (projects.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-dim);">ยังไม่มีรายการผลงาน</td></tr>`;
    return;
  }

  tbody.innerHTML = projects.map(proj => `
    <tr>
      <td>
        <div style="font-weight: 600; color: var(--text-main);">${proj.title}</div>
        <div style="font-size: 0.8rem; color: var(--text-dim);">${proj.category}</div>
      </td>
      <td>
        <span style="font-size: 0.85rem; color: var(--text-muted);">${(proj.tags || []).join(", ")}</span>
      </td>
      <td>
        <div class="table-actions">
          <button class="btn-icon-edit" onclick="editProject('${proj.id}')">✏️ แก้ไข</button>
          <button class="btn-icon-danger" onclick="deleteProject('${proj.id}')">🗑️ ลบ</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderSkillList() {
  const container = document.getElementById("admin-skills-list");
  if (!container) return;

  const skills = appData.skills || [];
  container.innerHTML = skills.map((s, index) => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-input); border-radius: var(--radius-sm); margin-bottom: 8px;">
      <div>
        <span style="font-size: 1.2rem; margin-right: 8px;">${s.icon || "💻"}</span>
        <strong>${s.name}</strong> 
        <span style="font-size: 0.8rem; color: var(--text-dim); margin-left: 8px;">(${s.level || "Skill"})</span>
      </div>
      <button class="btn-icon-danger" onclick="deleteSkill(${index})">ลบ</button>
    </div>
  `).join("");
}

function loadContactForm() {
  const c = appData.contact || {};
  document.getElementById("input-email").value = c.email || "";
  document.getElementById("input-github").value = c.github || "";
  document.getElementById("input-linkedin").value = c.linkedin || "";
  document.getElementById("input-facebook").value = c.facebook || "";

  const adminPin = (appData.admin && appData.admin.pin) || "1234";
  document.getElementById("input-admin-pin").value = adminPin;
}

/* ----------------------------------------------------
   FORMS & ACTIONS
   ---------------------------------------------------- */
function initForms() {
  // Avatar file picker & preview
  const avatarFile = document.getElementById("input-avatar-file");
  const avatarInput = document.getElementById("input-avatar");
  const avatarPreview = document.getElementById("avatar-preview-img");

  if (avatarFile) {
    avatarFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        avatarInput.value = event.target.result;
        if (avatarPreview) avatarPreview.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  if (avatarInput && avatarPreview) {
    avatarInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      if (val) avatarPreview.src = val;
    });
  }

  // Project image picker & preview
  const projImageFile = document.getElementById("proj-image-file");
  const projImageInput = document.getElementById("proj-image");
  const projPreview = document.getElementById("proj-preview-img");

  if (projImageFile) {
    projImageFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        projImageInput.value = event.target.result;
        if (projPreview) {
          projPreview.src = event.target.result;
          projPreview.style.display = "block";
        }
      };
      reader.readAsDataURL(file);
    });
  }

  if (projImageInput && projPreview) {
    projImageInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      if (val) {
        projPreview.src = val;
        projPreview.style.display = "block";
      } else {
        projPreview.style.display = "none";
      }
    });
  }

  // Save Profile
  document.getElementById("profile-form").addEventListener("submit", (e) => {
    e.preventDefault();
    appData.profile = {
      name: document.getElementById("input-name").value.trim(),
      englishName: document.getElementById("input-en-name").value.trim(),
      title: document.getElementById("input-title").value.trim(),
      statusText: document.getElementById("input-status").value.trim(),
      avatarUrl: document.getElementById("input-avatar").value.trim(),
      bio: document.getElementById("input-bio").value.trim(),
      resumeLink: document.getElementById("input-resume").value.trim()
    };
    saveAndNotify("บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว!");
  });

  // Project Form (Add / Edit)
  const projForm = document.getElementById("project-form");
  projForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("proj-title").value.trim();
    const category = document.getElementById("proj-category").value.trim();
    const desc = document.getElementById("proj-desc").value.trim();
    const tags = document.getElementById("proj-tags").value
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);
    const imageUrl = document.getElementById("proj-image").value.trim();
    const demoUrl = document.getElementById("proj-demo").value.trim();
    const githubUrl = document.getElementById("proj-github").value.trim();

    if (editingProjectId) {
      // Update existing
      const idx = appData.projects.findIndex(p => p.id === editingProjectId);
      if (idx !== -1) {
        appData.projects[idx] = {
          ...appData.projects[idx],
          title, category, desc, tags, imageUrl, demoUrl, githubUrl
        };
      }
      editingProjectId = null;
      document.getElementById("proj-submit-btn").textContent = "➕ เพิ่มผลงานใหม่";
      document.getElementById("proj-cancel-btn").style.display = "none";
    } else {
      // Add new
      const newProj = {
        id: "proj_" + Date.now(),
        title,
        category,
        desc,
        tags,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600",
        demoUrl,
        githubUrl
      };
      appData.projects.unshift(newProj);
    }

    projForm.reset();
    saveAndNotify("บันทึกผลงานเรียบร้อยแล้ว!");
    renderProjectTable();
  });

  // Cancel edit project
  document.getElementById("proj-cancel-btn").addEventListener("click", () => {
    editingProjectId = null;
    projForm.reset();
    document.getElementById("proj-submit-btn").textContent = "➕ เพิ่มผลงานใหม่";
    document.getElementById("proj-cancel-btn").style.display = "none";
  });

  // Add Skill Form
  document.getElementById("skill-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("skill-name-input").value.trim();
    const icon = document.getElementById("skill-icon-input").value.trim() || "⚡";
    const level = document.getElementById("skill-level-input").value;

    if (!name) return;

    if (!appData.skills) appData.skills = [];
    appData.skills.push({ name, icon, level });
    
    document.getElementById("skill-name-input").value = "";
    saveAndNotify("เพิ่มทักษะเรียบร้อยแล้ว!");
    renderSkillList();
  });

  // Save Contact & PIN
  document.getElementById("contact-form").addEventListener("submit", (e) => {
    e.preventDefault();
    appData.contact = {
      email: document.getElementById("input-email").value.trim(),
      github: document.getElementById("input-github").value.trim(),
      linkedin: document.getElementById("input-linkedin").value.trim(),
      facebook: document.getElementById("input-facebook").value.trim()
    };

    const newPin = document.getElementById("input-admin-pin").value.trim();
    if (newPin) {
      if (!appData.admin) appData.admin = {};
      appData.admin.pin = newPin;
    }

    saveAndNotify("บันทึกข้อมูลติดต่อและรหัสผ่านเรียบร้อยแล้ว!");
  });

  // Export JSON
  document.getElementById("export-json-btn").addEventListener("click", () => {
    window.PortfolioStore.exportJSON();
  });

  // Import JSON
  const importFile = document.getElementById("import-json-file");
  importFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const ok = window.PortfolioStore.importJSON(event.target.result);
      if (ok) {
        alert("นำเข้าข้อมูลสำเร็จแล้ว!");
        location.reload();
      } else {
        alert("รูปแบบไฟล์ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบไฟล์ JSON");
      }
    };
    reader.readAsText(file);
  });

  // Reset to default
  document.getElementById("reset-default-btn").addEventListener("click", () => {
    if (confirm("ต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?")) {
      appData = window.PortfolioStore.resetDefault();
      location.reload();
    }
  });
}

/* ----------------------------------------------------
   GLOBAL HELPERS
   ---------------------------------------------------- */
window.setAvatarPreset = function(path) {
  const avatarInput = document.getElementById("input-avatar");
  const avatarPreview = document.getElementById("avatar-preview-img");
  if (avatarInput) avatarInput.value = path;
  if (avatarPreview) avatarPreview.src = path;
};

window.editProject = function(id) {
  const proj = appData.projects.find(p => p.id === id);
  if (!proj) return;

  editingProjectId = id;
  document.getElementById("proj-title").value = proj.title || "";
  document.getElementById("proj-category").value = proj.category || "Web App";
  document.getElementById("proj-desc").value = proj.desc || "";
  document.getElementById("proj-tags").value = (proj.tags || []).join(", ");
  document.getElementById("proj-image").value = proj.imageUrl || "";
  document.getElementById("proj-demo").value = proj.demoUrl || "";
  document.getElementById("proj-github").value = proj.githubUrl || "";

  document.getElementById("proj-submit-btn").textContent = "💾 บันทึกการแก้ไข";
  document.getElementById("proj-cancel-btn").style.display = "inline-flex";

  document.getElementById("project-form").scrollIntoView({ behavior: "smooth" });
};

window.deleteProject = function(id) {
  if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบโปรเจกต์นี้?")) {
    appData.projects = appData.projects.filter(p => p.id !== id);
    saveAndNotify("ลบผลงานเรียบร้อยแล้ว");
    renderProjectTable();
  }
};

window.deleteSkill = function(index) {
  if (confirm("ต้องการลบทักษะนี้หรือไม่?")) {
    appData.skills.splice(index, 1);
    saveAndNotify("ลบทักษะเรียบร้อยแล้ว");
    renderSkillList();
  }
};

function saveAndNotify(msg) {
  const ok = window.PortfolioStore.saveData(appData);
  if (ok) {
    showToast(msg);
  } else {
    alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
  }
}

function showToast(msg) {
  const toast = document.getElementById("admin-toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = "block";
  toast.style.opacity = "1";

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => { toast.style.display = "none"; }, 300);
  }, 2500);
}
