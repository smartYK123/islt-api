const express = require("express");
const router = express.Router();
const axios = require("axios");

const User = require("../models/user");

const CLIENT_ID = "com.kingschat";
const REDIRECT_URI = "https://api.islt.org/kc_callback/kc-callback";
const SCOPES = encodeURIComponent(JSON.stringify(["conference_calls"]));

/* Store redirect temporarily */
let mobileRedirectURL = null;
//token
/* ======================================== START LOGIN ======================================== */
router.get("/kc-login", (req, res) => {
  console.log("=== [KC] Login initiation requested ===");
  mobileRedirectURL = req.query.redirect;
  console.log("Mobile redirect saved:", mobileRedirectURL);

  const authUrl = `https://accounts.kingsch.at/?client_id=${CLIENT_ID}&scopes=${SCOPES}&post_redirect=true&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  console.log("Redirecting to KingsChat:", authUrl);
  res.redirect(authUrl);
});

/* ======================================== KINGSCHAT CALLBACK ======================================== */
router.all("/kc-callback", async (req, res) => {
  console.log("=== KingsChat Callback ===");
  console.log("Query:", req.query);
  console.log("Body:", req.body);

  let accessToken = null;
  let refreshToken = null;

  if (!mobileRedirectURL) {
    return res.send("Login succeeded but redirect URL missing");
  }

  /* TOKEN EXTRACTION */
  if (req.body.accessToken) {
    accessToken = req.body.accessToken;
    refreshToken = req.body.refreshToken || null;
  } else if (req.query.access_token) {
    accessToken = req.query.access_token;
    refreshToken = req.query.refresh_token || null;
  }

  /* FRAGMENT TOKEN HANDLER (client-side redirect in case of #fragment) */
  if (!accessToken) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <body>
        <script>
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const token = params.get("access_token");
          const refresh = params.get("refresh_token");

          const payload = { status: "success", accessToken: token, refreshToken: refresh };
          const encoded = encodeURIComponent(JSON.stringify(payload));

          window.location = "${mobileRedirectURL}?kc=" + encoded;
        </script>
      </body>
      </html>
    `);
  }

  try {
    /* FETCH PROFILE */
    const profileRes = await axios.get("https://connect.kingsch.at/api/profile", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    const profile = profileRes.data?.profile;

    const userData = {
      kc_id: profile.user.user_id || "",
      username: profile.user.username || "",
      name: profile.user.name || "",
      phone: profile.phone_number || "",
      email: profile.email?.address || "",
      image: profile.user.avatar_url || "",
      kc_token: Math.random().toString(36).slice(2) + Date.now(),
    };

    const user = await User.findOneAndUpdate(
      { username: userData.username },
      { $set: userData },
      { upsert: true, new: true }
    );

    /* PAYLOAD BACK TO APP */
    const payload = {
      status: "success",
      data: {
        _id: user._id.toString(), // 🔥 ADD THIS
        kc_id: user.kc_id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        email: user.email,
        image: user.image,
        kc_token: user.kc_token,
      },
      refreshToken: refreshToken || null,
    };

    const encodedPayload = encodeURIComponent(JSON.stringify(payload));
    const deepLink = `${mobileRedirectURL}?provider=kingschat&kc=${encodedPayload}`;
  console.log("payload:", payload);
    console.log("Redirecting back to app:", deepLink);

    // Clean up
    mobileRedirectURL = null;

    res.redirect(deepLink);
  } catch (err) {
    console.error("Profile error:", err.message);
    res.redirect(`${mobileRedirectURL}?error=profile_failed`);
  }
});

module.exports = router;