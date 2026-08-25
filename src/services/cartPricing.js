const OVEN_SURCHARGE_CENTS = 150;
const TAX_RATE = 0.085;
const DELIVERY_FEE_CENTS = 0;

function computeSummary(items) {
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0
  );
  const surchargeCents = OVEN_SURCHARGE_CENTS;
  const taxCents = Math.round((subtotalCents + surchargeCents) * TAX_RATE);
  const totalCents = subtotalCents + DELIVERY_FEE_CENTS + surchargeCents + taxCents;

  return {
    subtotalCents,
    deliveryFeeCents: DELIVERY_FEE_CENTS,
    surchargeCents,
    taxCents,
    totalCents,
  };
}

module.exports = { computeSummary };
