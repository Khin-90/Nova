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
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const DELIVERY_FEE = 450; // KES for locations outside Mombasa/Kilifi
  const VALID_SIZES = ["S", "M", "L", "XL"]; // Define valid sizes

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

  // Add event delegation for category links, about links
  document.addEventListener("click", (e) => {
    // Handle category links
    const categoryLink = e.target.closest("[data-category]");
    if (categoryLink) {
      e.preventDefault();
      const category = categoryLink.getAttribute("data-category");
      loadProductsByCategory(category);
      return; // Prevent other handlers if it's a category link
    }

    // Handle about links
    const aboutLink = e.target.closest("#about-link, #footer-about-link, #mobile-about-link");
    if (aboutLink) {
      e.preventDefault();
      showAboutSection();
      return; // Prevent other handlers if it's an about link
    }
  });

  // Event delegation for cart buttons (within cartItemsContainer)
  cartItemsContainer?.addEventListener("click", (e) => {
    console.log("Cart button clicked:", e.target);
    const target = e.target.closest("button");
    if (!target) return;

    const id = target.getAttribute("data-id");
    const size = target.getAttribute("data-size");
    console.log(`Cart action triggered for ID: ${id}, Size: ${size}`);

    // Validate ID and Size before proceeding
    if (!id || !size || !VALID_SIZES.includes(size)) {
        console.error(`Invalid ID ('${id}') or Size ('${size}') for cart action. Action aborted.`);
        return; // Stop processing if ID or Size is invalid
    }

    // Now we know id and size are valid strings
    if (target.classList.contains("remove-from-cart")) {
        console.log("Attempting to remove item...");
        removeFromCart(id, size);
    } else if (target.classList.contains("decrease-btn")) {
        console.log("Attempting to decrease quantity...");
        updateCartItemQuantity(id, size, "decrease");
    } else if (target.classList.contains("increase-btn")) {
        console.log("Attempting to increase quantity...");
        updateCartItemQuantity(id, size, "increase");
    }
  });

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

  function showAboutSection() {
    hideAllSections();
    const aboutSection = document.getElementById("about-section-content");
    if (aboutSection) aboutSection.classList.remove("hidden");
    updatePageTitle("About Us - Nova Wear");
  }

  // --- Cart Functions ---
  function addToCart(product, size) {
    console.log("addToCart received product:", product); // Log received product
    // Ensure size is valid before adding
    if (!VALID_SIZES.includes(size)) {
        console.error(`Attempted to add product with invalid size: ${size}. Aborting.`);
        alert(`Invalid size selected: ${size}. Please select a valid size.`);
        return;
    }
    // *** FIX: Ensure product.id exists before proceeding ***
    if (!product || !product.id) {
        console.error("Attempted to add product without a valid ID:", product);
        alert("Cannot add this item to the cart. Product ID is missing.");
        return;
    }

    const existingItem = cart.find(
      (item) => item.id === product.id && item.size === size
    );

    if (existingItem) {
      existingItem.quantity += 1;
      console.log("Increased quantity for existing item");
    } else {
      // Create a clean item object for the cart
      const cartItem = {
        id: product.id, // Use the validated ID
        name: product.name,
        price: product.price,
        image: product.image, // Keep original relative path for consistency
        size: size, // Use the validated size
        quantity: 1,
        // Optionally include other needed fields like category, tags, etc.
        category: product.category,
        tags: product.tags,
        sizes: product.sizes
      };
      cart.push(cartItem);
      console.log("Added new item to cart:", cartItem);
    }

    saveCart();
    updateCartUI();
    openCart();
  }

  function removeFromCart(productId, size) {
    // Size is validated by the event listener
    console.log(`Removing item from cart: ID=${productId}, Size=${size}`);
    const initialLength = cart.length;
    cart = cart.filter(
      (item) => !(item.id === productId && item.size === size)
    );
    if (cart.length < initialLength) {
      console.log("Item successfully removed.");
      saveCart();
      updateCartUI();
    } else {
      console.error("Failed to find item to remove. Cart state:", cart);
    }
  }

  function updateCartItemQuantity(productId, size, action) {
    // Size is validated by the event listener
    console.log(`Updating quantity: ID=${productId}, Size=${size}, Action=${action}`);
    const item = cart.find(
      (item) => item.id === productId && item.size === size
    );

    if (!item) {
      console.error("Item not found for quantity update. Cart state:", cart);
      return;
    }

    if (action === "increase") {
      item.quantity += 1;
      console.log("Quantity increased to", item.quantity);
    } else if (action === "decrease") {
      item.quantity -= 1;
      console.log("Quantity decreased to", item.quantity);
      if (item.quantity <= 0) {
        console.log("Quantity is zero or less, removing item...");
        removeFromCart(productId, size);
        return; // Exit early as item is removed
      }
    }

    saveCart();
    updateCartUI();
  }

  function saveCart() {
    console.log("Saving cart to localStorage:", cart);
    // Ensure cart is an array before stringifying
    const cartToSave = Array.isArray(cart) ? cart : [];
    localStorage.setItem("cart", JSON.stringify(cartToSave));
  }

  function clearCart() {
    console.log("Clearing cart");
    cart = [];
    saveCart(); // Will save an empty array
    updateCartUI();
  }

  function updateCartUI() {
    console.log("Updating Cart UI...");
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0); // Ensure quantity exists
    if (cartCount) cartCount.textContent = totalItems;

    // Update cart items
    if (!cartItemsContainer) {
      console.error("Cart items container not found!");
      return; // Ensure container exists
    }

    if (cart.length === 0) {
      cartItemsContainer.innerHTML =
        '<p class="text-gray-500 text-center py-6">Your cart is empty</p>';
    } else {
      cartItemsContainer.innerHTML = cart
        .map(
          (item) => {
            // *** FIX: Check for valid ID more specifically ***
            let reason = "";
            if (!item) reason = "Item is null/undefined";
            else if (!item.id) reason = "Missing ID";
            else if (!item.size || !VALID_SIZES.includes(item.size)) reason = `Invalid Size ('${item.size}')`;
            else if (!item.quantity || item.quantity <= 0) reason = `Invalid Quantity ('${item.quantity}')`;
            
            if (reason) {
                console.warn(`Skipping rendering cart item: ${reason}. Item data:`, item);
                return ''; // Don't render this item
            }

            // Item is considered valid for rendering here
            const imageUrl = item.image && item.image.startsWith("http") ? item.image : `${API_BASE_URL}${item.image || ''}`;
            return `
              <div class="flex items-center py-4 border-b">
                <div class="w-16 h-16 flex-shrink-0 mr-4">
                  <img src="${imageUrl}?${Date.now()}" alt="${item.name || 'Product'}" class="w-full h-full object-cover rounded">
                </div>
                <div class="flex-grow">
                  <h4 class="font-medium">${item.name || 'Unknown Product'}</h4>
                  <p class="text-sm text-gray-600">Size: ${item.size}</p>
                  <div class="flex justify-between mt-1">
                    <div class="flex items-center">
                      <button class="cart-qty-btn decrease-btn px-2 py-0.5 border rounded" 
                              data-id="${item.id}" data-size="${item.size}">-</button>
                      <span class="mx-2">${item.quantity}</span>
                      <button class="cart-qty-btn increase-btn px-2 py-0.5 border rounded" 
                              data-id="${item.id}" data-size="${item.size}">+</button>
                    </div>
                    <span>KES ${((item.price || 0) * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
                <button class="remove-from-cart ml-4 text-gray-400 hover:text-red-500" 
                        data-id="${item.id}" data-size="${item.size}">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            `;
          }
        )
        .join("");
    }

    // Update totals
    updateDeliveryFee();
    console.log("Cart UI update complete.");
  }

  function updateDeliveryFee() {
    const subtotal = cart.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0
    );
    const location = deliveryLocationSelect?.value || "mombasa-kilifi"; // Default if select not found
    const deliveryFee = location === "other" ? DELIVERY_FEE : 0;
    const total = subtotal + deliveryFee;

    if (cartSubtotalEl) cartSubtotalEl.textContent = `KES ${subtotal.toFixed(2)}`;
    if (deliveryFeeEl) deliveryFeeEl.textContent = `KES ${deliveryFee.toFixed(2)}`;
    if (cartTotalEl) cartTotalEl.textContent = `KES ${total.toFixed(2)}`;
  }

  // --- Product Display Functions ---
  async function showHomePage() {
    hideAllSections();
    heroSection?.classList.remove("hidden");
    document.getElementById("featured-products-section")?.classList.remove("hidden"); // Use ID added earlier
    document.getElementById("contact")?.classList.remove("hidden");
    document.querySelector(".bg-gray-900")?.classList.remove("hidden"); // Newsletter
    document.querySelector(".py-16.bg-gray-50")?.classList.remove("hidden"); // Categories
    loadFeaturedProducts();
    updatePageTitle("Nova Wear - Contemporary Clothing");
  }

  async function loadFeaturedProducts() {
    const featuredProductsContainer = document.getElementById("featured-products");
    if (!featuredProductsContainer) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/featured?nocache=${Date.now()}`); // Use specific featured endpoint
      if (!response.ok) throw new Error("Failed to fetch featured products");
      const products = await response.json();
      displayProducts(products, featuredProductsContainer);
    } catch (error) {
      console.error("Error loading featured products:", error);
      featuredProductsContainer.innerHTML =
        '<p class="text-red-600 text-center col-span-full">Error loading featured products.</p>';
    }
  }

  async function loadProductsByCategory(category) {
    hideAllSections();
    const productSection = document.getElementById("product-display-section");
    const productGrid = document.getElementById("product-grid");
    const categoryTitleEl = document.getElementById("category-title");

    if (!productSection || !productGrid || !categoryTitleEl) {
      console.error("Required elements for category display not found.");
      return;
    }

    productSection.classList.remove("hidden");
    const categoryTitle = category === "all" ? "All Products" :
                         category.charAt(0).toUpperCase() + category.slice(1);
    categoryTitleEl.textContent = categoryTitle;
    productGrid.innerHTML = 
      `<div class="animate-pulse bg-gray-200 rounded-lg h-80 col-span-full md:col-span-2 lg:col-span-4"></div>`; // Loading state
    updatePageTitle(`Shop ${categoryTitle} - Nova Wear`);

    try {
      const endpoint = category === "all" ? "/api/products" :
                     `/api/products?category=${encodeURIComponent(category)}`;
      const response = await fetch(`${API_BASE_URL}${endpoint}&nocache=${Date.now()}`); // Add cache buster and ensure base URL
      if (!response.ok) throw new Error(`Failed to fetch ${category} products`);
      const products = await response.json();
      displayProducts(products, productGrid);
    } catch (error) {
      console.error(`Error loading ${category} products:`, error);
      productGrid.innerHTML = 
        `<p class="text-red-600 text-center col-span-full">Error loading products: ${error.message}.</p>`;
    }
  }

  function displayProducts(products, container) {
    if (!container) return;
    
    container.innerHTML = ''; 

    if (products.length === 0) {
      const noProductsMsg = document.createElement("p");
      noProductsMsg.className = "text-gray-500 text-center col-span-full";
      noProductsMsg.textContent = "No products found.";
      container.appendChild(noProductsMsg);
      return;
    }

    products.forEach((product) => {
      // *** FIX: Ensure product has an ID before rendering card ***
      if (!product || !product.id) {
          console.warn("Skipping display of product with missing ID:", product);
          return; // Don't render card if product ID is missing
      }

      const productCard = document.createElement("div");
      productCard.className =
        "product-card bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow duration-300";

      const tagsHTML = product.tags?.map(tag => `
        <span class="tag tag-${tag}">${formatTagName(tag)}</span>
      `).join('') || '';

      const imageUrl = product.image && product.image.startsWith("http") ? product.image : `${API_BASE_URL}${product.image || ''}`;

      productCard.innerHTML = `
        <div class="relative overflow-hidden h-48 md:h-64">
          ${tagsHTML}
          <img src="${imageUrl}?${Date.now()}" alt="${product.name || 'Product'}" class="product-image w-full h-full object-cover">
          <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white px-3 py-2">
            <span class="text-sm">${product.category || 'Uncategorized'}</span>
          </div>
        </div>
        <div class="p-4">
          <h3 class="font-medium text-lg">${product.name || 'Unknown Product'}</h3>
          <div class="mt-2 mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Size</label>
            <div class="flex space-x-2">
              ${(product.sizes || VALID_SIZES).map(size => 
                `<button class="size-option border rounded px-2 py-1 text-sm hover:bg-gray-100" data-size="${size}">${size}</button>`
              ).join('')}
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-900 font-bold">KES ${(product.price || 0).toFixed(2)}</span>
            <button class="add-to-cart bg-black text-white px-3 py-1 rounded-md text-sm hover:bg-gray-800" data-product-id="${product.id}">
              Add to Cart
            </button>
          </div>
        </div>
      `;
      container.appendChild(productCard);

      const sizeOptions = productCard.querySelectorAll(".size-option");
      if (sizeOptions.length > 0) {
        const defaultSizeBtn = productCard.querySelector('.size-option[data-size="M"]') || sizeOptions[0];
        defaultSizeBtn.classList.add("bg-black", "text-white");
      }

      const addToCartBtn = productCard.querySelector(".add-to-cart");
      addToCartBtn.addEventListener("click", () => {
        const selectedSizeBtn = productCard.querySelector(".size-option.bg-black");
        const selectedSize = selectedSizeBtn ? selectedSizeBtn.getAttribute("data-size") : (productCard.querySelector('.size-option[data-size="M"]') || sizeOptions[0])?.getAttribute("data-size"); 
        
        if (!selectedSize) {
            console.error("Could not determine selected size for product:", product.name);
            alert("Please select a size before adding to cart.");
            return;
        }

        // *** FIX: Pass the correct product object with 'id' property ***
        // The 'product' object here already has 'id' thanks to the Mongoose virtual
        console.log("Product data being passed to addToCart:", product);
        addToCart(product, selectedSize);
      });

      sizeOptions.forEach((option) => {
        option.addEventListener("click", (e) => {
          e.preventDefault();
          sizeOptions.forEach((opt) =>
            opt.classList.remove("bg-black", "text-white")
          );
          option.classList.add("bg-black", "text-white");
        });
      });
    });
  }

  function formatTagName(tag) {
    const names = {
      new: "New",
      "out-of-stock": "Out of Stock",
      "coming-soon": "Coming Soon",
      sale: "Sale",
    };
    return names[tag] || tag;
  }

  // --- Search Functionality ---
  async function performSearch(query) {
    hideAllSections();
    const productSection = document.getElementById("product-display-section");
    const productGrid = document.getElementById("product-grid");
    const categoryTitleEl = document.getElementById("category-title");

    if (!productSection || !productGrid || !categoryTitleEl) {
      console.error("Required elements for search display not found.");
      return;
    }

    productSection.classList.remove("hidden");
    categoryTitleEl.textContent = `Search Results for "${query}"`;
    productGrid.innerHTML = 
      `<div class="animate-pulse bg-gray-200 rounded-lg h-80 col-span-full md:col-span-2 lg:col-span-4"></div>`; // Loading state
    updatePageTitle(`Search Results for "${query}" - Nova Wear`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/products?search=${encodeURIComponent(query)}&nocache=${Date.now()}`);
      if (!response.ok) throw new Error("Search request failed");
      const products = await response.json();
      displayProducts(products, productGrid);
    } catch (error) {
      console.error("Error performing search:", error);
      productGrid.innerHTML = 
        `<p class="text-red-600 text-center col-span-full">Error loading search results: ${error.message}.</p>`;
    }
  }

  // --- Form Handling ---
  async function handleContactFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const responseDiv = document.getElementById("contact-response");
    const submitButton = form.querySelector("button[type='submit']");
    const originalButtonText = submitButton.textContent;

    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Sending...';
    showResponse(responseDiv, "", ""); // Clear previous message

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData))
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.msg || 'Failed to send message');
      }
      showResponse(responseDiv, "Message sent successfully! We'll get back to you soon.", "success");
      form.reset();
    } catch (error) {
      console.error("Error submitting contact form:", error);
      showResponse(responseDiv, `Error: ${error.message || "Could not send message."}`, "error");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  }

  async function handleNewsletterSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const emailInput = document.getElementById("newsletter-email");
    const responseDiv = document.getElementById("newsletter-response");
    const submitButton = form.querySelector("button[type='submit']");
    const originalButtonText = submitButton.textContent;

    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Subscribing...';
    showResponse(responseDiv, "", ""); // Clear previous message

    try {
       const response = await fetch(`${API_BASE_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.value })
      });
      const result = await response.json();
       if (!response.ok) {
        throw new Error(result.msg || 'Failed to subscribe');
      }
      showResponse(responseDiv, "Thanks for subscribing!", "success");
      form.reset();
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      showResponse(responseDiv, `Error: ${error.message || "Could not subscribe."}`, "error");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  }

  // --- M-Pesa Checkout ---
  async function handleMpesaCheckout() {
    if (!mpesaPhoneInput || !mpesaResponseEl) return;

    const phone = mpesaPhoneInput.value.trim();
    const totalText = cartTotalEl.textContent;
    const amountMatch = totalText.match(/KES (\d+\.?\d*)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    if (!phone || !/^254\d{9}$/.test(phone)) {
      showMpesaResponse("Please enter a valid M-Pesa number (e.g., 254712345678).", "error");
      return;
    }
    if (amount <= 0) {
      showMpesaResponse("Your cart is empty or total is zero.", "error");
      return;
    }

    showMpesaResponse("Processing payment...", "info");
    mpesaCheckoutBtn.disabled = true;
    mpesaCheckoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';

    try {
      const response = await fetch(`${API_BASE_URL}/api/mpesa/stkpush`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, amount }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.msg || `STK Push failed: ${response.statusText}`);
      }

      showMpesaResponse(
        "STK Push sent! Please check your phone to complete the payment.",
        "success"
      );
      await createOrderAfterPaymentAttempt(phone, amount);

    } catch (error) {
      console.error("M-Pesa Checkout Error:", error);
      showMpesaResponse(`Error: ${error.message}`, "error");
    } finally {
      mpesaCheckoutBtn.disabled = false;
      mpesaCheckoutBtn.innerHTML = 'Pay with M-Pesa <i class="fas fa-lock ml-2"></i>';
    }
  }

  async function createOrderAfterPaymentAttempt(phone, amount) {
    const location = deliveryLocationSelect?.value || "mombasa-kilifi";
    const deliveryFee = location === "other" ? DELIVERY_FEE : 0;
    const subtotal = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
    const total = subtotal + deliveryFee;

    const orderData = {
      items: cart.map(item => ({ 
        productId: item.id, 
        name: item.name,
        size: item.size, 
        quantity: item.quantity, 
        price: item.price,
        image: item.image // Include original relative image URL in order data
      })),
      customerName: "Online Customer", // Placeholder
      phone: phone,
      location: location,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      total: total,
      paymentMethod: "M-Pesa",
      status: "pending" 
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.msg || "Failed to create order");
      }
      console.log("Order created successfully (pending payment confirmation):", result.orderId);
      clearCart(); 
      showMpesaResponse("Payment initiated and order placed (pending confirmation). Thank you!", "success", true);
      setTimeout(closeCart, 3000); 

    } catch (error) {
      console.error("Error creating order:", error);
      showMpesaResponse(`Payment initiated, but failed to save order: ${error.message}. Please contact support.`, "error", true);
    }
  }

  function showMpesaResponse(message, type, keepVisible = false) {
    if (!mpesaResponseEl) return;
    mpesaResponseEl.textContent = message;
    mpesaResponseEl.className = `p-3 rounded-md text-sm ${type === "success" 
      ? "bg-green-100 border border-green-400 text-green-700" 
      : type === "error" 
      ? "bg-red-100 border border-red-400 text-red-700" 
      : "bg-blue-100 border border-blue-400 text-blue-700"}`;
    mpesaResponseEl.classList.remove("hidden");

    if (!keepVisible) {
      setTimeout(() => {
        mpesaResponseEl.classList.add("hidden");
        mpesaResponseEl.textContent = "";
        mpesaResponseEl.className = "";
      }, 5000);
    }
  }

  // --- Helper Functions ---
  function hideAllSections() {
    heroSection?.classList.add("hidden");
    document.getElementById("featured-products-section")?.classList.add("hidden");
    document.getElementById("contact")?.classList.add("hidden");
    document.querySelector(".bg-gray-900")?.classList.add("hidden"); // Newsletter
    document.querySelector(".py-16.bg-gray-50")?.classList.add("hidden"); // Categories
    document.getElementById("about-section-content")?.classList.add("hidden");
    document.getElementById("product-display-section")?.classList.add("hidden");
  }

  function showResponse(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = `py-3 px-4 rounded-md ${type === "success" 
      ? "bg-green-100 text-green-800" 
      : "bg-red-100 text-red-800"}`;
    element.classList.remove("hidden");

    setTimeout(() => {
      element.classList.add("hidden");
    }, 5000);
  }

  function updatePageTitle(title) {
    document.title = title;
  }

  // --- Initial Setup ---
  function initializeProductDisplayArea() {
    const mainContentArea = document.querySelector('body'); 
    if (!document.getElementById('product-display-section')) {
      const displaySection = document.createElement('section');
      displaySection.id = 'product-display-section';
      displaySection.className = 'hidden py-16 bg-white'; 
      displaySection.innerHTML = `
        <div class="container mx-auto px-4">
          <h2 id="category-title" class="text-3xl font-bold mb-12 text-center"></h2>
          <div id="product-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <!-- Products will be loaded here -->
          </div>
        </div>
      `;
      const header = document.querySelector('header');
      if (header) {
        header.insertAdjacentElement('afterend', displaySection);
      } else {
        mainContentArea.insertBefore(displaySection, mainContentArea.firstChild);
      }
    }
    if (!document.getElementById('featured-products')) {
        console.warn('Featured products container (#featured-products) not found in HTML.');
    }
  }

  initializeProductDisplayArea(); 

});

