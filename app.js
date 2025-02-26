// Food items database
const foodItems = [
  {
    id: 1,
    name: "Chicken Rice",
    price: 220,
    description: "Delicious chicken with fragrant rice",
    imgPath: "/image/1.PNG",
    category: "Main Course",
  },
  {
    id: 2,
    name: "Burger",
    price: 180,
    description: "Juicy beef patty with fresh vegetables",
    imgPath: "/image/2.PNG",
    category: "Snacks",
  },
  {
    id: 3,
    name: "Soup",
    price: 120,
    description: "Hot and creamy vegetable soup",
    imgPath: "/image/3.PNG",
    category: "Main Course",
  },
  {
    id: 4,
    name: "Noodles",
    price: 150,
    description: "Stir-fried noodles with vegetables",
    imgPath: "/image/4.PNG",
    category: "Main Course",
  },
  {
    id: 5,
    name: "Pizza",
    price: 280,
    description: "Cheese pizza with various toppings",
    imgPath: "/image/5.PNG",
    category: "Snacks",
  },
  {
    id: 6,
    name: "Ice Tea",
    price: 80,
    description: "Refreshing tea with ice",
    imgPath: "/image/6.PNG",
    category: "Drinks",
  },
  {
    id: 7,
    name: "Coffee",
    price: 90,
    description: "Hot aromatic coffee",
    imgPath: "/image/1.PNG",
    category: "Tea",
  },
];

// Cart functionality
let cart = [];
const GST_RATE = 0.1; // 10% GST
const DISCOUNT_RATE = 0.05; // 5% discount on orders above 500

// DOM elements
document.addEventListener("DOMContentLoaded", function () {
  // Initialize page
  loadFoodItems();
  setupCategoryFilters();
  loadCartFromStorage();
  updateCartDisplay();
  setupCartToggle();

  // Event listeners for "Add to Cart" buttons will be added dynamically when loading food items
});

// Load food items into the card container
function loadFoodItems(category = null) {
  const cardContainer = document.querySelector(".card-container");
  cardContainer.innerHTML = "";
  // Filter items by category if specified
  const items = category
    ? foodItems.filter((item) => item.category === category)
    : foodItems;
  items.forEach((item) => {
    const card = createFoodCard(item);
    cardContainer.appendChild(card);
  });
}

// Create food card element
function createFoodCard(item) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.innerHTML = `
        <div class="card-img-container">
            <img loading="lazy" src="${item.imgPath}" alt="${item.name} image">
        </div>
        <div class="card-content-container">
            <h1>${item.name}</h1>
            <p class="price">Price : ${item.price}₹</p>
            <p>${item.description}</p>
            <div class="btn">
                <button data-id="${item.id}" class="add-to-cart-btn">Add To Cart</button>
            </div>
        </div>
    `;
  // Add event listener to "Add to Cart" button
  card.querySelector(".add-to-cart-btn").addEventListener("click", function () {
    addToCart(item.id);
  });
  return card;
}

// Setup category filters
function setupCategoryFilters() {
  const categoryItems = document.querySelectorAll(".food-types li");
  categoryItems.forEach((item) => {
    item.addEventListener("click", function () {
      // Remove active class from all categories
      categoryItems.forEach((cat) => cat.classList.remove("active"));
      // Add active class to clicked category
      this.classList.add("active");
      // Get category text and filter food items
      const category = this.textContent.trim();
      if (category === "All Items") {
        loadFoodItems();
      } else {
        loadFoodItems(category);
      }
    });
  });
}

// Add item to cart - modified to not auto-show cart on mobile
function addToCart(itemId) {
  const item = foodItems.find((item) => item.id === itemId);
  if (!item) return;

  // Check if item already in cart
  const existingItem = cart.find((cartItem) => cartItem.id === itemId);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      imgPath: item.imgPath,
      quantity: 1,
    });
  }

  // Update cart display and save to storage
  updateCartDisplay();
  saveCartToStorage();

  // Show notification
  showNotification(`Added ${item.name} to cart`);

  // Only auto-show cart on desktop screens (not on mobile)
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const rightSection = document.querySelector(".right-section");

  if (!isMobile && rightSection.classList.contains("hidden")) {
    document.querySelector("main").style.gridTemplateColumns = "20% 60% 20%";
    rightSection.classList.remove("hidden");
    localStorage.setItem("cartVisible", "true");
  }
}

