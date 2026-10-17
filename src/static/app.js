document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const signupContainer = document.getElementById("signup-container");
  const messageDiv = document.getElementById("message");
  const staffLoginButton = document.getElementById("staff-login-button");
  const staffLoginForm = document.getElementById("staff-login-form");
  const staffLogoutButton = document.getElementById("staff-logout-button");
  let staffAuthenticated = false;
  let messageTimeout;

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[character];
    });
  }

  function setStaffAuthenticated(authenticated) {
    staffAuthenticated = authenticated;
    staffLoginButton.classList.toggle("hidden", authenticated);
    staffLoginForm.classList.toggle("hidden", authenticated);
    staffLogoutButton.classList.toggle("hidden", !authenticated);
    signupContainer.classList.toggle("hidden", !authenticated);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.replaceChildren(activitySelect.options[0]);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) => `<li>
                      <span class="participant-email">${escapeHTML(email)}</span>
                      ${
                        staffAuthenticated
                          ? `<button class="delete-btn" data-activity="${escapeHTML(name)}" data-email="${escapeHTML(email)}">Remove</button>`
                          : ""
                      }
                    </li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${escapeHTML(name)}</h4>
          <p>${escapeHTML(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHTML(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function checkStaffSession() {
    try {
    const response = await fetch("/staff/session");
    const result = await response.json();
    setStaffAuthenticated(response.ok && result.authenticated);
    } catch (error) {
    setStaffAuthenticated(false);
    showMessage("Could not check staff login. Please refresh the page.", "error");
    console.error("Error checking staff session:", error);
    }
  }

  staffLoginButton.addEventListener("click", () => {
    staffLoginButton.classList.add("hidden");
    staffLoginForm.classList.remove("hidden");
    document.getElementById("staff-username").focus();
  });

  staffLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("staff-username").value;
    const password = document.getElementById("staff-password").value;

    try {
    const response = await fetch("/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const result = await response.json();

    if (!response.ok) {
      showMessage(result.detail || "Staff login failed.", "error");
      return;
    }

    staffLoginForm.reset();
    setStaffAuthenticated(true);
    showMessage(result.message, "success");
    fetchActivities();
    } catch (error) {
    showMessage("Failed to log in. Please try again.", "error");
    console.error("Error logging in:", error);
    }
  });

  staffLogoutButton.addEventListener("click", async () => {
    try {
    const response = await fetch("/staff/logout", { method: "POST" });
    const result = await response.json();
    if (!response.ok) {
      showMessage(result.detail || "Staff logout failed.", "error");
      return;
    }

    setStaffAuthenticated(false);
    staffLoginForm.reset();
    showMessage(result.message, "success");
    fetchActivities();
    } catch (error) {
    showMessage("Failed to log out. Please try again.", "error");
    console.error("Error logging out:", error);
    }
  });

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  checkStaffSession().then(fetchActivities);
});
