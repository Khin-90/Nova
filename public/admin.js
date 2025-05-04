document.addEventListener("DOMContentLoaded", () => {
  const addProductForm = document.getElementById("add-product-form");
  const productListDiv = document.getElementById("product-list");
  const addResponseMessageDiv = document.getElementById("add-response-message");
  const deleteResponseMessageDiv = document.getElementById("delete-response-message");

  // --- Fetch and Display Products ---
  async function fetchProducts() {
    try {
      productListDiv.innerHTML = '<div class="text-center py-4">Loading products...</div>';
      
      const response = await fetch("https://novawear.onrender.com/api/products");
      
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
    productListDiv.innerHTML = ""; // Clear previous list or loading message
    
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
      productElement.className = 
        "product-item flex items-center justify-between p-4 border rounded-lg mb-2 bg-white hover:bg-gray-50 transition-colors";
      productElement.innerHTML = `
        <div class="flex items-center space-x-4">
          <img src="${product.image}" alt="${product.name}" 
               class="w-16 h-16 object-cover rounded border">
          <div>
            <h3 class="font-semibold">${product.name}</h3>
            <p class="text-sm text-gray-600">${product.category} - $${product.price.toFixed(2)}</p>
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

  // --- Handle Add Product Form Submission ---
  addProductForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showResponseMessage(addResponseMessageDiv, "", ""); // Clear previous message

    const formData = new FormData(addProductForm);
    const submitButton = addProductForm.querySelector("button[type='submit']");
    const originalButtonText = submitButton.textContent;
    
    submitButton.disabled = true;
    submitButton.textContent = "Adding...";
    submitButton.classList.add("opacity-75");

    try {
      const response = await fetch("https://novawear.onrender.com/api/products", {
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
      submitButton.textContent = originalButtonText;
      submitButton.classList.remove("opacity-75");
    }
  });

  // --- Handle Delete Product ---
  async function handleDeleteProduct(event) {
    const button = event.target;
    const productId = button.getAttribute("data-id");
    showResponseMessage(deleteResponseMessageDiv, "", ""); // Clear previous message

    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    const originalButtonText = button.textContent;
    button.disabled = true;
    button.textContent = "Deleting...";
    button.classList.add("opacity-75");

    try {
      const response = await fetch(`https://novawear.onrender.com/api/products/${productId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.msg || `HTTP error! status: ${response.status}`);
      }

      showResponseMessage(deleteResponseMessageDiv, `Success: ${result.msg}`, "success");
      await fetchProducts(); // Refresh the product list

    } catch (error) {
      console.error("Error deleting product:", error);
      showResponseMessage(deleteResponseMessageDiv, `Error: ${error.message}`, "error");
      button.disabled = false;
      button.textContent = originalButtonText;
      button.classList.remove("opacity-75");
    }
  }

  // --- Helper to show response messages ---
  function showResponseMessage(element, message, type) {
    element.textContent = message;
    element.className = `p-3 rounded-md mb-4 ${type === "success" 
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