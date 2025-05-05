document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "https://novawear.onrender.com";
  const addProductForm = document.getElementById("add-product-form");
  const productListDiv = document.getElementById("product-list");
  const addResponseMessageDiv = document.getElementById("add-response-message");
  const deleteResponseMessageDiv = document.getElementById("delete-response-message");
  const ordersListDiv = document.getElementById("orders-list");
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const orderFilterButtons = document.querySelectorAll(".order-filter-btn");

  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab");
      
      // Update active tab button
      tabButtons.forEach(btn => {
        btn.classList.remove("border-indigo-600", "text-indigo-600");
        btn.classList.add("border-transparent", "text-gray-600");
      });
      button.classList.add("border-indigo-600", "text-indigo-600");
      button.classList.remove("border-transparent", "text-gray-600");
      
      // Show active tab content
      tabContents.forEach(content => content.classList.remove("active"));
      document.getElementById(`${tabId}-tab`).classList.add("active");
      
      // Load data if needed
      if (tabId === "orders") {
        fetchOrders();
      } else if (tabId === "products") {
        fetchProducts();
      }
    });
  });

  // Order filter buttons
  orderFilterButtons.forEach(button => {
    button.addEventListener("click", () => {
      const status = button.getAttribute("data-status");
      
      // Update active filter button
      orderFilterButtons.forEach(btn => {
        btn.classList.remove("bg-indigo-600", "text-white");
        btn.classList.add("bg-gray-200");
      });
      button.classList.add("bg-indigo-600", "text-white");
      button.classList.remove("bg-gray-200");
      
      fetchOrders(status);
    });
  });

  // --- Product Management ---
  async function fetchProducts() {
    try {
      productListDiv.innerHTML = 
        '<div class="text-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i>Loading products...</div>';
      
      const response = await fetch(`${API_BASE_URL}/api/products?nocache=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const products = await response.json();
      displayProducts(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      productListDiv.innerHTML = `
        <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error loading products: ${error.message}
        </div>`;
    }
  }

  function displayProducts(products) {
    productListDiv.innerHTML = "";
    
    if (products.length === 0) {
      productListDiv.innerHTML = `
        <div class="p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          No products found.
        </div>`;
      return;
    }

    const productsContainer = document.createElement("div");
    productsContainer.className = "space-y-3";
    
    products.forEach(product => {
      const productElement = document.createElement("div");
      productElement.className = "product-item flex items-center justify-between p-4 border rounded-lg mb-2 bg-white hover:bg-gray-50 transition-colors";
      
      const tagsHTML = product.tags?.map(tag => `
        <span class="tag tag-${tag}">${formatTagName(tag)}</span>
      `).join("") || "";

      // *** FIX: Prepend API_BASE_URL to image src ***
      const imageUrl = product.image.startsWith("http") ? product.image : `${API_BASE_URL}${product.image}`;

      productElement.innerHTML = `
        <div class="flex items-center space-x-4">
          <div class="relative">
            ${tagsHTML}
            <img src="${imageUrl}?${Date.now()}" alt="${product.name}" 
                 class="w-16 h-16 object-cover rounded border">
          </div>
          <div>
            <h3 class="font-semibold">${product.name}</h3>
            <p class="text-sm text-gray-600">${product.category} - KES ${product.price.toFixed(2)}</p>
            <p class="text-xs text-gray-500">ID: ${product.id}</p>
          </div>
        </div>
        <button data-id="${product.id}" 
                class="delete-product-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm transition-colors">
          Delete
        </button>
      `;
      productsContainer.appendChild(productElement);
    });
    
    productListDiv.appendChild(productsContainer);

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-product-btn").forEach(button => {
      button.addEventListener("click", handleDeleteProduct);
    });
  }

  // --- Order Management ---
  async function fetchOrders(status = "all") {
    try {
      ordersListDiv.innerHTML = 
        '<div class="text-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i>Loading orders...</div>';
      
      const endpoint = status === "all" ? "/api/orders" : `/api/orders?status=${status}`;
      const response = await fetch(`${API_BASE_URL}${endpoint}?nocache=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const orders = await response.json();
      displayOrders(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      ordersListDiv.innerHTML = `
        <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error loading orders: ${error.message}
        </div>`;
    }
  }

  function displayOrders(orders) {
    ordersListDiv.innerHTML = "";
    
    if (orders.length === 0) {
      ordersListDiv.innerHTML = `
        <div class="p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          No orders found.
        </div>`;
      return;
    }

    const ordersContainer = document.createElement("div");
    ordersContainer.className = "space-y-4";
    
    orders.forEach(order => {
      const orderElement = document.createElement("div");
      orderElement.className = `order-item p-4 border rounded-lg bg-white ${order.status === 'delivered' ? 'bg-green-50' : ''}`;
      
      const itemsHTML = order.items.map(item => {
        // *** FIX: Prepend API_BASE_URL to image src ***
        const imageUrl = item.image.startsWith("http") ? item.image : `${API_BASE_URL}${item.image}`;
        return `
          <div class="flex items-center py-2 border-b">
            <img src="${imageUrl}?${Date.now()}" alt="${item.name}" class="w-12 h-12 object-cover rounded mr-3">
            <div class="flex-grow">
              <h4 class="font-medium">${item.name}</h4>
              <p class="text-sm text-gray-600">Size: ${item.size} | Qty: ${item.quantity}</p>
            </div>
            <span class="font-medium">KES ${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        `;
      }).join("");
      
      orderElement.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <div>
            <h3 class="font-bold">Order #${order.orderId}</h3>
            <p class="text-sm text-gray-600">${new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <span class="px-3 py-1 rounded-full text-sm font-medium 
                ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
            ${order.status === 'delivered' ? 'Delivered' : 'Pending'}
          </span>
        </div>
        
        <div class="mb-4">
          ${itemsHTML}
        </div>
        
        <div class="flex justify-between items-center border-t pt-3">
          <div>
            <p class="font-medium">Customer: ${order.customerName}</p>
            <p class="text-sm text-gray-600">${order.phone}</p>
            <p class="text-sm">${order.location}</p>
          </div>
          <div class="text-right">
            <p class="font-medium">Subtotal: KES ${order.subtotal.toFixed(2)}</p>
            <p class="text-sm">Delivery: KES ${order.deliveryFee.toFixed(2)}</p>
            <p class="font-bold">Total: KES ${order.total.toFixed(2)}</p>
          </div>
        </div>
        
        <div class="flex justify-end space-x-2 mt-3">
          ${order.status !== 'delivered' ? `
            <button data-id="${order._id}" 
                    class="mark-delivered-btn bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm transition-colors">
              Mark Delivered
            </button>
          ` : ''}
          <button data-id="${order._id}" 
                  class="delete-order-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm transition-colors">
            Delete
          </button>
        </div>
      `;
      
      ordersContainer.appendChild(orderElement);
    });
    
    ordersListDiv.appendChild(ordersContainer);

    // Add event listeners to order action buttons
    document.querySelectorAll(".mark-delivered-btn").forEach(button => {
      button.addEventListener("click", handleMarkDelivered);
    });
    
    document.querySelectorAll(".delete-order-btn").forEach(button => {
      button.addEventListener("click", handleDeleteOrder);
    });
  }

  // --- Handle Add Product Form Submission ---
  addProductForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showResponseMessage(addResponseMessageDiv, "", "");

    const formData = new FormData(addProductForm);
    const tags = Array.from(addProductForm.querySelectorAll('input[name="tags"]:checked'))
                  .map(checkbox => checkbox.value);
    
    // Append tags to formData
    tags.forEach(tag => formData.append('tags', tag));

    const submitButton = addProductForm.querySelector("button[type='submit']");
    const originalButtonText = submitButton.textContent;
    
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Adding...';

    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.msg || `HTTP error! status: ${response.status}`);
      }

      showResponseMessage(addResponseMessageDiv, `Success: ${result.name} added.`, "success");
      addProductForm.reset();
      await fetchProducts(); // Refresh the product list

    } catch (error) {
      console.error("Error adding product:", error);
      showResponseMessage(addResponseMessageDiv, `Error: ${error.message}`, "error");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  });

  // --- Handle Delete Product ---
  async function handleDeleteProduct(event) {
    const button = event.target;
    const productId = button.getAttribute("data-id");
    showResponseMessage(deleteResponseMessageDiv, "", "");

    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    const originalButtonText = button.textContent;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Deleting...';

    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.msg || `HTTP error! status: ${response.status}`);
      }

      showResponseMessage(deleteResponseMessageDiv, `Success: ${result.msg}`, "success");
      await fetchProducts();

    } catch (error) {
      console.error("Error deleting product:", error);
      showResponseMessage(deleteResponseMessageDiv, `Error: ${error.message}`, "error");
      button.disabled = false;
      button.innerHTML = originalButtonText;
    }
  }

  // --- Handle Mark Order as Delivered ---
  async function handleMarkDelivered(event) {
    const button = event.target;
    const orderId = button.getAttribute("data-id");

    if (!confirm("Mark this order as delivered?")) {
      return;
    }

    const originalButtonText = button.textContent;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Updating...';

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/deliver`, {
        method: "PATCH",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.msg || `HTTP error! status: ${response.status}`);
      }

      // Refresh orders list
      const activeFilter = document.querySelector(".order-filter-btn.bg-indigo-600").getAttribute("data-status");
      await fetchOrders(activeFilter);

    } catch (error) {
      console.error("Error marking order as delivered:", error);
      alert(`Error: ${error.message}`);
      button.disabled = false;
      button.innerHTML = originalButtonText;
    }
  }

  // --- Handle Delete Order ---
  async function handleDeleteOrder(event) {
    const button = event.target;
    const orderId = button.getAttribute("data-id");

    // Check if order is delivered
    const orderElement = button.closest(".order-item");
    const isDelivered = orderElement.querySelector(".bg-green-100") !== null;

    if (!isDelivered && !confirm("This order is not yet delivered. Are you sure you want to delete it?")) {
      return;
    }

    const originalButtonText = button.textContent;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Deleting...';

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.msg || `HTTP error! status: ${response.status}`);
      }

      // Refresh orders list
      const activeFilter = document.querySelector(".order-filter-btn.bg-indigo-600").getAttribute("data-status");
      await fetchOrders(activeFilter);

    } catch (error) {
      console.error("Error deleting order:", error);
      alert(`Error: ${error.message}`);
      button.disabled = false;
      button.innerHTML = originalButtonText;
    }
  }

  // --- Helper Functions ---
  function formatTagName(tag) {
    const names = {
      'new': 'New',
      'out-of-stock': 'Out of Stock',
      'coming-soon': 'Coming Soon',
      'sale': 'Sale'
    };
    return names[tag] || tag;
  }

  function showResponseMessage(element, message, type) {
    element.textContent = message;
    element.className = `p-3 rounded-md ${type === "success" 
      ? "bg-green-100 border border-green-400 text-green-700" 
      : "bg-red-100 border border-red-400 text-red-700"}`;
    element.classList.remove("hidden");

    // Hide message after 5 seconds
    setTimeout(() => {
      element.classList.add("hidden");
      element.textContent = "";
      element.className = "";
    }, 5000);
  }

  // --- Initial Load ---
  fetchProducts();
});

