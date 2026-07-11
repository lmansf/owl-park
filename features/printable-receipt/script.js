let buttonEl = null;

function printReceipt() {
  const orderId = document.getElementById("order-id")?.textContent || "";
  const summaryHtml = document.getElementById("order-summary")?.innerHTML || "";

  const receiptHtml = `<!DOCTYPE html>
<html>
<head>
<title>Critter Cove Receipt</title>
<style>
  body { font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 2rem; color: #1e2a2b; }
  h1 { color: #0a4d55; margin-bottom: 0.2rem; }
  .order-id { color: #6b7677; margin-bottom: 1.2rem; }
  .modal-summary-line { display: flex; justify-content: space-between; padding: 0.2rem 0; }
</style>
</head>
<body>
  <h1>🐾 Critter Cove Shop</h1>
  <div class="order-id">${orderId}</div>
  ${summaryHtml}
  <p>Thank you for supporting Critter Cove!</p>
</body>
</html>`;

  const receiptWindow = window.open("", "_blank");
  if (receiptWindow) {
    receiptWindow.document.write(receiptHtml);
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
  } else {
    window.print();
  }
}

export function activate() {
  const closeBtn = document.getElementById("close-modal-btn");
  if (!closeBtn || !closeBtn.parentElement) return;

  buttonEl = document.createElement("button");
  buttonEl.type = "button";
  buttonEl.className = "pr-print-btn";
  buttonEl.setAttribute("data-feature", "printable-receipt");
  buttonEl.textContent = "🖨️ Print Receipt";
  buttonEl.addEventListener("click", printReceipt);

  closeBtn.parentElement.insertBefore(buttonEl, closeBtn);
}

export function deactivate() {
  if (buttonEl) {
    buttonEl.remove();
    buttonEl = null;
  }
}
