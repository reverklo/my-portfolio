/**
 * Portfolio Data Management Store with Realtime Firebase Firestore Sync
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAHGl2O2NtiwiBN8_ee_sGmIyyHavJihwg",
  authDomain: "my-portfolio-db-7eb75.firebaseapp.com",
  projectId: "my-portfolio-db-7eb75",
  storageBucket: "my-portfolio-db-7eb75.firebasestorage.app",
  messagingSenderId: "985596626673",
  appId: "1:985596626673:web:9e86714dff646554784b50",
  measurementId: "G-42KBHG7NFJ"
};

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
    github: "https://github.com/reverklo",
    linkedin: "https://linkedin.com",
    facebook: "https://facebook.com",
    location: "Bangkok, Thailand"
  },
  admin: {
    pin: "1234"
  }
};

const STORAGE_KEY = "portfolio_site_data_v1";

// Initialize Firebase if library is available
let firestoreDb = null;
if (typeof firebase !== "undefined") {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    firestoreDb = firebase.firestore();
  } catch (err) {
    console.warn("Firebase init error:", err);
  }
}

const PortfolioStore = {
  // Listen for real-time changes from Firebase Firestore
  subscribeRealtime(onDataUpdate) {
    // 1. Initial fallback from cache or default
    const localData = this.getData();
    if (onDataUpdate) onDataUpdate(localData);

    // 2. Realtime listener from Cloud Firestore
    if (firestoreDb) {
      firestoreDb.collection("portfolio").doc("main")
        .onSnapshot((doc) => {
          if (doc.exists) {
            const cloudData = doc.data();
            this.saveData(cloudData); // update local cache
            if (onDataUpdate) onDataUpdate(cloudData);
          } else {
            // First time: initialize cloud doc with default data
            this.saveToCloud(localData);
          }
        }, (err) => {
          console.warn("Firestore realtime listen error:", err);
        });
    }
  },

  // Get data (cache or default)
  getData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("LocalStorage error:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA));
  },

  // Save to localStorage
  saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("Save error:", e);
      return false;
    }
  },

  // Save directly to Firebase Cloud
  async saveToCloud(data) {
    this.saveData(data);
    if (!firestoreDb) return false;
    try {
      await firestoreDb.collection("portfolio").doc("main").set(data);
      return true;
    } catch (err) {
      console.error("Firebase saveToCloud error:", err);
      return false;
    }
  }
};

window.PortfolioStore = PortfolioStore;
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
