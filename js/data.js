/**
 * Portfolio Data Management Store
 * Supports LocalStorage caching, JSON Export/Import, and Cloud sync readiness
 */

const DEFAULT_PORTFOLIO_DATA = {
  profile: {
    name: "ชิษณุพงศ์ นมัสศิลา",
    englishName: "Chitsanupong Namatsila",
    title: "Full-Stack Developer & IoT Enthusiast",
    statusText: "พร้อมรับงาน / พร้อมเริ่มงานทันที",
    bio: "สวัสดีครับ! ผมเป็นนักพัฒนาที่หลงใหลในการสร้างสรรค์ซอฟต์แวร์ เว็บแอปพลิเคชัน และระบบ IoT ที่ใช้งานได้จริง ชอบเรียนรู้เทคโนโลยีใหม่ๆ และใส่ใจในคุณภาพของโค้ดและประสบการณ์ผู้ใช้งาน",
    avatarUrl: "images/avatar.jpg",
    resumeLink: "#"
  },
  skills: [
    { name: "JavaScript / TypeScript", icon: "⚡", level: "Advanced" },
    { name: "React / Next.js", icon: "⚛️", level: "Intermediate" },
    { name: "HTML5 & Modern CSS", icon: "🎨", level: "Advanced" },
    { name: "Node.js & Express", icon: "🟢", level: "Intermediate" },
    { name: "Docker & Container", icon: "🐳", level: "Intermediate" },
    { name: "Python / Data", icon: "🐍", level: "Intermediate" },
    { name: "IoT & Arduino / ESP32", icon: "🤖", level: "Advanced" },
    { name: "Git & GitHub", icon: "🐙", level: "Advanced" }
  ],
  projects: [
    {
      id: "proj_1",
      title: "ระบบประเมินผลออนไลน์ (Assessment System)",
      category: "Web App",
      desc: "ระบบบริหารจัดการและประเมินผลออนไลน์แบบเรียลไทม์ รองรับการคำนวณคะแนนและออกรายงานผลอัตโนมัติ",
      tags: ["React", "Node.js", "REST API", "Tailwind"],
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
      demoUrl: "https://example.com",
      githubUrl: "https://github.com"
    },
    {
      id: "proj_2",
      title: "Smart Parking IoT System (SPU Parking)",
      category: "IoT / Hardware",
      desc: "ระบบตรวจจับที่จอดรถว่างอัจฉริยะด้วยเซนเซอร์และบอร์ดไมโครคอนโทรลเลอร์ พร้อมแดชบอร์ดแสดงผลแบบเรียลไทม์",
      tags: ["IoT", "Arduino", "ESP32", "MQTT", "Web Dashboard"],
      imageUrl: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80",
      demoUrl: "https://example.com",
      githubUrl: "https://github.com"
    },
    {
      id: "proj_3",
      title: "Shop Analytics & Dashboard",
      category: "Web App",
      desc: "แดชบอร์ดวิเคราะห์ยอดขายและสินค้าคงคลัง ออกแบบด้วย UI ที่ทันสมัย รองรับ Dark Mode และกราฟสถิติ",
      tags: ["Python", "Streamlit", "Data Visualization"],
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80",
      demoUrl: "https://example.com",
      githubUrl: "https://github.com"
    },
    {
      id: "proj_4",
      title: "Food Ordering Web Application",
      category: "Mobile / Web",
      desc: "เว็บแอปพลิเคชันสำหรับสั่งอาหารออนไลน์ พร้อมระบบตะกร้าสินค้า ค้นหาเมนู และบันทึกคำสั่งซื้อ",
      tags: ["HTML/CSS", "JavaScript", "Firebase"],
      imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80",
      demoUrl: "https://example.com",
      githubUrl: "https://github.com"
    }
  ],
  contact: {
    email: "your.email@example.com",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
    facebook: "https://facebook.com",
    location: "Bangkok, Thailand"
  },
  admin: {
    pin: "1234" // Default PIN for admin page access (can be changed in settings)
  }
};

const STORAGE_KEY = "portfolio_site_data_v1";

const PortfolioStore = {
  // Get all data (from localStorage if present, otherwise default)
  getData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Could not load from localStorage:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA));
  },

  // Save data to localStorage
  saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("Save failed:", e);
      return false;
    }
  },

  // Reset to default data
  resetDefault() {
    localStorage.removeItem(STORAGE_KEY);
    return JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA));
  },

  // Export as downloadable JSON file
  exportJSON() {
    const data = this.getData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Import JSON string
  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.profile && parsed.projects) {
        this.saveData(parsed);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Import error:", e);
      return false;
    }
  }
};

window.PortfolioStore = PortfolioStore;
