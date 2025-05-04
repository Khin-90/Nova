document.addEventListener("DOMContentLoaded", () => {
  const addProductForm = document.getElementById("add-product-form");
  const productListDiv = document.getElementById("product-list");
  const addResponseMessageDiv = document.getElementById("add-response-message");
  const deleteResponseMessageDiv = document.getElementById("delete-response-message");

  // --- Fetch and Display Products ---
  async function fetchProducts() {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const products = await response.json();
      displayProducts(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      productListDiv.innerHTML = 
        `<p class="text-red-600">Error loading products: ${error.message}</p>`;
    }
  }

  function displayProducts(products) {
    productListDiv.innerHTML = ""; // Clear previous list or loading message
    if (products.length === 0) {
      productListDiv.innerHTML = "<p>No products found.</p>";
      return;
    }

    products.forEach(product => {
      const productElement = document.createElement("div");
      productElement.className = 
        "product-item flex items-center justify-between p-4 border rounded mb-2 bg-gray-50";
      productElement.innerHTML = `
        <div class="flex items-center space-x-4">
          <img src="${product.image}" alt="${product.name}" class="w-16 h-16 object-cover rounded">
          <div>
            <h3 class="font-semibold">${product.name}</h3>
            <p class="text-sm text-gray-600">${product.category} - $${product.price.toFixed(2)}</p>
          </div>
        </div>
        <button data-id="${product.id}" class="delete-product-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm">Delete</button>
      `;
      productListDiv.appendChild(productElement);
    });

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
    submitButton.disabled = true;
    submitButton.textContent = "Adding...";

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        body: formData, // FormData handles multipart/form-data header
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.msg || `HTTP error! status: ${response.status}`);
      }

      showResponseMessage(addResponseMessageDiv, `Success: ${result.name} added.`, "success");
      addProductForm.reset();
      fetchProducts(); // Refresh the product list

    } catch (error) {
      console.error("Error adding product:", error);
      showResponseMessage(addResponseMessageDiv, `Error: ${error.message}`, "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Add Product";
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

    button.disabled = true;
    button.textContent = "Deleting...";

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.msg || `HTTP error! status: ${response.status}`);
      }

      showResponseMessage(deleteResponseMessageDiv, `Success: ${result.msg}`, "success");
      fetchProducts(); // Refresh the product list

    } catch (error) {
      console.error("Error deleting product:", error);
      showResponseMessage(deleteResponseMessageDiv, `Error: ${error.message}`, "error");
      button.disabled = false; // Re-enable button only on error
      button.textContent = "Delete";
    }
  }

  // --- Helper to show response messages ---
  function showResponseMessage(element, message, type) {
    element.textContent = message;
    element.className = type; // 'success' or 'error'
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
