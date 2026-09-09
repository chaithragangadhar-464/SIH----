/**
 * login.js — handles the login form on login.html
 */

document.addEventListener("DOMContentLoaded", () => {
  // If already logged in, skip straight to the dashboard.
  if (isLoggedIn()) {
    window.location.href = "dashboard.html";
    return;
  }

  const form = document.getElementById("login-form");
  const errorBox = document.getElementById("login-error");
  const submitBtn = document.getElementById("login-submit");

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.add("auth-alert--visible");
  }

  function clearError() {
    errorBox.textContent = "";
    errorBox.classList.remove("auth-alert--visible");
  }

  function setFieldInvalid(fieldId, isInvalid) {
    document.getElementById(fieldId).classList.toggle("field--invalid", isInvalid);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    let valid = true;
    if (!email || !email.includes("@")) {
      setFieldInvalid("field-email", true);
      valid = false;
    } else {
      setFieldInvalid("field-email", false);
    }
    if (!password) {
      setFieldInvalid("field-password", true);
      valid = false;
    } else {
      setFieldInvalid("field-password", false);
    }
    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";

    try {
      const response = await loginUser({ email, password });
      const token = response.token;
      const user = response.user;

      if (!token) {
        throw new Error("Login succeeded but no session token was returned.");
      }

      setToken(token);
      if (user) cacheUser(user);

      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      window.location.href = redirect ? decodeURIComponent(redirect) : "dashboard.html";
    } catch (error) {
      showError(error.message || "Unable to log in. Please check your credentials and try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Log in";
    }
  });
});