// Update quantity of item in cart
function updateCartQuantity(itemId, change) {
  const cartItem = cart.find((item) => item.id === itemId);
  if (!cartItem) return;
  cartItem.quantity += change;
  // Remove item if quantity becomes 0
  if (cartItem.quantity <= 0) {
    cart = cart.filter((item) => item.id !== itemId);
  }
  // Update cart display and save to storage
  updateCartDisplay();
  saveCartToStorage();
}

// Update cart display (modified to update cart count)
function updateCartDisplay() {
  const cartItemsContainer = document.querySelector(".cart-items");
  cartItemsContainer.innerHTML = "";
  // Update cart count indicator
  updateCartCountIndicator();

  if (cart.length === 0) {
    cartItemsContainer.innerHTML =
      '<p class="empty-cart-message">Your cart is empty</p>';
    updateBillDetails(0, 0, 0, 0);
    return;
  }

  // Calculate bill details
  let subtotal = 0;

  // Add cart items to display
  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    const cartItemElement = document.createElement("div");
    cartItemElement.classList.add("cart-card");

    cartItemElement.innerHTML = `
            <img loading="lazy" src="${item.imgPath}" alt="${item.name} image" class="cart-card-img">
            <div class="cart-card-details">
                <span class="cart-food-name">${item.name}</span>
                <div class="details-bottom">
                    <span class="cart-food-price">₹${item.price}</span>
                    <div class="cart-card-qty">
                        <button class="minus-btn" data-id="${item.id}">-</button>
                        <span class="qty">${item.quantity}</span>
                        <button class="plus-btn" data-id="${item.id}">+</button>
                    </div>
                </div>
            </div>
        `;
    cartItemsContainer.appendChild(cartItemElement);
  });

  // Add event listeners for quantity buttons
  document.querySelectorAll(".minus-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      updateCartQuantity(parseInt(this.dataset.id), -1);
    });
  });

  document.querySelectorAll(".plus-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      updateCartQuantity(parseInt(this.dataset.id), 1);
    });
  });

  // Calculate tax, discount, and grand total
  const gst = subtotal * GST_RATE;
  const discount = subtotal > 500 ? subtotal * DISCOUNT_RATE : 0; // Apply discount if subtotal > 500
  const grandTotal = subtotal + gst - discount;
  // Update bill details
  updateBillDetails(subtotal, gst, discount, grandTotal);
  // Setup Pay Now button
  setupPayNowButton(grandTotal);
}

// Update cart count indicator in navbar
function updateCartCountIndicator() {
  const cartToggleBtn = document.querySelector(".cart-toggle");

  if (cart.length > 0) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartToggleBtn.setAttribute("data-count", totalItems);
    cartToggleBtn.classList.add("has-items");
  } else {
    cartToggleBtn.removeAttribute("data-count");
    cartToggleBtn.classList.remove("has-items");
  }
}

// Update bill details
function updateBillDetails(subtotal, gst, discount, grandTotal) {
  document.querySelector(
    ".price-details .detail:nth-child(1) .bill-price"
  ).textContent = `₹${subtotal.toFixed(2)}`;
  document.querySelector(
    ".price-details .detail:nth-child(2) .bill-price"
  ).textContent = `₹${gst.toFixed(2)}`;
  document.querySelector(
    ".price-details .detail:nth-child(3) .bill-price"
  ).textContent = `-₹${discount.toFixed(2)}`;
  document.querySelector(
    ".price-details .grand-total .bill-price"
  ).textContent = `₹${grandTotal.toFixed(2)}`;
}

// Setup Pay Now button
function setupPayNowButton(grandTotal) {
  const payNowBtn = document.querySelector(".pay-now");
  payNowBtn.addEventListener("click", function () {
    if (cart.length === 0) {
      showNotification("Your cart is empty. Add items to proceed.");
      return;
    }
    showPaymentScreen(grandTotal);
  });
}

