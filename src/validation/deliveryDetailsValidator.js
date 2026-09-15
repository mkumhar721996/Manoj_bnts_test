function validate(payload) {
  const errors = [];
  const streetAddress =
    typeof payload.streetAddress === 'string' ? payload.streetAddress.trim() : '';
  const aptSuite = typeof payload.aptSuite === 'string' ? payload.aptSuite.trim() : '';
  const floor = typeof payload.floor === 'string' ? payload.floor.trim() : '';
  const deliveryInstructions =
    typeof payload.deliveryInstructions === 'string' ? payload.deliveryInstructions.trim() : '';
  const recipientName =
    typeof payload.recipientName === 'string' ? payload.recipientName.trim() : '';
  const city = typeof payload.city === 'string' ? payload.city.trim() : '';
  const state = typeof payload.state === 'string' ? payload.state.trim() : '';
  const postalCode = typeof payload.postalCode === 'string' ? payload.postalCode.trim() : '';
  const country = typeof payload.country === 'string' ? payload.country.trim() : '';

  if (!streetAddress) {
    errors.push('Street address is required.');
  }

  return {
    errors,
    streetAddress,
    aptSuite,
    floor,
    deliveryInstructions,
    recipientName,
    city,
    state,
    postalCode,
    country,
  };
}

module.exports = { validate };
