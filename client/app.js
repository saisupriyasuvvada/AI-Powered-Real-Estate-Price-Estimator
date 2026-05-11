class PricePredictor {
  constructor() {
    this.initializeElements();
    this.attachEventListeners();
    this.loadLocations();
  }

  initializeElements() {
    this.estimateBtn = document.getElementById("estimateBtn");
    this.sqftInput = document.getElementById("uiSqft");
    this.locationSelect = document.getElementById("uiLocations");
    this.estimatedPrice = document.getElementById("uiEstimatedPrice");
  }

  attachEventListeners() {
    this.estimateBtn.addEventListener("click", () => this.estimatePrice());
  }

  async loadLocations() {
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/get_location_names"
      );
      const data = await response.json();

      if (data?.locations) {
        this.populateLocations(data.locations);
      }
    } catch (error) {
      console.error("Error loading locations:", error);
    }
  }

  populateLocations(locations) {
    this.locationSelect.innerHTML = `
            <option value="" disabled selected>Choose a Location</option>
            ${locations
              .map(
                (location) => `<option value="${location}">${location}</option>`
              )
              .join("")}
        `;
  }

  getBHKValue() {
    return document.querySelector('input[name="uiBHK"]:checked')?.value || "2";
  }

  getBathValue() {
    return (
      document.querySelector('input[name="uiBathrooms"]:checked')?.value || "2"
    );
  }

  async estimatePrice() {
    try {
      this.estimateBtn.disabled = true;
      this.estimateBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Estimating...';

      const requestData = {
        total_sqft: parseFloat(this.sqftInput.value),
        bhk: parseInt(this.getBHKValue()),
        bath: parseInt(this.getBathValue()),
        location: this.locationSelect.value,
      };

      const response = await fetch(
        "http://127.0.0.1:5000/api/predict_home_price",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      const data = await response.json();
      this.displayResult(data.estimated_price);
    } catch (error) {
      console.error("Error estimating price:", error);
      this.displayError();
    } finally {
      this.estimateBtn.disabled = false;
      this.estimateBtn.innerHTML =
        '<span>Estimate Price</span><i class="fas fa-calculator"></i>';
    }
  }

  displayResult(price) {
    this.estimatedPrice.querySelector(
      ".result-value"
    ).textContent = `${price} Lakh`;
    this.estimatedPrice.classList.remove("hidden");
    this.estimatedPrice.classList.add("show");
  }

  displayError() {
    this.estimatedPrice.querySelector(".result-value").textContent =
      "Error occurred";
    this.estimatedPrice.classList.remove("hidden");
    this.estimatedPrice.classList.add("show");
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PricePredictor();
});

// Smooth Scroll and Section Animation Handler
class ScrollHandler {
  constructor() {
    this.sections = document.querySelectorAll("section");
    this.navLinks = document.querySelectorAll(".nav-links a");

    this.init();
  }

  init() {
    // Add smooth scroll behavior to nav links
    this.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();

        const targetId = link.getAttribute("href");
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
          // Remove active class from all links
          this.navLinks.forEach((link) => link.classList.remove("active"));

          // Add active class to clicked link
          link.classList.add("active");

          // Smooth scroll to section
          targetSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });
    });

    // Add scroll animation to sections
    this.sections.forEach((section) => {
      section.classList.add("section-animate");
    });

    // Initial check for visible sections
    this.checkVisibleSections();

    // Listen for scroll events
    window.addEventListener("scroll", () => {
      this.checkVisibleSections();
      this.updateActiveNavLink();
    });
  }

  checkVisibleSections() {
    const triggerBottom = window.innerHeight * 0.8;

    this.sections.forEach((section) => {
      const sectionTop = section.getBoundingClientRect().top;

      if (sectionTop < triggerBottom) {
        section.classList.add("active");
      }
    });
  }

  updateActiveNavLink() {
    const fromTop = window.scrollY + 100; // Offset for header

    this.sections.forEach((section) => {
      const id = section.getAttribute("id");
      const link = document.querySelector(`.nav-links a[href="#${id}"]`);

      if (link) {
        if (
          section.offsetTop <= fromTop &&
          section.offsetTop + section.offsetHeight > fromTop
        ) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      }
    });
  }
}

// Initialize ScrollHandler when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ScrollHandler();
});

// Add scroll-to-top functionality
const addScrollToTop = () => {
  const scrollBtn = document.createElement("button");
  scrollBtn.classList.add("scroll-to-top");
  scrollBtn.innerHTML = "↑";
  document.body.appendChild(scrollBtn);

  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 300) {
      scrollBtn.classList.add("show");
    } else {
      scrollBtn.classList.remove("show");
    }
  });

  scrollBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
};

// Add scroll-to-top button
addScrollToTop();

class FormValidator {
  constructor(formId) {
    this.form = document.getElementById(formId);
    this.submitButton = this.form.querySelector('button[type="submit"]');
    this.setDefaultValues(); // Set default values on initialization
    this.init();
  }

  setDefaultValues() {
    // Set default BHK value (2)
    const defaultBHK = this.form.querySelector(
      'input[name="uiBHK"][value="2"]'
    );
    if (defaultBHK) defaultBHK.checked = true;

    // Set default Bathroom value (2)
    const defaultBath = this.form.querySelector(
      'input[name="uiBathrooms"][value="2"]'
    );
    if (defaultBath) defaultBath.checked = true;

    // Set default Area value (1000)
    const areaInput = this.form.querySelector("#uiSqft");
    if (areaInput) areaInput.value = "1000";
  }

