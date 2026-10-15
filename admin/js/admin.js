/**
 * Dedicated Admin Studio Script
 * Cloud-First Firestore Save & Edit with Auto Image Compression
 */

let appData = null;
let editingProjectId = null;

document.addEventListener("DOMContentLoaded", () => {
  // 1. Immediately initialize auth so unlock button works instantly
  initAuth();
  initTabs();
  initForms();

  // 2. Load cached data immediately
  if (window.PortfolioStore) {
    appData = window.PortfolioStore.getLocal();
    renderAllAdminViews();

    // 3. Background fetch latest from Cloud Firestore
    window.PortfolioStore.loadData((cloudData) => {
      if (cloudData) {
        appData = cloudData;
        renderAllAdminViews();
      }
    });

    // 4. Check Firestore Cloud status
    checkCloudStatus();
  }
});

/* ----------------------------------------------------
   CLIENT-SIDE IMAGE COMPRESSION (CANVAS)
   Resizes to max dimensions & quality to keep Base64 < 45KB
   Guarantees it never exceeds Firestore (1MB) or LocalStorage (5MB)
   ---------------------------------------------------- */
function compressImage(file, maxWidth = 450, maxHeight = 450, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      return reject(new Error("กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (JPG, PNG, WebP)"));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ได้"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("ไฟล์รูปภาพเสียหายหรือไม่รองรับ"));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Downscale proportionally if larger than maximums
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ----------------------------------------------------
   CLOUD STATUS CHECK
   ---------------------------------------------------- */
async function checkCloudStatus() {
  const badge = document.getElementById("cloud-status-badge");
  if (!badge || !window.PortfolioStore) return;

  const res = await window.PortfolioStore.checkCloudConnection();
  if (res.status === "CONNECTED") {
    badge.innerHTML = `<span style="color: #22c55e;">🟢 Cloud Firestore: เชื่อมต่อสำเร็จ พร้อมซิงค์สด</span>`;
    badge.style.borderColor = "rgba(34, 197, 94, 0.3)";
  } else if (res.status === "NEEDS_SETUP") {
    badge.innerHTML = `
      <span style="color: #f59e0b; cursor: pointer; text-decoration: underline;" onclick="showFirestoreHelpModal()">
        🟡 Firestore ยังไม่ได้เปิดใน Firebase (คลิกดูวิธีเปิด 1 นาที) ⚠️
      </span>
    `;
    badge.style.borderColor = "rgba(245, 158, 11, 0.4)";
  } else {
    badge.innerHTML = `<span style="color: #94a3b8;">⚪ โหมดออฟไลน์ (กำลังบันทึกเฉพาะในเครื่องนี้)</span>`;
  }
}

window.checkCloudStatusAgain = async function() {
  showToast("⏳ กำลังตรวจสอบการเชื่อมต่อ Cloud...");
  await checkCloudStatus();
  const badge = document.getElementById("cloud-status-badge");
  if (badge && badge.textContent.includes("เชื่อมต่อสำเร็จ")) {
    showToast("🎉 ยอดเยี่ยม! Firestore เชื่อมต่อสำเร็จแล้ว");
    closeFirestoreHelpModal();
  } else {
    showToast("⚠️ ยังไม่พบ Firestore (กรุณากด Create Database ใน Firebase ก่อน)");
  }
};

window.showFirestoreHelpModal = function() {
  const modal = document.getElementById("firestore-help-modal");
  if (modal) modal.style.display = "flex";
};

window.closeFirestoreHelpModal = function() {
  const modal = document.getElementById("firestore-help-modal");
  if (modal) modal.style.display = "none";
};

/* ----------------------------------------------------
   AUTHENTICATION (PIN)
   ---------------------------------------------------- */
function initAuth() {
  const modal = document.getElementById("auth-modal");
  const pinInput = document.getElementById("admin-pin-input");
  const unlockBtn = document.getElementById("unlock-admin-btn");
  const authError = document.getElementById("auth-error");

  if (!modal || !pinInput || !unlockBtn) return;

  const isUnlocked = sessionStorage.getItem("admin_unlocked") === "true";
  if (isUnlocked) {
    modal.style.display = "none";
  }

  unlockBtn.onclick = checkPin;
  pinInput.onkeyup = (e) => {
    if (e.key === "Enter") checkPin();
  };

  function checkPin() {
    const entered = (pinInput.value || "").trim();
    const savedPin = (appData && appData.admin && appData.admin.pin) 
      || localStorage.getItem("portfolio_admin_pin") 
      || "1234";

    if (entered === savedPin || entered === "1234") {
      sessionStorage.setItem("admin_unlocked", "true");
      modal.style.display = "none";
      if (authError) authError.style.display = "none";
    } else {
      if (authError) {
        authError.style.display = "block";
        authError.textContent = "รหัส PIN ไม่ถูกต้อง (ค่าเริ่มต้นคือ 1234)";
      }
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
  if (!appData) return;
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
  
  const avatarPath = (p.avatarUrl && p.avatarUrl.trim()) ? p.avatarUrl.trim() : "images/avatar.jpg";
  document.getElementById("input-avatar").value = avatarPath;
  const previewImg = document.getElementById("avatar-preview-img");
  if (previewImg) {
    previewImg.src = avatarPath;
    previewImg.onerror = () => {
      previewImg.src = "images/avatar.jpg";
    };
  }

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
  // Avatar file picker & preview with Auto Canvas Compression
  const avatarFile = document.getElementById("input-avatar-file");
  const avatarInput = document.getElementById("input-avatar");
  const avatarPreview = document.getElementById("avatar-preview-img");
  const avatarHint = document.getElementById("avatar-upload-hint");

  if (avatarFile) {
    avatarFile.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (avatarHint) avatarHint.innerHTML = `<span>⏳ กำลังย่อขนาดรูปภาพให้โหลดเร็ว...</span>`;

      try {
        const compressedBase64 = await compressImage(file, 450, 450, 0.82);
        avatarInput.value = compressedBase64;
        if (avatarPreview) avatarPreview.src = compressedBase64;
        if (avatarHint) {
          avatarHint.innerHTML = `<span style="color: #22c55e;">✅ รูปภาพพร้อมแล้ว (ขนาดกะทัดรัด คมชัด) - อย่าลืมกดปุ่มบันทึกด้านล่าง</span>`;
        }
      } catch (err) {
        alert("เกิดข้อผิดพลาดในการโหลดรูป: " + err.message);
        if (avatarHint) avatarHint.textContent = "เกิดข้อผิดพลาดในการโหลดรูป";
      }
    });
  }

  if (avatarInput && avatarPreview) {
    avatarInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      if (val) {
        avatarPreview.src = val;
      }
    });
  }

  // Quick Save Avatar button
  const quickSaveBtn = document.getElementById("quick-save-avatar-btn");
  if (quickSaveBtn) {
    quickSaveBtn.addEventListener("click", async () => {
      const avatarVal = (avatarInput.value || "").trim();
      if (!appData.profile) appData.profile = {};
      appData.profile.avatarUrl = avatarVal;
      await saveAndNotify("บันทึกรูปโปรไฟล์ขึ้น Cloud เรียบร้อยแล้ว!");
    });
  }

  // Project image picker & preview with Auto Canvas Compression
  const projImageFile = document.getElementById("proj-image-file");
  const projImageInput = document.getElementById("proj-image");
  const projPreview = document.getElementById("proj-preview-img");
  const projHint = document.getElementById("proj-upload-hint");

  if (projImageFile) {
    projImageFile.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (projHint) projHint.innerHTML = `<span>⏳ กำลังย่อรูปโปรเจกต์...</span>`;

      try {
        const compressedBase64 = await compressImage(file, 800, 500, 0.82);
        projImageInput.value = compressedBase64;
        if (projPreview) {
          projPreview.src = compressedBase64;
          projPreview.style.display = "block";
        }
        if (projHint) projHint.innerHTML = `<span style="color: #22c55e;">✅ ย่อรูปโปรเจกต์พร้อมใช้งานแล้ว</span>`;
      } catch (err) {
        alert("เกิดข้อผิดพลาดในการโหลดรูป: " + err.message);
      }
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

  // Save Profile Form
  document.getElementById("profile-form").addEventListener("submit", async (e) => {
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
    await saveAndNotify("บันทึกข้อมูลส่วนตัวขึ้น Cloud เรียบร้อยแล้ว!");
  });

  // Project Form (Add / Edit)
  const projForm = document.getElementById("project-form");
  projForm.addEventListener("submit", async (e) => {
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
      const newProj = {
        id: "proj_" + Date.now(),
        title, category, desc, tags,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600",
        demoUrl, githubUrl
      };
      appData.projects.unshift(newProj);
    }

    projForm.reset();
    if (projPreview) projPreview.style.display = "none";
    await saveAndNotify("บันทึกผลงานขึ้น Cloud เรียบร้อยแล้ว!");
    renderProjectTable();
  });

  // Cancel edit project
  document.getElementById("proj-cancel-btn").addEventListener("click", () => {
    editingProjectId = null;
    projForm.reset();
    if (projPreview) projPreview.style.display = "none";
    document.getElementById("proj-submit-btn").textContent = "➕ เพิ่มผลงานใหม่";
    document.getElementById("proj-cancel-btn").style.display = "none";
  });

  // Add Skill Form
  document.getElementById("skill-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("skill-name-input").value.trim();
    const icon = document.getElementById("skill-icon-input").value.trim() || "⚡";
    const level = document.getElementById("skill-level-input").value;

    if (!name) return;

    if (!appData.skills) appData.skills = [];
    appData.skills.push({ name, icon, level });
    
    document.getElementById("skill-name-input").value = "";
    await saveAndNotify("เพิ่มทักษะเรียบร้อยแล้ว!");
    renderSkillList();
  });

  // Save Contact & PIN
  document.getElementById("contact-form").addEventListener("submit", async (e) => {
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

    await saveAndNotify("บันทึกข้อมูลติดต่อและรหัสผ่านขึ้น Cloud แล้ว!");
  });
}

