document.addEventListener("DOMContentLoaded", function () {
  console.log("Bills page loaded");

  // Load bills from localStorage
  loadBillsHistory();

  // Set up event listeners
  document
    .getElementById("time-filter")
    .addEventListener("change", filterBills);
  document
    .getElementById("apply-date-filter")
    .addEventListener("click", filterBills);
  document
    .getElementById("select-all-bills")
    .addEventListener("change", toggleSelectAllBills);
  document
    .getElementById("download-selected-bills")
    .addEventListener("click", downloadSelectedBills);

  // Set default dates
  setDefaultDates();
});

// Set default dates (today's date for both start and end)
function setDefaultDates() {
  const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
  document.getElementById("start-date").value = today;
  document.getElementById("end-date").value = today;
}

// Load bills from localStorage and display them
function loadBillsHistory() {
  console.log("Loading bills history");
  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  console.log("Orders found in localStorage:", orders.length);

  if (orders.length === 0) {
    document.getElementById("no-bills-message").style.display = "block";
    document.querySelector(".bills-table").style.display = "none";
    updateSummary(0, 0);
    return;
  }

  // Sort orders by date (newest first)
  orders.sort((a, b) => {
    const dateA = convertDateStringToDate(a.date);
    const dateB = convertDateStringToDate(b.date);
    return dateB - dateA;
  });

  displayBills(orders);
}

// Convert date string format "DD/MM/YYYY HH:MM" to Date object
function convertDateStringToDate(dateString) {
  const [datePart, timePart] = dateString.split(" ");
  const [day, month, year] = datePart.split("/");
  const [hours, minutes] = timePart.split(":");
  return new Date(year, month - 1, day, hours, minutes);
}

// Display bills in the table - enhanced with debug info
function displayBills(bills) {
  const billsList = document.getElementById("bills-list");
  billsList.innerHTML = "";

  console.log(`Displaying ${bills.length} bills`);

  let totalAmount = 0;

  bills.forEach((bill) => {
    const row = document.createElement("tr");

    // Create bill items summary text
    const itemsSummary = bill.items
      .map((item) => `${item.quantity}x ${item.name}`)
      .join(", ");
    totalAmount += parseFloat(bill.total || 0);

    row.innerHTML = `
            <td><input type="checkbox" class="bill-checkbox" data-id="${
              bill.id
            }"></td>
            <td>${bill.id}</td>
            <td>${bill.date}</td>
            <td class="item-list" title="${itemsSummary}">${itemsSummary}</td>
            <td>₹${parseFloat(bill.total).toFixed(2)}</td>
            <td class="bill-actions">
                <button onclick="viewBill('${bill.id}')">View</button>
                <button onclick="downloadSingleBill('${
                  bill.id
                }')">Download</button>
            </td>
        `;

    billsList.appendChild(row);
  });

  // Update the summary
  updateSummary(bills.length, totalAmount);

  // Show table, hide message
  document.getElementById("no-bills-message").style.display = "none";
  document.querySelector(".bills-table").style.display = "table";

  // Setup checkbox change event
  setupCheckboxListeners();
}

// Set up event listeners for checkboxes
function setupCheckboxListeners() {
  document.querySelectorAll(".bill-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", updateDownloadButtonState);
  });
}

// Update the download button state based on selected checkboxes
function updateDownloadButtonState() {
  const checkboxes = document.querySelectorAll(".bill-checkbox:checked");
  const downloadButton = document.getElementById("download-selected-bills");

  if (checkboxes.length > 0) {
    downloadButton.removeAttribute("disabled");
  } else {
    downloadButton.setAttribute("disabled", true);
  }
}

// Toggle all bill checkboxes
function toggleSelectAllBills(e) {
  const checkboxes = document.querySelectorAll(".bill-checkbox");
  checkboxes.forEach((checkbox) => {
    checkbox.checked = e.target.checked;
  });

  updateDownloadButtonState();
}

// Update summary data
function updateSummary(totalOrders, totalAmount) {
  document.getElementById("total-orders").textContent = totalOrders;
  document.getElementById("total-amount").textContent = `₹${totalAmount.toFixed(
    2
  )}`;
}