  init() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.validateAndSubmit();
    });

    // Real-time validation for inputs
    this.form
      .querySelectorAll('input[type="number"], select')
      .forEach((input) => {
        input.addEventListener("input", () => {
          this.validateField(input);
        });
      });
  }

  validateAndSubmit() {
    let isValid = true;
    const errorMessages = [];

    // Validate Square Feet
    const sqft = this.form.querySelector("#uiSqft");
    const sqftValue = parseFloat(sqft.value);
    if (!sqftValue || sqftValue < 100) {
      isValid = false;
      this.showError(sqft, "Please enter a valid area (minimum 100 sq ft)");
      errorMessages.push("Area is required (minimum 100 sq ft)");
    }

    // Validate Location
    const location = this.form.querySelector("#uiLocations");
    if (!location.value || location.value === "") {
      isValid = false;
      this.showError(location, "Please select a location");
      errorMessages.push("Location is required");
    }

    if (!isValid) {
      // Show error animation
      this.submitButton.classList.add("error-shake");
      setTimeout(() => {
        this.submitButton.classList.remove("error-shake");
      }, 500);

      // Show error messages
      this.displayValidationErrors(errorMessages);
      return;
    }

    // If validation passes, submit the form
    this.submitForm();
  }

  displayValidationErrors(errors) {
    // Create or update validation messages container
    let messageContainer = document.getElementById("validation-messages");
    if (!messageContainer) {
      messageContainer = document.createElement("div");
      messageContainer.id = "validation-messages";
      messageContainer.className = "validation-messages";
      this.form.insertBefore(messageContainer, this.submitButton);
    }

    messageContainer.innerHTML = errors
      .map(
        (error) =>
          `<div class="validation-error"><i class="fas fa-exclamation-circle"></i> ${error}</div>`
      )
      .join("");

    // Automatically hide messages after 5 seconds
    setTimeout(() => {
      messageContainer.innerHTML = "";
    }, 5000);
  }

  validateField(field) {
    field.classList.remove("error", "valid");
    const errorDiv = field.parentElement.querySelector(".error-message");
    if (errorDiv) errorDiv.style.display = "none";

    if (field.id === "uiSqft") {
      const value = parseFloat(field.value);
      if (!value || value < 100) {
        this.showError(field, "Please enter a valid area (minimum 100 sq ft)");
        return false;
      }
    }

    if (field.id === "uiLocations" && (!field.value || field.value === "")) {
      this.showError(field, "Please select a location");
      return false;
    }

    field.classList.add("valid");
    return true;
  }

  showError(field, message) {
    field.classList.add("error");
    field.classList.remove("valid");

    let errorDiv = field.parentElement.querySelector(".error-message");
    if (!errorDiv) {
      errorDiv = document.createElement("div");
      errorDiv.className = "error-message";
      field.parentElement.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
  }

  async submitForm() {
    try {
      this.submitButton.disabled = true;
      this.submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Estimating...';

      const formData = {
        total_sqft: parseFloat(this.form.querySelector("#uiSqft").value),
        bhk: parseInt(
          this.form.querySelector('input[name="uiBHK"]:checked').value
        ),
        bath: parseInt(
          this.form.querySelector('input[name="uiBathrooms"]:checked').value
        ),
        location: this.form.querySelector("#uiLocations").value,
      };

      const response = await fetch("http://127.0.0.1:5000/api/predict_home_price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      this.displayResult(data.estimated_price);
    } catch (error) {
      console.error("Error:", error);
      this.displayError("An error occurred while estimating the price");
    } finally {
      this.submitButton.disabled = false;
      this.submitButton.innerHTML =
        '<span>Get Price Estimate</span><i class="fas fa-calculator"></i>';
    }
  }

  displayResult(price) {
    const resultDiv = document.getElementById("uiEstimatedPrice");
    resultDiv.querySelector(".result-value").textContent = `${price} Lakh`;
    resultDiv.classList.remove("hidden");
    resultDiv.classList.add("show");
  }

  displayError(message) {
    const resultDiv = document.getElementById("uiEstimatedPrice");
    resultDiv.querySelector(".result-value").textContent = message;
    resultDiv.classList.remove("hidden");
    resultDiv.classList.add("show", "error");
  }
}

// Initialize the form validator when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new FormValidator("predictForm");
});


// ================= CHATBOT CODE =================

// Toggle chatbot
function toggleChatbot() {
  var chatbot = document.getElementById("chatbot");
  if (chatbot.style.display === "none" || chatbot.style.display === "") {
    chatbot.style.display = "block";
  } else {
    chatbot.style.display = "none";
  }
}

// Send message
function sendMessage() {
  var input = document.getElementById("chatbot-input");
  var message = input.value;
  var chatBody = document.getElementById("chatbot-body");

  if (message.trim() === "") return;

  // Show user message
  chatBody.innerHTML += `<div class="user-msg">${message}</div>`;

  // Show loading
  chatBody.innerHTML += `<div class="bot-msg" id="loading">Typing...</div>`;
  chatBody.scrollTop = chatBody.scrollHeight;

  fetch("http://127.0.0.1:5000/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: message }),
  })
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("loading").remove();
      chatBody.innerHTML += `<div class="bot-msg">${data.reply}</div>`;
      chatBody.scrollTop = chatBody.scrollHeight;
    })
    .catch((error) => {
      document.getElementById("loading").remove();
      chatBody.innerHTML += `<div class="bot-msg">Error: Server not responding</div>`;
      console.error("Error:", error);
    });

  input.value = "";
}

// ENTER key to send message
document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("chatbot-input");
  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
});

// Close chatbot on scroll
window.addEventListener("scroll", function () {
  var chatbot = document.getElementById("chatbot");
  chatbot.style.display = "none";
});