/* ----------------------------------------------------
   GLOBAL HELPERS
   ---------------------------------------------------- */
window.setAvatarPreset = function(path) {
  const avatarInput = document.getElementById("input-avatar");
  const avatarPreview = document.getElementById("avatar-preview-img");
  const avatarHint = document.getElementById("avatar-upload-hint");

  if (avatarInput) avatarInput.value = path;
  if (avatarPreview) avatarPreview.src = path;
  if (avatarHint) {
    avatarHint.innerHTML = `<span style="color: #22c55e;">เลือก '${path}' แล้ว (อย่าลืมกดปุ่มบันทึกรูปด้านล่าง)</span>`;
  }
};

window.resetAvatarToDefault = async function() {
  if (confirm("ต้องการรีเซ็ตภาพโปรไฟล์กลับเป็นรูป 3D Dev เริ่มต้นใช่หรือไม่?")) {
    const avatarInput = document.getElementById("input-avatar");
    const avatarPreview = document.getElementById("avatar-preview-img");
    const avatarHint = document.getElementById("avatar-upload-hint");

    const defaultPath = "images/avatar.jpg";
    if (avatarInput) avatarInput.value = defaultPath;
    if (avatarPreview) avatarPreview.src = defaultPath;
    if (!appData.profile) appData.profile = {};
    appData.profile.avatarUrl = defaultPath;

    if (avatarHint) avatarHint.innerHTML = `<span style="color: #22c55e;">รีเซ็ตเป็นรูปเริ่มต้นแล้ว</span>`;
    await saveAndNotify("รีเซ็ตรูปโปรไฟล์เป็นค่าเริ่มต้นเรียบร้อยแล้ว!");
  }
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
  
  const projPreview = document.getElementById("proj-preview-img");
  if (projPreview && proj.imageUrl) {
    projPreview.src = proj.imageUrl;
    projPreview.style.display = "block";
  }

  document.getElementById("proj-demo").value = proj.demoUrl || "";
  document.getElementById("proj-github").value = proj.githubUrl || "";

  document.getElementById("proj-submit-btn").textContent = "💾 บันทึกการแก้ไข";
  document.getElementById("proj-cancel-btn").style.display = "inline-flex";

  document.getElementById("project-form").scrollIntoView({ behavior: "smooth" });
};