// Filter bills based on selected time period or custom date range
function filterBills() {
  const timePeriod = document.getElementById("time-filter").value;
  const orders = JSON.parse(localStorage.getItem("orders")) || [];

  if (orders.length === 0) {
    return;
  }

  let filteredOrders = [];

  if (timePeriod === "all") {
    // Show all orders
    filteredOrders = orders;
  } else if (
    timePeriod === "daily" ||
    timePeriod === "weekly" ||
    timePeriod === "monthly"
  ) {
    // Filter by predefined time periods
    const today = new Date();

    filteredOrders = orders.filter((order) => {
      const orderDate = convertDateStringToDate(order.date);

      if (timePeriod === "daily") {
        // Orders from today
        return isSameDay(orderDate, today);
      } else if (timePeriod === "weekly") {
        // Orders from past week
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return orderDate >= weekAgo;
      } else if (timePeriod === "monthly") {
        // Orders from past month
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        return orderDate >= monthAgo;
      }
    });
  } else {
    // Custom date range
    const startDate = new Date(document.getElementById("start-date").value);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(document.getElementById("end-date").value);
    endDate.setHours(23, 59, 59, 999);

    filteredOrders = orders.filter((order) => {
      const orderDate = convertDateStringToDate(order.date);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }

  // Display filtered orders
  if (filteredOrders.length === 0) {
    document.getElementById("no-bills-message").style.display = "block";
    document.querySelector(".bills-table").style.display = "none";
    updateSummary(0, 0);
  } else {
    displayBills(filteredOrders);
  }
}

// Check if two dates are the same day
function isSameDay(date1, date2) {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

// View a single bill details
function viewBill(billId) {
  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  const bill = orders.find((order) => order.id === billId);

  if (!bill) return;

  // Create a modal to display bill details
  const modal = document.createElement("div");
  modal.classList.add("bill-modal");

  let itemsHtml = "";
  bill.items.forEach((item) => {
    itemsHtml += `
            <tr>
                <td>${item.name}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>₹${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `;
  });

  modal.innerHTML = `
        <div class="bill-modal-content">
            <span class="close-modal">&times;</span>
            <h2>Bill Details</h2>
            <div class="bill-details">
                <p><strong>Order ID:</strong> ${bill.id}</p>
                <p><strong>Date:</strong> ${bill.date}</p>
                
                <table class="bill-items-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                
                <div class="bill-summary">
                    <div><span>Subtotal:</span> <span>₹${bill.subtotal.toFixed(
                      2
                    )}</span></div>
                    <div><span>GST (10%):</span> <span>₹${bill.gst.toFixed(
                      2
                    )}</span></div>
                    <div><span>Discount:</span> <span>₹${bill.discount.toFixed(
                      2
                    )}</span></div>
                    <div class="grand-total"><span>Grand Total:</span> <span>₹${bill.total.toFixed(
                      2
                    )}</span></div>
                </div>
            </div>
            <div class="bill-actions modal-actions">
                <button onclick="downloadSingleBill('${
                  bill.id
                }')">Download Bill</button>
                <button class="close-button">Close</button>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  // Close modal events
  modal
    .querySelector(".close-modal")
    .addEventListener("click", () => modal.remove());
  modal
    .querySelector(".close-button")
    .addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });

  // Add styles for modal
  const style = document.createElement("style");
  style.textContent = `
        .bill-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .bill-modal-content {
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 90%;
            width: 600px;
            max-height: 90%;
            overflow-y: auto;
            position: relative;
        }
        
        .close-modal {
            position: absolute;
            right: 15px;
            top: 10px;
            font-size: 24px;
            cursor: pointer;
        }
        
        .bill-items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        .bill-items-table th, .bill-items-table td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        .bill-summary {
            margin-top: 15px;
            display: flex;
            flex-direction: column;
            gap: 5px;
            align-items: flex-end;
        }
        
        .bill-summary div {
            display: flex;
            gap: 15px;
        }
        
        .grand-total {
            font-weight: bold;
            color: var(--accent-color);
            margin-top: 5px;
            border-top: 1px solid #ddd;
            padding-top: 5px;
        }
        
        .modal-actions {
            margin-top: 20px;
            display: flex;
            justify-content: center;
            gap: 15px;
        }
    `;

  document.head.appendChild(style);
}

// Download a single bill
function downloadSingleBill(billId) {
  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  const bill = orders.find((order) => order.id === billId);

  if (!bill) return;

  generateExcelBill(bill);
}

// Download selected bills
function downloadSelectedBills() {
  const selectedBillIds = Array.from(
    document.querySelectorAll(".bill-checkbox:checked")
  ).map((checkbox) => checkbox.dataset.id);

  if (selectedBillIds.length === 0) return;

  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  const selectedBills = orders.filter((order) =>
    selectedBillIds.includes(order.id)
  );

  if (selectedBills.length === 1) {
    // Download single bill
    generateExcelBill(selectedBills[0]);
  } else {
    // Generate combined bill report
    generateCombinedBillReport(selectedBills);
  }
}

// Generate Excel-like HTML for a single bill
function generateExcelBill(bill) {
  let tableHtml = `
        <table>
            <tr>
                <th colspan="4">RESTAURANT BILL</th>
            </tr>
            <tr>
                <th>Order ID</th>
                <td colspan="3">${bill.id}</td>
            </tr>
            <tr>
                <th>Date</th>
                <td colspan="3">${bill.date}</td>
            </tr>
            <tr><td colspan="4"></td></tr>
            <tr>
                <th>Item</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
            </tr>
    `;

  bill.items.forEach((item) => {
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
            <td>₹${bill.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
            <th colspan="3">GST (10%)</th>
            <td>₹${bill.gst.toFixed(2)}</td>
        </tr>
        <tr>
            <th colspan="3">Discount</th>
            <td>₹${bill.discount.toFixed(2)}</td>
        </tr>
        <tr>
            <th colspan="3">Grand Total</th>
            <td>₹${bill.total.toFixed(2)}</td>
        </tr>
    </table>
    `;

  // Convert to blob and download
  const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `bill_${bill.id}.xls`;
  link.click();
}

// Generate combined bill report for multiple bills
function generateCombinedBillReport(bills) {
  // Sort bills by date
  bills.sort((a, b) => {
    const dateA = convertDateStringToDate(a.date);
    const dateB = convertDateStringToDate(b.date);
    return dateA - dateB;
  });

  // Get date range for filename
  const firstDate = convertDateStringToDate(bills[0].date);
  const lastDate = convertDateStringToDate(bills[bills.length - 1].date);
  const startDateStr = `${firstDate.getDate()}-${
    firstDate.getMonth() + 1
  }-${firstDate.getFullYear()}`;
  const endDateStr = `${lastDate.getDate()}-${
    lastDate.getMonth() + 1
  }-${lastDate.getFullYear()}`;

  // Calculate summary values
  let totalAmount = 0;
  let totalGST = 0;
  let totalDiscount = 0;
  let totalSubtotal = 0;

  // Generate the Excel table HTML
  let tableHtml = `
        <table>
            <tr>
                <th colspan="6">RESTAURANT BILLS REPORT</th>
            </tr>
            <tr>
                <th colspan="6">From ${startDateStr} to ${endDateStr}</th>
            </tr>
            <tr><td colspan="6"></td></tr>
            <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>GST</th>
                <th>Discount</th>
                <th>Total</th>
            </tr>
    `;

  bills.forEach((bill) => {
    // Update totals
    totalSubtotal += bill.subtotal;
    totalGST += bill.gst;
    totalDiscount += bill.discount;
    totalAmount += bill.total;

    // Create items summary
    const itemsSummary = bill.items
      .map((item) => `${item.quantity}x ${item.name}`)
      .join(", ");

    tableHtml += `
            <tr>
                <td>${bill.id}</td>
                <td>${bill.date}</td>
                <td>${itemsSummary}</td>
                <td>₹${bill.subtotal.toFixed(2)}</td>
                <td>₹${bill.gst.toFixed(2)}</td>
                <td>₹${bill.discount.toFixed(2)}</td>
                <td>₹${bill.total.toFixed(2)}</td>
            </tr>
        `;
  });

  // Add summary row
  tableHtml += `
        <tr><td colspan="7"></td></tr>
        <tr>
            <th colspan="3">TOTAL</th>
            <td>₹${totalSubtotal.toFixed(2)}</td>
            <td>₹${totalGST.toFixed(2)}</td>
            <td>₹${totalDiscount.toFixed(2)}</td>
            <td>₹${totalAmount.toFixed(2)}</td>
        </tr>
    </table>
    `;

  // Convert to blob and download
  const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `bills_report_${startDateStr}_to_${endDateStr}.xls`;
  link.click();
}
