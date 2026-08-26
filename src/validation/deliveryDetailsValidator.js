function validate(payload) {
  const errors = [];
  const streetAddress =
    typeof payload.streetAddress === 'string' ? payload.streetAddress.trim() : '';
  const aptSuite = typeof payload.aptSuite === 'string' ? payload.aptSuite.trim() : '';
  const deliveryInstructions =
    typeof payload.deliveryInstructions === 'string' ? payload.deliveryInstructions.trim() : '';

  if (!streetAddress) {
    errors.push('Street address is required.');
  }

  return { errors, streetAddress, aptSuite, deliveryInstructions };
}

module.exports = { validate };
