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
  const productsContainer = document.getElementById("featured-products");
  const heroSection = document.querySelector(".relative.bg-black.text-white");
  const heroShopNowBtn = document.getElementById("hero-shop-now-btn");
  const mpesaCheckoutBtn = document.getElementById("mpesa-checkout-btn");
  const mpesaPhoneInput = document.getElementById("mpesa-phone");
  const mpesaResponseEl = document.getElementById("mpesa-response");
  const deliveryLocationSelect = document.getElementById("delivery-location");
  const deliveryFeeEl = document.getElementById("delivery-fee");
  const cartTotalEl = document.getElementById("cart-total");
  const cartSubtotalEl = document.getElementById("cart-subtotal");
  const cartItemsContainer = document.getElementById("cart-items");
  const cartCount = document.getElementById("cart-count");

  // Base URL for API endpoints
  const API_BASE_URL = "https://novawear.onrender.com";

  // --- State ---
  let searchTimeout = null;
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const DELIVERY_FEE = 300; // KES for locations outside Mombasa/Kilifi

  // --- Initialize ---
  updateCartUI();
  showHomePage();

  // --- Event Listeners ---
  searchBtn?.addEventListener("click", toggleSearch);
  searchInput?.addEventListener("input", handleSearchInput);
  searchInput?.addEventListener("keypress", handleSearchEnter);
  mobileMenuBtn?.addEventListener("click", toggleMobileMenu);
  mobileShopBtn?.addEventListener("click", toggleMobileCategories);
  cartBtn?.addEventListener("click", openCart);
  closeCartBtn?.addEventListener("click", closeCart);
  heroShopNowBtn?.addEventListener("click", openCartFromHero);
  mpesaCheckoutBtn?.addEventListener("click", handleMpesaCheckout);
  deliveryLocationSelect?.addEventListener("change", updateDeliveryFee);
  contactForm?.addEventListener("submit", handleContactFormSubmit);
  newsletterForm?.addEventListener("submit", handleNewsletterSubmit);

  // --- Navigation Functions ---
  function toggleSearch() {
    if (searchInput.classList.contains("hidden")) {
      searchInput.classList.remove("hidden");
      searchInput.focus();
    } else {
      if (searchInput.value.trim() !== "") {
        performSearch(searchInput.value.trim());
      }
    }
  }

  function handleSearchInput() {
    clearTimeout(searchTimeout);
    const query = searchInput.value.trim();
    if (query.length > 1) {
      searchTimeout = setTimeout(() => performSearch(query), 300);
    } else if (query.length === 0) {
      showHomePage();
    }
  }

  function handleSearchEnter(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      clearTimeout(searchTimeout);
      const query = searchInput.value.trim();
      if (query) performSearch(query);
    }
  }

  function toggleMobileMenu() {
    mobileMenu.classList.toggle("hidden");
  }

  function toggleMobileCategories() {
    mobileCategories.classList.toggle("hidden");
  }

  function openCart() {
    cartSidebar.classList.remove("cart-closed");
    cartSidebar.classList.add("cart-open");
  }

  function closeCart() {
    cartSidebar.classList.remove("cart-open");
    cartSidebar.classList.add("cart-closed");
  }

  function openCartFromHero(event) {
    event.preventDefault();
    openCart();
  }

  // --- Cart Functions ---
  function addToCart(product, size) {
    const existingItem = cart.find(item => 
      item.id === product.id && item.size === size);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ 
        ...product, 
        size,
        quantity: 1 
      });
    }
    
    saveCart();
    updateCartUI();
    openCart();
  }

  function removeFromCart(productId, size) {
    cart = cart.filter(item => 
      !(item.id === productId && item.size === size));
    saveCart();
    updateCartUI();
  }

  function updateCartItemQuantity(productId, size, action) {
    const item = cart.find(item => 
      item.id === productId && item.size === size);
    
    if (!item) return;

    if (action === "increase") {
      item.quantity += 1;
    } else if (action === "decrease") {
      item.quantity -= 1;
      if (item.quantity <= 0) {
        removeFromCart(productId, size);
        return;
      }
    }
    
    saveCart();
    updateCartUI();
  }

  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  function clearCart() {
    cart = [];
    saveCart();
    updateCartUI();
  }

  function updateCartUI() {
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    // Update cart items
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
            <p class="text-sm text-gray-600">Size: ${item.size}</p>
            <div class="flex justify-between mt-1">
              <div class="flex items-center">
                <button class="cart-qty-btn px-2 py-0.5 border rounded" 
                        data-id="${item.id}" data-size="${item.size}" data-action="decrease">-</button>
                <span class="mx-2">${item.quantity}</span>
                <button class="cart-qty-btn px-2 py-0.5 border rounded" 
                        data-id="${item.id}" data-size="${item.size}" data-action="increase">+</button>
              </div>
              <span>KES ${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          </div>
          <button class="remove-from-cart ml-4 text-gray-400 hover:text-red-500" 
                  data-id="${item.id}" data-size="${item.size}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `).join("");

      // Add event listeners to cart buttons
      cartItemsContainer.querySelectorAll(".remove-from-cart").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.getAttribute("data-id");
          const size = e.currentTarget.getAttribute("data-size");
          removeFromCart(id, size);
        });
      });

      cartItemsContainer.querySelectorAll(".cart-qty-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.getAttribute("data-id");
          const size = e.currentTarget.getAttribute("data-size");
          const action = e.currentTarget.getAttribute("data-action");
          updateCartItemQuantity(id, size, action);
        });
      });
    }

    // Update totals
    updateDeliveryFee();
  }

  function updateDeliveryFee() {
    const subtotal = cart.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0);
    const location = deliveryLocationSelect.value;
    const deliveryFee = location === "other" ? DELIVERY_FEE : 0;
    const total = subtotal + deliveryFee;

    cartSubtotalEl.textContent = `KES ${subtotal.toFixed(2)}`;
    deliveryFeeEl.textContent = `KES ${deliveryFee.toFixed(2)}`;
    cartTotalEl.textContent = `KES ${total.toFixed(2)}`;
  }

  // --- Product Display Functions ---
  async function showHomePage() {
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
    hideAllSections();
    productsContainer?.parentElement.classList.remove("hidden");
    const categoryTitle = category === "all" ? "All Products" : 
                         category.charAt(0).toUpperCase() + category.slice(1);
    productsContainer.innerHTML = 
      `<h2 class="text-3xl font-bold mb-12 text-center col-span-full">${categoryTitle}</h2>` + 
      `<div class="animate-pulse bg-gray-200 rounded-lg h-80 col-span-full md:col-span-2 lg:col-span-4"></div>`;

    try {
      const endpoint = category === "all" ? "/api/products" : 
                     `/api/products?category=${encodeURIComponent(category)}`;
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
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

  async function loadAllProducts() {
    productsContainer.innerHTML = 
      `<h2 class="text-3xl font-bold mb-12 text-center col-span-full">Featured Products</h2>` + 
      `<div class="animate-pulse bg-gray-200 rounded-lg h-80 col-span-full md:col-span-2 lg:col-span-4"></div>`;
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const products = await response.json();
      productsContainer.innerHTML = 
        `<h2 class="text-3xl font-bold mb-12 text-center col-span-full">Featured Products</h2>`;
      displayProducts(products);
    } catch (error) {
      console.error("Error loading products:", error);
      productsContainer.innerHTML = 
        `<h2 class="text-3xl font-bold mb-12 text-center col-span-full">Featured Products</h2>` +
        `<p class="text-red-600 text-center col-span-full">Error loading products: ${error.message}.</p>`;
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
      
      // Create tags display
      const tagsHTML = product.tags?.map(tag => `
        <span class="tag tag-${tag}">${formatTagName(tag)}</span>
      `).join('') || '';

      productCard.innerHTML = `
        <div class="relative overflow-hidden h-48 md:h-64">
          ${tagsHTML}
          <img src="${product.image}?${Date.now()}" alt="${product.name}" class="product-image w-full h-full object-cover">
          <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white px-3 py-2">
            <span class="text-sm">${product.category}</span>
          </div>
        </div>
        <div class="p-4">
          <h3 class="font-medium text-lg">${product.name}</h3>
          <div class="mt-2 mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Size</label>
            <div class="flex space-x-2">
              <button class="size-option border rounded px-2 py-1 text-sm hover:bg-gray-100" data-size="S">S</button>
              <button class="size-option border rounded px-2 py-1 text-sm hover:bg-gray-100" data-size="M">M</button>
              <button class="size-option border rounded px-2 py-1 text-sm hover:bg-gray-100" data-size="L">L</button>
              <button class="size-option border rounded px-2 py-1 text-sm hover:bg-gray-100" data-size="XL">XL</button>
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-900 font-bold">KES ${product.price.toFixed(2)}</span>
            <button class="add-to-cart bg-black text-white px-3 py-1 rounded-md text-sm hover:bg-gray-800" data-id="${product._id}">
              Add to Cart
            </button>
          </div>
        </div>
      `;
      productsContainer.appendChild(productCard);
      
      // Set default selected size
      const sizeOptions = productCard.querySelectorAll(".size-option");
      if (sizeOptions.length > 0) {
        sizeOptions[1].classList.add("bg-black", "text-white"); // Default to M
      }

      // Add to cart button
      const addToCartBtn = productCard.querySelector(".add-to-cart");
      addToCartBtn.addEventListener("click", () => {
        const selectedSize = productCard.querySelector(".size-option.bg-black")?.getAttribute("data-size") || "M";
        addToCart({ 
          ...product, 
          id: product._id,
          size: selectedSize
        }); 
      });

      // Size selection
      sizeOptions.forEach(option => {
        option.addEventListener("click", (e) => {
          e.preventDefault();
          sizeOptions.forEach(opt => opt.classList.remove("bg-black", "text-white"));
          option.classList.add("bg-black", "text-white");
        });
      });
    });
  }

  function formatTagName(tag) {
    const names = {
      'new': 'New',
      'out-of-stock': 'Out of Stock',
      'coming-soon': 'Coming Soon',
      'sale': 'Sale'
    };
    return names[tag] || tag;
  }

  // --- Search Functionality ---
  async function performSearch(query) {
    hideAllSections();
    productsContainer?.parentElement.classList.remove("hidden");
    productsContainer.innerHTML = 
        `<h2 class="text-3xl font-bold mb-12 text-center col-span-full">Search Results for "${query}"</h2>` +
        `<div class="animate-pulse bg-gray-200 rounded-lg h-80 col-span-full md:col-span-2 lg:col-span-4"></div>`;
    updatePageTitle(`Search Results for "${query}" - Nova Wear`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/products?search=${encodeURIComponent(query)}`);
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

  // --- M-Pesa Checkout ---
  async function handleMpesaCheckout() {
    const phone = mpesaPhoneInput.value.trim();
    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const deliveryFee = deliveryLocationSelect.value === "other" ? DELIVERY_FEE : 0;
    const amount = subtotal + deliveryFee;

    // Validation
    if (cart.length === 0) {
      showMpesaResponse("Your cart is empty.", "error");
      return;
    }
    if (!phone) {
      showMpesaResponse("Please enter your M-Pesa phone number.", "error");
      return;
    }
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
      `<svg class="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg> Processing...`;
    showMpesaResponse("Initiating payment...", "info");

    try {
      const response = await fetch(`${API_BASE_URL}/api/mpesa/stkpush`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, amount }),
      });
      const data = await response.json();

      if (response.ok) {
        showMpesaResponse("Check your phone and enter your M-Pesa PIN.", "info");
        
        // Simulate successful payment
        setTimeout(() => {
          showMpesaResponse("Payment Successful! Thank you.", "success");
          clearCart();
        }, 15000);
      } else {
        throw new Error(data.msg || "Failed to initiate payment.");
      }
    } catch (error) {
      console.error("M-Pesa Checkout Error:", error);
      showMpesaResponse(`Error: ${error.message}`, "error");
    } finally {
      mpesaCheckoutBtn.disabled = false;
      mpesaCheckoutBtn.innerHTML = 
        `<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/1280px-M-PESA_LOGO-01.svg.png" alt="M-Pesa Logo" class="h-5 mr-2"> Pay with M-Pesa`;
    }
  }

  function showMpesaResponse(message, type) {
    if (!mpesaResponseEl) return;
    mpesaResponseEl.textContent = message;
    mpesaResponseEl.className = `text-sm mt-2 text-center ${
      type === "success" ? "text-green-600" :
      type === "error" ? "text-red-600" : "text-blue-600"
    }`;
  }

  // --- Helper Functions ---
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

  // --- Form Handlers ---
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
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
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
      const response = await fetch(`${API_BASE_URL}/api/subscribe`, {
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

  function showResponseMessage(element, message, type, context = null) {
    if (!element) return;
    element.textContent = message;
    element.className = `py-2 px-4 rounded-md mt-4 ${
      type === "success" ? 
        (context === "newsletter" ? "bg-green-500 text-white" : "bg-green-100 text-green-700") :
      type === "error" ? 
        (context === "newsletter" ? "bg-red-500 text-white" : "bg-red-100 text-red-700") : ""
    }`;
    
    setTimeout(() => {
      if (element.textContent === message) {
        element.classList.add("hidden");
        element.textContent = "";
      }
    }, 5000);
  }
});