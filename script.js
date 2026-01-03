  // Supabase
      const supabaseUrl = "https://cgeescjioqfmjfgdtlnm.supabase.co";
      const supabaseKey = "sb_publishable_D-zcmoLO_lgpHCGFqxlgrg_xrI9J6T_";
      const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

      // UI refs
      const authSection = document.getElementById("auth");
      const app = document.getElementById("app");
      const loginForm = document.getElementById("loginForm");
      const signupBtn = document.getElementById("signupBtn");
      const logoutBtn = document.getElementById("logoutBtn");
      const authMsg = document.getElementById("authMsg");
      const paymentsTrack = document.getElementById("paymentsTrack");
      const todayDate = document.getElementById("todayDate");

      function setMsg(t) {
        if (authMsg) authMsg.textContent = t || "";
      }

      function setTodayDate() {
        if (!todayDate) return;
        const formatter = new Intl.DateTimeFormat("nl-NL", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        });
        todayDate.textContent = formatter.format(new Date());
      }

      function daysUntil(day) {
        const now = new Date();
        const today = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        if (day >= today) return day - today;
        return (daysInMonth - today) + day;
      }

      function formatDueText(days) {
        if (days === 0) return "vandaag";
        if (days === 1) return "betaling over 1 dag";
        return `betaling over ${days} dagen`;
      }

      function sortPayments() {
        if (!paymentsTrack) return;
        const items = Array.from(paymentsTrack.querySelectorAll(".payment-card[data-day]"));
        items.sort((a, b) => {
          const dayA = parseInt(a.getAttribute("data-day"), 10);
          const dayB = parseInt(b.getAttribute("data-day"), 10);
          return daysUntil(dayA) - daysUntil(dayB);
        });
        items.forEach((item) => {
          const day = parseInt(item.getAttribute("data-day"), 10);
          const daysLeft = daysUntil(day);
          const whenEl = item.querySelector(".when");
          if (whenEl) whenEl.textContent = formatDueText(daysLeft);
          paymentsTrack.appendChild(item);
        });
      }

      async function refreshUI(sessionOverride) {
        let session = sessionOverride;
        if (sessionOverride === undefined) {
          const { data, error } = await supabaseClient.auth.getSession();
          if (error) setMsg("Session error: " + error.message);
          session = data?.session || null;
        }

        const loggedIn = !!session;

        if (app) app.style.display = loggedIn ? "" : "none";
        if (authSection) authSection.style.display = loggedIn ? "none" : "";
        if (logoutBtn) logoutBtn.style.display = loggedIn ? "" : "none";
        if (signupBtn) signupBtn.style.display = loggedIn ? "none" : "";

        document.body.classList.toggle("auth-only", !loggedIn);
        setMsg(loggedIn ? "Je bent ingelogd." : "");
      }

      // Login
      loginForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        setMsg("Bezig met inloggen...");

        const email = document.getElementById("email")?.value?.trim();
        const password = document.getElementById("password")?.value;

        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) return setMsg("Inloggen mislukt: " + error.message);

        setMsg("Ingelogd.");
        await refreshUI(data?.session || null);
      });

      // Signup
      signupBtn?.addEventListener("click", async () => {
        setMsg("Account aanmaken...");

        const email = document.getElementById("email")?.value?.trim();
        const password = document.getElementById("password")?.value;

        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) return setMsg("Account maken mislukt: " + error.message);

        setMsg("Account gemaakt. Probeer nu in te loggen.");
        await refreshUI(data?.session || null);
      });

      // Logout
      logoutBtn?.addEventListener("click", async () => {
        await supabaseClient.auth.signOut({ scope: "local" });
        localStorage.removeItem("sb-cgeescjioqfmjfgdtlnm-auth-token");
        setMsg("Uitgelogd.");
        await refreshUI(null);
      });

      supabaseClient.auth.onAuthStateChange((_event, session) => refreshUI(session));
      sortPayments();
      setTodayDate();
      refreshUI();