// Show payment screen with skeleton loading and event delegation for buttons
function showPaymentScreen(amount) {
  // Create payment screen overlay
  const paymentScreen = document.createElement("div");
  paymentScreen.classList.add("payment-screen");
  paymentScreen.id = "payment-screen";

  // First show skeleton loading animation - improved size and structure
  paymentScreen.innerHTML = `
    <div class="payment-container skeleton-container">
      <div class="skeleton-header"></div>
      <div class="skeleton-content">
        <div class="skeleton-left">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-items">
            <div class="skeleton-item-header"></div>
            <div class="skeleton-item"></div>
            <div class="skeleton-item"></div>
            <div class="skeleton-item"></div>
          </div>
          <div class="skeleton-line wide"></div>
        </div>
        <div class="skeleton-right">
          <div class="skeleton-qr"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line small"></div>
        </div>
      </div>
      <div class="skeleton-buttons">
        <div class="skeleton-button"></div>
        <div class="skeleton-button"></div>
      </div>
    </div>
  `;

  document.body.appendChild(paymentScreen);

  // Generate order details
  const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const date = new Date();
  const formattedDate = `${date.getDate()}/${
    date.getMonth() + 1
  }/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
  const upiPaymentUrl = `upi://pay?pa=8178589874@fam&pn=suraj moriya&am=${amount.toFixed(
    2
  )}`;

  // Use setTimeout to simulate loading and ensure DOM operations complete
  setTimeout(() => {
    // Replace skeleton with actual payment screen
    paymentScreen.innerHTML = `
      <div class="payment-container" id="payment-content">
          <h2>Order Summary</h2>
          <div class="order-details">
              <div class="order-left">
                  <p><strong>Order ID:</strong> ${orderId}</p>
                  <p><strong>Date:</strong> ${formattedDate}</p>
                  <div class="order-items">
                      <h3>Items:</h3>
                      <ul>
                          ${cart
                            .map(
                              (item) =>
                                `<li>${item.quantity}x ${item.name} - ₹${(
                                  item.price * item.quantity
                                ).toFixed(2)}</li>`
                            )
                            .join("")}
                      </ul>
                  </div>
                  <p><strong>Grand Total:</strong> ₹${amount.toFixed(2)}</p>
              </div>
              <div class="order-right">
                  <div class="qr-code">
                      <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
                        upiPaymentUrl
                      )}&size=200x200" alt="Payment QR Code">
                  </div>
                  <p>Scan to pay ₹${amount.toFixed(2)}</p>
                  <small>UPI ID: 8178589874@fam</small>
              </div>
          </div>
          <div class="payment-buttons">
              <button id="complete-payment" class="action-button">Complete Payment</button>
              <button id="cancel-payment" class="action-button">Cancel</button>
          </div>
      </div>
    `;

    // Use event delegation for button clicks instead of direct event binding
    // This is more reliable as it works even if the DOM updates
    document.addEventListener("click", handlePaymentButtonClick);
  }, 1200); // Increased delay for better visual effect of skeleton
}

// Handle payment button clicks using event delegation
function handlePaymentButtonClick(event) {
  const target = event.target;

  // Handle cancel button
  if (target.id === "cancel-payment") {
    const paymentScreen = document.getElementById("payment-screen");
    if (paymentScreen) {
      document.removeEventListener("click", handlePaymentButtonClick);
      paymentScreen.remove();
    }
  }

  // Handle complete payment button
  else if (target.id === "complete-payment") {
    const paymentScreen = document.getElementById("payment-screen");
    if (paymentScreen) {
      // Extract data from the current payment screen
      const contentDiv = document.getElementById("payment-content");
      const orderIdElement = contentDiv.querySelector(
        ".order-left p:first-child"
      );
      const orderId = orderIdElement
        ? orderIdElement.textContent.split(":")[1].trim()
        : `ORD-${Date.now()}`;
      const dateElement = contentDiv.querySelector(
        ".order-left p:nth-child(2)"
      );
      const formattedDate = dateElement
        ? dateElement.textContent.split(":")[1].trim()
        : new Date().toLocaleString();
      const amountElement = contentDiv.querySelector(
        ".order-left p:last-child"
      );
      const amount = amountElement
        ? parseFloat(amountElement.textContent.split("₹")[1])
        : cart.reduce((total, item) => total + item.price * item.quantity, 0) *
          1.1;

      // Show skeleton loading for processing with improved styling
      paymentScreen.innerHTML = `
        <div class="payment-container skeleton-container">
          <div class="skeleton-processing">
            <div class="processing-spinner"></div>
            <div class="skeleton-line wide"></div>
          </div>
        </div>
      `;

      // Process payment
      const savedSuccessfully = saveOrderToStorage(
        orderId,
        formattedDate,
        amount
      );

      // Add extra delay for visual feedback
      setTimeout(() => {
        if (savedSuccessfully) {
          // Show success message with new buttons and centered styling
          paymentScreen.innerHTML = `
            <div class="payment-container" id="success-content">
              <h2>Payment Successful!</h2>
              <div class="success-icon">
                <img src="image/succesful.gif" alt="Success" class="success-gif">
              </div>
              <p>Your order has been placed successfully.</p>
              <p>Order ID: ${orderId}</p>
              <div class="payment-buttons">
                <button id="download-bill" class="action-button">Download Bill</button>
                <button id="view-bills" class="action-button">View All Bills</button>
                <button id="close-payment" class="action-button">Close</button>
              </div>
            </div>
          `;

          // Update event handler for success screen
          document.removeEventListener("click", handlePaymentButtonClick);
          document.addEventListener("click", handleSuccessButtonClick);
        } else {
          // Show error message with improved styling
          paymentScreen.innerHTML = `
            <div class="payment-container" id="error-content">
              <h2>Payment Failed</h2>
              <div class="error-icon">✗</div>
              <p>There was a problem processing your payment.</p>
              <div class="payment-buttons">
                <button id="try-again" class="action-button">Try Again</button>
                <button id="close-payment" class="action-button">Close</button>
              </div>
            </div>
          `;

          // Update event handler for error screen
          document.removeEventListener("click", handlePaymentButtonClick);
          document.addEventListener("click", handleErrorButtonClick);
        }
      }, 1000);
    }
  }
}

// Handle success screen button clicks
function handleSuccessButtonClick(event) {
  const target = event.target;
  const paymentScreen = document.getElementById("payment-screen");

  if (target.id === "download-bill") {
    // Extract order ID from the success screen
    const orderIdElement = document.querySelector(
      "#success-content p:nth-child(3)"
    );
    const orderId = orderIdElement
      ? orderIdElement.textContent.split(":")[1].trim()
      : "";
    if (orderId) {
      downloadBill(orderId);
    }
  } else if (target.id === "view-bills") {
    window.location.href = "bills.html";
  } else if (target.id === "close-payment") {
    if (paymentScreen) {
      document.removeEventListener("click", handleSuccessButtonClick);
      paymentScreen.remove();
      // Clear cart after successful payment
      cart = [];
      saveCartToStorage();
      updateCartDisplay();
    }
  }
}

// Handle error screen button clicks
function handleErrorButtonClick(event) {
  const target = event.target;
  const paymentScreen = document.getElementById("payment-screen");

  if (target.id === "try-again") {
    document.removeEventListener("click", handleErrorButtonClick);
    if (paymentScreen) paymentScreen.remove();

    // Calculate total again
    const subtotal = cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const gst = subtotal * GST_RATE;
    const discount = subtotal > 500 ? subtotal * DISCOUNT_RATE : 0;
    const grandTotal = subtotal + gst - discount;

    // Try payment process again
    showPaymentScreen(grandTotal);
  } else if (target.id === "close-payment") {
    document.removeEventListener("click", handleErrorButtonClick);
    if (paymentScreen) paymentScreen.remove();
  }
}

// Save order to storage
function saveOrderToStorage(orderId, date, amount) {
  try {
    // Calculate bill details
    const subtotal = cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const gst = subtotal * GST_RATE;
    const discount = subtotal > 500 ? subtotal * DISCOUNT_RATE : 0;

    // Get existing orders or initialize empty array
    let orders = JSON.parse(localStorage.getItem("orders")) || [];

    // Add new order
    const newOrder = {
      id: orderId,
      date: date,
      items: cart.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal: subtotal,
      gst: gst,
      discount: discount,
      total: amount,
    };
    orders.push(newOrder);

    // Save to localStorage
    localStorage.setItem("orders", JSON.stringify(orders));
    console.log("Order saved successfully:", newOrder);
    return true;
  } catch (error) {
    console.error("Error saving order:", error);
    return false;
  }
}

// Download bill as XLS
function downloadBill(orderId) {
  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  const order = orders.find((order) => order.id === orderId);

  if (!order) return;

  // Create table HTML for Excel
  let tableHtml = `
        <table>
            <tr>
                <th colspan="4">RESTAURANT BILL</th>
            </tr>
            <tr>
                <th>Order ID</th>
                <td colspan="3">${order.id}</td>
            </tr>
            <tr>
                <th>Date</th>
                <td colspan="3">${order.date}</td>
            </tr>
            <tr><td colspan="4"></td></tr>
            <tr>
                <th>Item</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
            </tr>
    `;

  order.items.forEach((item) => {
    tableHtml += `
            <tr>
                <td>${item.name}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>₹${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `;
  });

  tableHtml += `
        <tr><td colspan="4"></td></tr>
        <tr>
            <th colspan="3">Subtotal</th>
            <td>₹${order.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
            <th colspan="3">GST (10%)</th>
            <td>₹${order.gst.toFixed(2)}</td>
        </tr>
        <tr>
            <th colspan="3">Discount</th>
            <td>₹${order.discount.toFixed(2)}</td>
        </tr>
        <tr>
            <th colspan="3">Grand Total</th>
            <td>₹${order.total.toFixed(2)}</td>
        </tr>
    </table>
    `;

  // Convert to blob and download
  const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `bill_${orderId}.xls`;
  link.click();
}

// Save cart to local storage
function saveCartToStorage() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Load cart from local storage
function loadCartFromStorage() {
  const savedCart = localStorage.getItem("cart");
  if (savedCart) {
    cart = JSON.parse(savedCart);
  }
}

// Show notification
function showNotification(message) {
  const notification = document.createElement("div");
  notification.classList.add("notification");
  notification.textContent = message;
  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.add("hide");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Setup cart toggle functionality - improved for mobile
function setupCartToggle() {
  const cartToggleBtn = document.querySelector(".cart-toggle");
  const mainElement = document.querySelector("main");
  const rightSection = document.querySelector(".right-section");
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  // Create backdrop for mobile
  if (isMobile) {
    // Check if backdrop already exists
    let backdrop = document.querySelector(".cart-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.classList.add("cart-backdrop");
      document.body.appendChild(backdrop);
    }

    // Check if close button already exists
    let closeBtn = rightSection.querySelector(".close-cart-btn");
    if (!closeBtn) {
      closeBtn = document.createElement("button");
      closeBtn.classList.add("close-cart-btn");
      closeBtn.innerHTML = "×";
      closeBtn.addEventListener("click", function () {
        hideCart();
      });
      rightSection.appendChild(closeBtn);
    }

    // Add click event to backdrop
    backdrop.addEventListener("click", function () {
      hideCart();
    });
  }

  // Check saved state and apply initially
  const cartVisible = localStorage.getItem("cartVisible") !== "false"; // Default to visible
  if (!cartVisible) {
    hideCart();
  }

  // Set up toggle event
  cartToggleBtn.addEventListener("click", function (e) {
    e.preventDefault(); // Prevent default anchor behavior

    const isCurrentlyVisible =
      rightSection.classList.contains("hidden") === false;

    if (isCurrentlyVisible) {
      hideCart();
    } else {
      showCart();
    }
  });

  // Function to show cart
  function showCart() {
    if (isMobile) {
      rightSection.classList.remove("hidden");
      document.querySelector(".cart-backdrop").classList.add("visible");
      document.body.style.overflow = "hidden"; // Prevent scrolling behind modal
    } else {
      mainElement.style.gridTemplateColumns = "20% 60% 20%";
      rightSection.classList.remove("hidden");
    }
    localStorage.setItem("cartVisible", "true");
  }

  // Function to hide cart
  function hideCart() {
    if (isMobile) {
      rightSection.classList.add("hidden");
      document.querySelector(".cart-backdrop").classList.remove("visible");
      document.body.style.overflow = ""; // Restore scrolling
    } else {
      mainElement.style.gridTemplateColumns = "20% 80% 0%";
      rightSection.classList.add("hidden");
    }
    localStorage.setItem("cartVisible", "false");
  }
}
