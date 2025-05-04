document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const searchBtn = document.getElementById("search-btn");
  const searchInput = document.getElementById("search-input");
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileShopBtn = document.getElementById("mobile-shop-btn");
  const mobileCategories = document.getElementById("mobile-categories");
  const cartBtn = document.getElementById("cart-btn");
  const cartSidebar = document.getElementById("cart-sidebar");
  const closeCartBtn = document.getElementById("close-cart");
  const contactForm = document.getElementById("contact-form");
  const newsletterForm = document.getElementById("newsletter-form");
  const productsContainer = document.getElementById("featured-products"); // Main product display area
  const mainContentArea = document.querySelector("body > section:not(#contact):not(.bg-gray-900)"); // Heuristic to find main content area
  const heroSection = document.querySelector(".relative.bg-black.text-white"); // Hero section
  const heroShopNowBtn = document.getElementById("hero-shop-now-btn");
  const mpesaCheckoutBtn = document.getElementById("mpesa-checkout-btn");
  const mpesaPhoneInput = document.getElementById("mpesa-phone");
  const mpesaResponseEl = document.getElementById("mpesa-response");

  // --- State ---
  let searchTimeout = null;
  let cart = []; // Simple in-memory cart

  // --- Event Listeners ---

  // Toggle search input visibility
  searchBtn?.addEventListener("click", () => {
    if (searchInput.classList.contains("hidden")) {
      searchInput.classList.remove("hidden");
      searchInput.focus();
    } else {
      if (searchInput.value.trim() !== "") {
        performSearch(searchInput.value.trim());
      }
    }
  });

  // Live search on input (with debounce)
  searchInput?.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    const query = searchInput.value.trim();
    if (query.length > 1) {
      searchTimeout = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else if (query.length === 0) {
        showHomePage();
    }
  });
  
  // Search on pressing Enter
  searchInput?.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
          event.preventDefault();
          clearTimeout(searchTimeout);
          const query = searchInput.value.trim();
          if (query) {
              performSearch(query);
          }
      }
  });

  // Mobile menu toggle
  mobileMenuBtn?.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });

  // Mobile shop categories toggle
  mobileShopBtn?.addEventListener("click", () => {
    mobileCategories.classList.toggle("hidden");
  });

  // Cart sidebar toggle
  cartBtn?.addEventListener("click", () => {
    cartSidebar.classList.remove("cart-closed");
    cartSidebar.classList.add("cart-open");
  });

  closeCartBtn?.addEventListener("click", () => {
    cartSidebar.classList.remove("cart-open");
    cartSidebar.classList.add("cart-closed");
  });

  // Contact form submission
  if (contactForm) {
    contactForm.addEventListener("submit", handleContactFormSubmit);
  }

  // Newsletter subscription
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", handleNewsletterSubmit);
  }

  // Add listener for hero Shop Now button
  heroShopNowBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    cartSidebar.classList.remove("cart-closed");
    cartSidebar.classList.add("cart-open");
  });

  // M-Pesa Checkout Button
  mpesaCheckoutBtn?.addEventListener("click", handleMpesaCheckout);

  // --- Navigation Handling ---
  function handleNavigation(event) {
    const link = event.target.closest("a[href^=\"/\"], a[href^=\"#\"]");
    if (!link) return;

    const href = link.getAttribute("href");

    if (link.closest(".group-hover\:block") || link.closest("#mobile-categories")) {
        if (href.startsWith("/shop/")) {
            event.preventDefault();
            const category = href.split("/shop/")[1];
            loadProductsByCategory(category);
            mobileMenu?.classList.add("hidden");
            return;
        }
    }
    
    if (href === "/" || href === "/shop" || href === "/collections" || href === "/shop/all" || href === "/shop/new") {
      event.preventDefault();
      showHomePage();
    } else if (href.startsWith("/shop/") && !link.closest(".group-hover\:block") && !link.closest("#mobile-categories")) {
      event.preventDefault();
      const category = href.split("/shop/")[1];
      loadProductsByCategory(category);
    } else if (href === "/about") {
      event.preventDefault();
      showAboutPage();
    } else if (href === "#contact") {
      return;
    } else if (href === "#") {
        event.preventDefault();
    }
    
    mobileMenu?.classList.add("hidden");
  }

  document.querySelector("header nav")?.addEventListener("click", handleNavigation);
  document.getElementById("mobile-menu")?.addEventListener("click", handleNavigation);
  document.querySelector("header a[href=\"/\"]")?.addEventListener("click", handleNavigation);

  // --- Content Loading Functions ---

  function showHomePage() {
    console.log("Navigating to Home");
    hideAllSections();
    heroSection?.classList.remove("hidden");
    productsContainer?.parentElement.classList.remove("hidden");
    document.getElementById("contact")?.classList.remove("hidden");
    document.querySelector(".bg-gray-900")?.classList.remove("hidden");
    document.querySelector(".py-16.bg-gray-50")?.classList.remove("hidden");
    loadAllProducts();
    updatePageTitle("Nova Wear - Contemporary Clothing");
  }

  async function loadProductsByCategory(category) {
    console.log(`Loading category: ${category}`);
    hideAllSections();
    productsContainer?.parentElement.classList.remove("hidden");
    const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
    productsContainer.innerHTML = 
      `<h2 class="text-3xl font-bold mb-12 text-center col-span-full">${categoryTitle}</h2>` + 
      `<div class="animate-pulse bg-gray-200 rounded-lg h-80 col-span-full md:col-span-2 lg:col-span-4"></div>`;

    try {
      const response = await fetch(`/api/products?category=${encodeURIComponent(category)}`);
      if (!response.ok) throw new Error(`Failed to fetch ${category} products`);
      const products = await response.json();
      productsContainer.innerHTML = 
        `<h2 class="text-3xl font-bold mb-12 text-center col-span-full">${categoryTitle}</h2>`;
      displayProducts(products);
      updatePageTitle(`Shop ${categoryTitle} - Nova Wear`);
    } catch (error) {
      console.error(`Error loading ${category} products:`, error);
      productsContainer.innerHTML = 
        `<h2 class="text-3xl font-bold mb-12 text-center col-span-full">${categoryTitle}</h2>` +
        `<p class="text-red-600 text-center col-span-full">Error loading products: ${error.message}.</p>`;
    }
  }

  function showAboutPage() {
    console.log("Navigating to About");
    hideAllSections();
    let aboutSection = document.getElementById("about-section-content");
    if (!aboutSection) {
        aboutSection = document.createElement("section");
        aboutSection.id = "about-section-content";
        aboutSection.className = "py-16 bg-white";
        document.querySelector("header").insertAdjacentElement("afterend", aboutSection);
    }
    aboutSection.innerHTML = `
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold mb-6 text-center">About Nova Wear</h2>
        <p class="text-lg text-gray-700 text-center max-w-3xl mx-auto">Nova Wear is dedicated to providing contemporary clothing for modern lifestyles. We believe in quality, style, and sustainability. (Placeholder content).</p>
      </div>`;
    aboutSection.classList.remove("hidden");
    updatePageTitle("About Us - Nova Wear");
  }
  
  function hideAllSections() {
      heroSection?.classList.add("hidden");
      productsContainer?.parentElement.classList.add("hidden");
      document.getElementById("contact")?.classList.add("hidden");
      document.querySelector(".bg-gray-900")?.classList.add("hidden");
      document.querySelector(".py-16.bg-gray-50")?.classList.add("hidden");
      document.getElementById("about-section-content")?.classList.add("hidden");
  }
  
  function updatePageTitle(title) {
      document.title = title;
  }

  async function loadAllProducts() {
    console.log("Loading all products for home page");
    productsContainer.innerHTML = 
      `<h2 class="text-3xl font-bold mb-12 text-center col-span-full">All Products</h2>` + 
      `<div class="animate-pulse bg-gray-200 rounded-lg h-80 col-span-full md:col-span-2 lg:col-span-4"></div>`;
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const products = await response.json();
      productsContainer.innerHTML = 
        `<h2 class="text-3xl font-bold mb-12 text-center col-span-full">All Products</h2>`;
      displayProducts(products);
    } catch (error) {
      console.error("Error loading products:", error);
      if (productsContainer) {
        productsContainer.innerHTML = 
          `<h2 class="text-3xl font-bold mb-12 text-center col-span-full">All Products</h2>` +
          `<p class="text-red-600 text-center col-span-full">Error loading products: ${error.message}.</p>`;
      }
    }
  }

  function displayProducts(products) {
    if (!productsContainer) return;
    const existingCards = productsContainer.querySelectorAll(".product-card, .animate-pulse, .text-gray-500, .text-red-600");
    existingCards.forEach(card => card.remove());

    if (products.length === 0) {
        const noProductsMsg = document.createElement("p");
        noProductsMsg.className = "text-gray-500 text-center col-span-full";
        noProductsMsg.textContent = "No products found.";
        productsContainer.appendChild(noProductsMsg);
        return;
    }

    products.forEach(product => {
      const productCard = document.createElement("div");
      productCard.className = 
        "product-card bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow duration-300";
      productCard.innerHTML = `
        <div class="relative overflow-hidden h-48 md:h-64">
          <img src="${product.image}" alt="${product.name}" class="product-image w-full h-full object-cover">
          <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white px-3 py-2">
            <span class="text-sm">${product.category}</span>
          </div>
        </div>
        <div class="p-4">
          <h3 class="font-medium text-lg">${product.name}</h3>
          <div class="flex justify-between items-center mt-2">
            <span class="text-gray-900 font-bold">KES ${product.price.toFixed(2)}</span>
            <button class="add-to-cart bg-black text-white px-3 py-1 rounded-md text-sm hover:bg-gray-800" data-id="${product._id}">
              Add to Cart
            </button>
          </div>
        </div>
      `;
      productsContainer.appendChild(productCard);
      const addToCartBtn = productCard.querySelector(".add-to-cart");
      addToCartBtn.addEventListener("click", () => {
        addToCart({ ...product, id: product._id }); 
      });
    });
  }

  // --- Search Functionality ---
  async function performSearch(query) {
    console.log(`Searching for: ${query}`);
    hideAllSections();
    productsContainer?.parentElement.classList.remove("hidden");
    productsContainer.innerHTML = 
        `<h2 class="text-3xl font-bold mb-12 text-center col-span-full">Search Results for "${query}"</h2>` +
        `<div class="animate-pulse bg-gray-200 rounded-lg h-80 col-span-full md:col-span-2 lg:col-span-4"></div>`;
    updatePageTitle(`Search Results for "${query}" - Nova Wear`);

    try {
        const response = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error("Search request failed");
        const products = await response.json();
        productsContainer.innerHTML = 
            `<h2 class="text-3xl font-bold mb-12 text-center col-span-full">Search Results for "${query}"</h2>`;
        displayProducts(products);
    } catch (error) {
        console.error("Error performing search:", error);
        productsContainer.innerHTML = 
            `<h2 class="text-3xl font-bold mb-12 text-center col-span-full">Search Results for "${query}"</h2>` +
            `<p class="text-red-600 text-center col-span-full">Error loading search results: ${error.message}.</p>`;
    }
  }

  // --- Cart Functionality ---

  function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    updateCartUI();
    cartSidebar.classList.remove("cart-closed");
    cartSidebar.classList.add("cart-open");
  }

  function updateCartUI() {
    const cartItemsContainer = document.getElementById("cart-items");
    const cartCount = document.getElementById("cart-count");
    const cartSubtotal = document.getElementById("cart-subtotal");

    cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = 
        '<p class="text-gray-500 text-center py-6">Your cart is empty</p>';
    } else {
      cartItemsContainer.innerHTML = cart.map(item => `
        <div class="flex items-center py-4 border-b">
          <div class="w-16 h-16 flex-shrink-0 mr-4">
            <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover rounded">
          </div>
          <div class="flex-grow">
            <h4 class="font-medium">${item.name}</h4>
            <div class="flex justify-between mt-1">
              <div class="flex items-center">
                <button class="cart-qty-btn text-sm px-2 py-0.5 border rounded" data-id="${item.id}" data-action="decrease">-</button>
                <span class="mx-2">${item.quantity}</span>
                <button class="cart-qty-btn text-sm px-2 py-0.5 border rounded" data-id="${item.id}" data-action="increase">+</button>
              </div>
              <span>KES ${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          </div>
          <button class="remove-from-cart ml-4 text-gray-400 hover:text-red-500" data-id="${item.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `).join("");

      cartItemsContainer.querySelectorAll(".remove-from-cart").forEach(button => {
        button.addEventListener("click", () => {
          const productId = button.getAttribute("data-id"); 
          removeFromCart(productId);
        });
      });

      cartItemsContainer.querySelectorAll(".cart-qty-btn").forEach(button => {
        button.addEventListener("click", () => {
          const productId = button.getAttribute("data-id");
          const action = button.getAttribute("data-action");
          updateCartItemQuantity(productId, action);
        });
      });
    }

    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    cartSubtotal.textContent = `KES ${subtotal.toFixed(2)}`;
  }

  function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
  }

  function updateCartItemQuantity(productId, action) {
    const item = cart.find(item => item.id === productId);
    if (item) {
      if (action === "increase") {
        item.quantity += 1;
      } else if (action === "decrease") {
        item.quantity -= 1;
        if (item.quantity <= 0) {
          removeFromCart(productId);
          return;
        }
      }
      updateCartUI();
    }
  }

  function clearCart() {
      cart = [];
      updateCartUI();
  }

  // --- M-Pesa Checkout Handler ---
  async function handleMpesaCheckout() {
    const phone = mpesaPhoneInput.value.trim();
    const amount = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    // Basic validation
    if (cart.length === 0) {
        showMpesaResponse("Your cart is empty.", "error");
        return;
    }
    if (!phone) {
        showMpesaResponse("Please enter your M-Pesa phone number.", "error");
        return;
    }
    // Basic phone format check (doesn't guarantee validity)
    if (!/^(\+?254|0)?\d{9}$/.test(phone.replace(/\s+/g, ""))) {
        showMpesaResponse("Invalid phone number format.", "error");
        return;
    }
    if (amount < 1) {
        showMpesaResponse("Invalid cart amount.", "error");
        return;
    }

    mpesaCheckoutBtn.disabled = true;
    mpesaCheckoutBtn.innerHTML = 
      `<svg class="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...`;
    showMpesaResponse("Initiating payment...", "info");

    try {
      const response = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, amount }),
      });
      const data = await response.json();

      if (response.ok) {
        // STK Push initiated successfully by backend
        showMpesaResponse("Check your phone and enter your M-Pesa PIN.", "info");
        
        // --- SIMULATED SUCCESS --- 
        // In a real app, wait for backend confirmation via WebSocket or polling
        console.log("Simulating payment success after 15 seconds...");
        setTimeout(() => {
            console.log("Simulated success received!");
            showMpesaResponse("Payment Successful! Thank you.", "success");
            clearCart(); // Clear the cart on simulated success
            // Optionally close the cart sidebar after a further delay
            // setTimeout(() => {
            //     cartSidebar.classList.remove("cart-open");
            //     cartSidebar.classList.add("cart-closed");
            // }, 3000);
        }, 15000); // Simulate after 15 seconds
        // --- END SIMULATED SUCCESS ---

      } else {
        // Backend reported an error initiating STK push
        throw new Error(data.msg || "Failed to initiate payment.");
      }
    } catch (error) {
      console.error("M-Pesa Checkout Error:", error);
      showMpesaResponse(`Error: ${error.message}`, "error");
    } finally {
      // Re-enable button after simulation starts or on error
      // In a real app, you might keep it disabled until payment status is confirmed
      mpesaCheckoutBtn.disabled = false;
      mpesaCheckoutBtn.innerHTML = 
        `<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/1280px-M-PESA_LOGO-01.svg.png" alt="M-Pesa Logo" class="h-5 mr-2"> Pay with M-Pesa`;
    }
  }

  // Helper to show M-Pesa response messages
  function showMpesaResponse(message, type) {
      if (!mpesaResponseEl) return;
      mpesaResponseEl.textContent = message;
      mpesaResponseEl.classList.remove("text-green-600", "text-red-600", "text-blue-600", "hidden");
      if (type === "success") mpesaResponseEl.classList.add("text-green-600");
      else if (type === "error") mpesaResponseEl.classList.add("text-red-600");
      else mpesaResponseEl.classList.add("text-blue-600"); // Info

      // Clear message after some time, unless it's the final success message
      if (type !== "success") {
          setTimeout(() => {
              if (mpesaResponseEl.textContent === message) { // Avoid clearing newer messages
                  mpesaResponseEl.textContent = "";
                  mpesaResponseEl.classList.add("hidden");
              }
          }, 7000);
      }
  }

  // --- Form Handlers (Contact, Newsletter) ---
  async function handleContactFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const responseDiv = document.getElementById("contact-response");
    const submitButton = form.querySelector("button[type=\"submit\"]");
    const name = form.elements.name.value;
    const email = form.elements.email.value;
    const message = form.elements.message.value;

    submitButton.disabled = true;
    submitButton.innerHTML = "Sending...";
    showResponseMessage(responseDiv, "", "");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await response.json();
      if (response.ok) {
        showResponseMessage(responseDiv, data.msg, "success", "contact");
        form.reset();
      } else {
        throw new Error(data.msg || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      showResponseMessage(responseDiv, `Error: ${error.message}`, "error", "contact");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = "Send Message";
    }
  }

  async function handleNewsletterSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const responseDiv = document.getElementById("newsletter-response");
    const submitButton = form.querySelector("button[type=\"submit\"]");
    const email = form.elements["newsletter-email"].value;

    submitButton.disabled = true;
    submitButton.innerHTML = "Subscribing...";
    showResponseMessage(responseDiv, "", "");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        showResponseMessage(responseDiv, data.msg, "success", "newsletter");
        form.reset();
      } else {
        throw new Error(data.msg || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      showResponseMessage(responseDiv, `Error: ${error.message}`, "error", "newsletter");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = "Subscribe";
    }
  }

  // --- Helper to show response messages ---
  function showResponseMessage(element, message, type, context = null) {
    if (!element) return;
    element.textContent = message;
    element.classList.remove("success", "error", "bg-green-100", "text-green-700", "bg-red-100", "text-red-700", "bg-green-500", "bg-red-500", "hidden");
    element.classList.add("py-2", "px-4", "rounded-md", "mt-4");

    if (type === "success") {
        if (context === "newsletter") element.classList.add("bg-green-500", "text-white");
        else element.classList.add("bg-green-100", "text-green-700");
    } else if (type === "error") {
        if (context === "newsletter") element.classList.add("bg-red-500", "text-white");
        else element.classList.add("bg-red-100", "text-red-700");
    }
    
    setTimeout(() => {
      if (element.textContent === message) { // Avoid clearing newer messages
          element.classList.add("hidden");
          element.textContent = "";
      }
    }, 5000);
  }

  // --- Initial Load ---
  showHomePage();
  updateCartUI();
});

