(() => {
    // ======================
    // HELPER FUNCTIONS
    // ======================
    const createButton = (label, onClick, bgColor = "#22c55e", tooltip = "") => {
      const btn = document.createElement("button");
      btn.textContent = label;
      if (tooltip) btn.title = tooltip;
      btn.style.cssText = `
        padding: 10px;
        background: ${bgColor};
        color: #ffffff;
        font-weight: 600;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.3s, transform 0.2s;
        position: relative;
      `;
      btn.onmouseenter = () => {
        btn.style.transform = "scale(1.05)";
        btn.style.opacity = "0.9";
      };
      btn.onmouseleave = () => {
        btn.style.transform = "scale(1)";
        btn.style.opacity = "1";
      };
      btn.onclick = onClick;
      return btn;
    };
  
    const closeAllModals = async () => {  // Marked as async
      // Try multiple known close selectors
      const closeSelectors = [
        '[aria-label="Close"]',
        '[data-testid="app-bar-close"]',
        'div[role="button"][tabindex="0"]',
        'div[role="dialog"] button:first-child'
      ];
  
      let closedAny = false;
      for (const selector of closeSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          try {
            if (el && el.click) {
              el.click();
              closedAny = true;
              await delay(200); // Now valid since function is async
            }
          } catch (e) {
            console.error("Failed to close modal:", e);
          }
        }
      }
  
      // Additional fallback - click outside modal
      const dialogs = document.querySelectorAll('[role="dialog"]');
      if (dialogs.length > 0 && !closedAny) {
        document.body.click();
        closedAny = true;
      }
  
      if (closedAny) {
        updateStatus("🔄 Menutup semua modal yang mengganggu...");
        return true;
      }
      return false;
    };
  
    // ======================
    // UI SETUP
    // ======================
    const container = document.createElement("div");
    container.id = "tweetBotMenu";
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      backdrop-filter: blur(8px);
      background: rgba(0, 0, 0, 0.6);
      padding: 15px;
      border-radius: 12px;
      box-shadow: 0 0 15px rgba(0,0,0,0.7);
      font-family: sans-serif;
      max-width: 360px;
      width: 100%;
      color: white;
    `;
  
    const antiAIBTitle = document.createElement("h3");
    antiAIBTitle.textContent = "Anti AIB";
    antiAIBTitle.style.cssText = `
      margin: 0 0 10px 0;
      padding: 0;
      font-size: 18px;
      color: #fff;
      text-align: center;
    `;
    container.appendChild(antiAIBTitle);
  
    // Safe Mode Toggle
    const safeModeWrapper = document.createElement("div");
    safeModeWrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    `;
  
    const safeModeCheckbox = document.createElement("input");
    safeModeCheckbox.type = "checkbox";
    safeModeCheckbox.id = "safeModeToggle";
    safeModeCheckbox.title = "Mode lebih aman dengan delay acak untuk hindari limit Twitter";
  
    safeModeCheckbox.addEventListener('change', function() {
      if(this.checked) {
        updateStatus("🛡️ Safe Mode aktif: proses akan lebih lambat dan acak untuk menghindari limit.");
      } else {
        updateStatus("⚡ Safe Mode nonaktif: proses berjalan cepat, tapi berisiko limit.");
      }
    });
  
    const safeModeLabel = document.createElement("label");
    safeModeLabel.htmlFor = "safeModeToggle";
    safeModeLabel.style.cssText = "font-size: 14px;";
    safeModeLabel.textContent = "Aktifkan Safe Mode (lebih aman, tapi lebih lambat)";
    safeModeLabel.title = "Centang untuk mode lebih aman";
  
    safeModeWrapper.appendChild(safeModeCheckbox);
    safeModeWrapper.appendChild(safeModeLabel);
    container.appendChild(safeModeWrapper);
  
    // Description Area
    const descriptionArea = document.createElement("div");
    descriptionArea.id = "actionDescription";
    descriptionArea.style.cssText = `
      font-size: 13px;
      margin-bottom: 8px;
      min-height: 20px;
      color: #ccc;
      font-style: italic;
    `;
    descriptionArea.textContent = "Pilih jenis konten yang ingin dibersihkan. Form username akan muncul jika diperlukan.";
  
    // Button Groups
    const btnGroup1 = document.createElement("div");
    btnGroup1.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    `;
  
    const btnGroup2 = document.createElement("div");
    btnGroup2.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    `;
  
    // Log Container
    const logContainer = document.createElement("div");
    logContainer.style.cssText = `
      background: #0a0a0a;
      color: #0f0;
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 13px;
      line-height: 1.5;
      min-height: 48px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      transition: opacity 0.3s ease;
      white-space: pre-wrap;
    `;
  
    const statusLine = document.createElement("div");
    const totalLine = document.createElement("div");
    logContainer.appendChild(statusLine);
    logContainer.appendChild(totalLine);
  
    // ======================
    // CORE FUNCTIONALITY
    // ======================
    let currentTotal = 0;
    let isCancelled = false;
    let isRunning = false;
    let formTimeout = null;
    const processed = new Set();
    let totalDeleted = 0;
  
    const updateStatus = (msg) => {
      statusLine.textContent = msg;
      console.log(msg);
    };
  
    const updateDescription = (msg) => {
      descriptionArea.textContent = msg || "";
    };
  
    const updateTotal = (total, done = false) => {
      currentTotal = total;
      totalLine.textContent = done
        ? `Selesai: Total tweet berhasil dihapus: ${currentTotal}`
        : `Memproses... Total tweet terhapus: ${currentTotal}`;
    };
  
    const delay = (ms) => {
      const safeMode = document.getElementById("safeModeToggle")?.checked;
      const base = safeMode ? ms * 2 : ms;
      const randomExtra = safeMode ? Math.floor(Math.random() * 1500) : 0;
      return new Promise(resolve => setTimeout(resolve, base + randomExtra));
    };
  
    const getAllTweets = () => Array.from(document.querySelectorAll('[data-testid="tweet"]'));
  
    const clickButton = async (el, label = "") => {
      if (!el) {
        updateStatus("❗ Elemen tidak ditemukan");
        await closeAllModals();
        return false;
      }
      
      try {
        el.scrollIntoViewIfNeeded();
        await delay(200);
        el.click();
        if (label) updateStatus(label);
        await delay(400);
        return true;
      } catch (e) {
        updateStatus(`❗ Gagal mengklik: ${e.message}`);
        await closeAllModals();
        return false;
      }
    };
  
    const detectTweetType = (tweet) => {
      const isRetweet = tweet.querySelector('[data-testid="unretweet"]') !== null;
      const isReply =
        tweet.innerText.includes("Replying to") ||
        tweet.querySelector('svg[aria-label="Reply"]') !== null ||
        Array.from(tweet.querySelectorAll('a[role="link"]')).some(a => /^@/.test(a.textContent.trim()));
      const isTweet = !isReply && !isRetweet;
      return { isRetweet, isReply, isTweet };
    };
  
    const tryProcessTweet = async (tweet, mode = "all") => {
      if (isCancelled) return false;
      
      // Clean up any modals before starting
      await closeAllModals();
      await delay(500);
  
      const { isRetweet, isReply, isTweet } = detectTweetType(tweet);
      if (mode === "repost" && !isRetweet) return false;
      if (mode === "tweet" && !isReply && !isTweet) return false;
      if (mode === "reply" && !isReply) return false;
  
      if (isRetweet && (mode === "repost" || mode === "all")) {
        const unretweetBtn = tweet.querySelector('[data-testid="unretweet"]');
        if (!unretweetBtn) {
          updateStatus("❗ Tombol unretweet tidak ditemukan");
          return false;
        }
  
        if (!(await clickButton(unretweetBtn, "Membatalkan retweet..."))) {
          return false;
        }
  
        // Extra protection against lists modal
        await closeAllModals();
        await delay(500);
  
        const confirm = document.querySelector('[data-testid="unretweetConfirm"]');
        if (confirm) {
          await clickButton(confirm, "Konfirmasi pembatalan retweet...");
          updateStatus("Retweet dibatalkan.");
          return true;
        } else {
          updateStatus("❗ Konfirmasi unretweet tidak muncul");
          await closeAllModals();
          return false;
        }
      }
  
      const caret = tweet.querySelector('[data-testid="caret"]') || 
                   tweet.querySelector('div[role="button"][aria-label*="More"]');
      if (!caret) {
        updateStatus("❗ Menu tweet tidak ditemukan");
        return false;
      }
  
      // Double-check no modals are open
      await closeAllModals();
      await delay(300);
  
      if (!(await clickButton(caret, "Membuka menu tweet..."))) {
        return false;
      }
  
      // Wait for menu to appear
      let menuItems = [];
      for (let i = 0; i < 5; i++) {
        if (isCancelled) return false;
        await delay(300);
        menuItems = Array.from(document.querySelectorAll('[role="menuitem"]'));
        if (menuItems.length > 0) break;
      }
  
      if (menuItems.length === 0) {
        updateStatus("❗ Menu tidak terbuka");
        await closeAllModals();
        return false;
      }
  
      const deleteOption = menuItems.find(item =>
        /delete|hapus|remove/i.test(item.textContent.trim())
      );
  
      if (!deleteOption) {
        updateStatus("❗ Opsi hapus tidak ditemukan");
        await closeAllModals();
        return false;
      }
  
      await clickButton(deleteOption, "Klik: Hapus tweet");
      await delay(500);
  
      // Confirm deletion
      const confirmBtn = document.querySelector('[data-testid="confirmationSheetConfirm"]');
      if (!confirmBtn) {
        updateStatus("❗ Konfirmasi hapus tidak muncul");
        await closeAllModals();
        return false;
      }
  
      await clickButton(confirmBtn, "Konfirmasi hapus");
      updateStatus("✅ Tweet berhasil dihapus.");
      return true;
    };
  
    const runDeleteProcess = async (mode = "all") => {
      if (isRunning) {
        updateStatus("❗ Proses masih berlangsung.");
        return;
      }
      isRunning = true;
      isCancelled = false;
      updateStatus("Memulai proses penghapusan tweet...");
      updateDescription("Sedang memproses penghapusan... Scroll halaman untuk memuat lebih banyak tweet.");
  
      updateTotal(totalDeleted);
      const maxNoNew = 5;
      let noNewTries = 0;
  
      while (noNewTries < maxNoNew && !isCancelled) {
        const tweets = getAllTweets().filter(t => !processed.has(t));
        if (tweets.length === 0) {
          noNewTries++;
          window.scrollBy(0, 1500);
          await delay(2000);
          continue;
        }
  
        noNewTries = 0;
  
        for (const tweet of tweets) {
          if (isCancelled) break;
          processed.add(tweet);
          const success = await tryProcessTweet(tweet, mode);
          if (success) {
            tweet.style.border = "2px solid red";
            totalDeleted++;
            updateTotal(totalDeleted);
            await delay(1500);
          } else {
            updateStatus("Tweet gagal diproses.");
          }
        }
      }
  
      if (isCancelled) {
        updateStatus("🚫 Proses dibatalkan.");
        updateDescription("Proses dibatalkan oleh pengguna.");
        await delay(1000);
      } else {
        updateStatus("✅ Pembersihan selesai.");
        updateDescription("Proses penghapusan selesai. Halaman akan direfresh...");
      }
  
      updateTotal(totalDeleted, true);
      isRunning = false;
  
      for (let i = 5; i >= 1; i--) {
        updateStatus(`Merefresh halaman dalam ${i} detik...`);
        await delay(1000);
      }
      updateStatus("Merefresh sekarang...");
      setTimeout(() => location.reload(), 500);
    };
  
    const removeUsernameForm = () => {
      const existing = document.getElementById("usernameForm");
      if (existing) existing.remove();
      if (formTimeout) clearTimeout(formTimeout);
      updateDescription("Pilih jenis konten yang ingin dibersihkan.");
    };
  
    const promptUsernameAndRedirect = (pathSuffix = "") => {
      removeUsernameForm();
      updateDescription("Masukkan username target untuk membersihkan tweet. Akan diarahkan ke profil user tersebut.");
  
      const formWrapper = document.createElement("div");
      formWrapper.id = "usernameForm";
      formWrapper.style.cssText = `
        display: flex;
        margin-bottom: 10px;
        gap: 8px;
      `;
  
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Masukkan username tanpa @";
      input.title = "Username Twitter tanpa tanda @";
      input.style.cssText = `
        flex: 1;
        padding: 8px;
        border-radius: 6px;
        border: none;
        font-size: 14px;
      `;
  
      const goBtn = createButton(
        "Pergi", 
        () => {
          const username = input.value.trim();
          if (username) {
            location.href = `https://x.com/${username}${pathSuffix}`;
          } else {
            updateStatus("❗ Username tidak boleh kosong.");
          }
        }, 
        "#0ea5e9",
        "Klik untuk membuka profil Twitter yang dimasukkan"
      );
  
      formWrapper.appendChild(input);
      formWrapper.appendChild(goBtn);
      container.insertBefore(formWrapper, btnGroup1);
      input.focus();
  
      const resetTimeout = () => {
        if (formTimeout) clearTimeout(formTimeout);
        formTimeout = setTimeout(() => {
          removeUsernameForm();
          updateStatus("⏳ Form tertutup otomatis karena tidak ada interaksi.");
          setTimeout(() => updateStatus(""), 3000);
        }, 5000);
      };
  
      input.addEventListener("input", resetTimeout);
      resetTimeout();
    };
  
    const isUserProfilePage = () => {
      const path = location.pathname;
      const pathParts = path.split('/').filter(Boolean);
      
      const reservedPaths = [
        'home', 'explore', 'notifications', 'messages',
        'i', 'compose', 'settings', 'search', 'bookmarks',
        'timeline', 'communities', 'lists', 'topics'
      ];
      
      return (
        pathParts.length >= 1 &&
        !reservedPaths.includes(pathParts[0]) &&
        !path.includes('?')
      );
    };
  
    // ======================
    // BUTTON HANDLERS
    // ======================
    const handleRetweetOnly = () => {
      removeUsernameForm();
      if (!isUserProfilePage()) {
        promptUsernameAndRedirect("");
      } else {
        updateDescription("Memproses penghapusan retweet saja...");
        runDeleteProcess("repost");
      }
    };
  
    const handleTweetAndReply = () => {
      removeUsernameForm();
      if (!isUserProfilePage() || !location.pathname.includes("/with_replies")) {
        promptUsernameAndRedirect("/with_replies");
      } else {
        updateDescription("Memproses penghapusan tweet dan balasan...");
        runDeleteProcess("tweet");
      }
    };
  
    const handleSemua = () => {
      removeUsernameForm();
      if (!isUserProfilePage() || !location.pathname.includes("/with_replies")) {
        promptUsernameAndRedirect("/with_replies");
      } else {
        updateDescription("Memproses penghapusan semua jenis tweet...");
        runDeleteProcess("all");
      }
    };
  
    const handleCancel = () => {
      if (!isRunning) {
        updateStatus("❗ Tidak ada proses yang terjadi.");
        setTimeout(() => {
          updateStatus("");
        }, 2000);
        return;
      }
      isCancelled = true;
      updateStatus("⏹️ Membatalkan proses...");
      updateDescription("Sedang membatalkan proses...");
    };
  
    const handleTutup = () => {
      isCancelled = true;
      isRunning = false;
      updateStatus("🛑 Program dihentikan.");
      updateDescription("Panel bot ditutup.");
      setTimeout(() => {
        container.remove();
      }, 1000);
    };
  
    // ======================
    // INITIALIZE UI
    // ======================
    btnGroup1.appendChild(
      createButton(
        "Retweet Only", 
        handleRetweetOnly, 
        "#22c55e",
        "Hapus hanya retweet. Jika tidak di halaman profil, akan minta username"
      )
    );
    
    btnGroup1.appendChild(
      createButton(
        "Tweet + Reply", 
        handleTweetAndReply, 
        "#3b82f6",
        "Hapus tweet original dan balasan. Akan redirect ke halaman with_replies jika diperlukan"
      )
    );
    
    btnGroup2.appendChild(
      createButton(
        "Semua", 
        handleSemua, 
        "#8b5cf6",
        "Hapus semua jenis tweet (retweet, original, dan balasan)"
      )
    );
    
    btnGroup2.appendChild(
      createButton(
        "Batal", 
        handleCancel, 
        "#facc15",
        "Menghentikan proses penghapusan yang sedang berjalan"
      )
    );
    
    btnGroup2.appendChild(
      createButton(
        "Tutup", 
        handleTutup, 
        "#374151",
        "Menutup panel bot ini"
      )
    );
  
    container.appendChild(descriptionArea);
    container.appendChild(btnGroup1);
    container.appendChild(btnGroup2);
    container.appendChild(logContainer);
    document.body.appendChild(container);
  
    // Initial status
    updateStatus("✅ Bot siap digunakan. Pilih opsi penghapusan:");
    updateDescription("Pilih jenis konten yang ingin dibersihkan. Form username akan muncul jika diperlukan.");
  })();