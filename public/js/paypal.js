window.paypal
  .Buttons({
    style: { shape: "rect", layout: "vertical", color: "gold", label: "paypal" },

    async createOrder() {
      let cartProducts = JSON.parse(document.getElementById("cartProducts").value);
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: cartProducts }),
      });

      const orderData = await response.json();
      if (orderData.id) return orderData.id;
      throw new Error(orderData.message);
    },

    async onApprove(data) {
      const response = await fetch(`/api/orders/${data.orderID}/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const orderData = await response.json();
      if (orderData.status === "COMPLETED") {
        // Send PayPal details to checkout
        await fetch("/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethod: "PayPal",
            orderId: orderData.id,
            transactionId: orderData.purchase_units[0].payments.captures[0].id,
          }),
        });

        // Redirect to the invoice page
        window.location.href = `/invoice/${orderData.purchase_units[0].payments.captures[0].id}`;
      } else {
        alert("Payment failed, please try again.");
      }
    },
  })
  .render("#paypal-button-container");