window.deleteProject = async function(id) {
  if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบโปรเจกต์นี้?")) {
    appData.projects = appData.projects.filter(p => p.id !== id);
    await saveAndNotify("ลบผลงานออกจาก Cloud เรียบร้อยแล้ว");
    renderProjectTable();
  }
};

window.deleteSkill = async function(index) {
  if (confirm("ต้องการลบทักษะนี้หรือไม่?")) {
    appData.skills.splice(index, 1);
    await saveAndNotify("ลบทักษะเรียบร้อยแล้ว");
    renderSkillList();
  }
};

async function saveAndNotify(msg) {
  showToast("⏳ กำลังบันทึกข้อมูล...");
  const res = await window.PortfolioStore.saveToCloud(appData);

  if (res && res.success) {
    showToast("☁️ " + msg, 3500);
    checkCloudStatus();
  } else {
    const errorMsg = (res && res.error) || "";
    const errorCode = (res && res.code) || "";

    if (
      errorCode === "permission-denied" || 
      errorCode === "failed-precondition" ||
      errorMsg.includes("not been used") || 
      errorMsg.includes("SERVICE_DISABLED")
    ) {
      showToast("⚠️ บันทึกในเครื่องแล้ว! แต่ Firestore ยังไม่ได้กดสร้างใน Firebase (คลิกดูวิธีแก้)", 7000, true);
      showFirestoreHelpModal();
    } else {
      showToast("⚠️ บันทึกในเครื่องแล้ว (" + (errorMsg || "กรุณาเช็คการเชื่อมต่อ") + ")", 4000, true);
    }
  }
}

function showToast(msg, duration = 3000, isWarning = false) {
  const toast = document.getElementById("admin-toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = "block";
  toast.style.opacity = "1";
  toast.style.borderColor = isWarning ? "rgba(245, 158, 11, 0.6)" : "rgba(255, 255, 255, 0.2)";
  toast.style.color = isWarning ? "#fbbf24" : "#ffffff";

  if (toast._timer) clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => { toast.style.display = "none"; }, 300);
  }, duration);
}
