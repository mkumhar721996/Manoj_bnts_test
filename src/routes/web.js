const express = require('express');
const crypto = require('crypto');
const { renderHomePage } = require('../views/pages/homePage');
const { renderRegistrationSuccessPage } = require('../views/pages/registrationSuccessPage');
const { renderRegistrationErrorPage } = require('../views/pages/registrationErrorPage');
const { renderFeedPage } = require('../views/pages/feedPage');
const { renderLoginErrorPage } = require('../views/pages/loginErrorPage');
const { renderCartPage } = require('../views/pages/cartPage');
const { renderCheckoutPage } = require('../views/pages/checkoutPage');
const { renderExpensesPage } = require('../views/pages/expensesPage');
const { renderAddExpensePage } = require('../views/pages/addExpensePage');
const { renderEditExpensePage } = require('../views/pages/editExpensePage');
const { renderDeleteConfirmPage } = require('../views/pages/deleteConfirmPage');
const { renderGamePage } = require('../views/pages/gamePage');
const { validate } = require('../validation/webRegistrationValidator');
const { validate: validateDeliveryDetails } = require('../validation/deliveryDetailsValidator');
const { validate: validateExpense } = require('../validation/expenseValidator');
const userStore = require('../store/userStore');
const verificationTokenStore = require('../store/verificationTokenStore');
const expenseStore = require('../store/expenseStore');
const sessionStore = require('../store/sessionStore');
const emailService = require('../services/emailService');
const { hashPassword, verifyPassword } = require('../utils/password');
const requireGameSession = require('../middleware/requireGameSession');
const requireExpense = require('../middleware/requireExpense');

const router = express.Router();

// Fixed-cost stand-in for a real password hash, used to keep the scrypt
// comparison's timing identical whether or not the email is registered.
const DUMMY_HASH = hashPassword('not-a-real-password');

router.get('/', (req, res) => {
  res.type('html').send(renderHomePage());
});

router.post('/register', (req, res) => {
  const payload = req.body || {};
  const { errors, name, email, password } = validate(payload);

  if (errors.length === 0 && userStore.findByEmail(email)) {
    errors.push('This email is already registered.');
  }

  if (errors.length > 0) {
    return res.status(400).type('html').send(renderRegistrationErrorPage(errors, name, email));
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: hashPassword(password),
    // Not verified yet: only the real /verify-email link (verificationTokenStore
    // + emailService below) is allowed to prove ownership of this address. This
    // keeps website registrations from self-asserting `verified: true` into the
    // userStore that /api/login and requireVerifiedUser trust.
    verified: false,
  };
  userStore.save(user);

  const token = verificationTokenStore.create(user.email);
  emailService.sendVerificationEmail(user.email, token);

  return res.status(201).type('html').send(renderRegistrationSuccessPage(name, email));
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  const user =
    typeof email === 'string' ? userStore.findByEmail(email) : undefined;
  const passwordMatches = verifyPassword(
    typeof password === 'string' ? password : '',
    user ? user.passwordHash : DUMMY_HASH
  );

  // This website login intentionally does not gate on `user.verified`: AC5/AC6
  // for this story require immediate authentication on valid credentials, with
  // no email-verification step in the flow. This is safe because registration
  // above never self-asserts `verified: true`, so this divergence only grants
  // access to this same story's own feed page, not to /api/account or other
  // routes gated by requireVerifiedUser.

  if (!user || !passwordMatches) {
    return res.status(401).type('html').send(renderLoginErrorPage());
  }

  const sessionToken = sessionStore.create(user.id);
  res.cookie('sessionToken', sessionToken, { httpOnly: true });

  return res.status(200).type('html').send(renderFeedPage(user));
});

router.get('/cart', (req, res) => {
  res.type('html').send(renderCartPage());
});

router.post('/checkout', (req, res) => {
  const { errors, streetAddress, aptSuite, deliveryInstructions } = validateDeliveryDetails(
    req.body || {}
  );

  if (errors.length > 0) {
    return res
      .status(400)
      .type('html')
      .send(renderCartPage({ errors, values: { streetAddress, aptSuite, deliveryInstructions } }));
  }

  return res
    .status(200)
    .type('html')
    .send(renderCheckoutPage({ streetAddress, aptSuite, deliveryInstructions }));
});

router.get('/expenses', (req, res) => {
  res.type('html').send(
    renderExpensesPage({
      expenses: expenseStore.listForCurrentPeriod(),
      total: expenseStore.totalForCurrentPeriod(),
    })
  );
});

router.get('/expenses/new', (req, res) => {
  res.type('html').send(renderAddExpensePage());
});

router.post('/expenses', (req, res) => {
  const { errors, amount, category, date, merchant, note } = validateExpense(req.body || {});

  if (errors.length > 0) {
    return res
      .status(400)
      .type('html')
      .send(renderAddExpensePage({ errors, values: { amount, category, date, merchant, note } }));
  }

  expenseStore.save({ id: crypto.randomUUID(), amount, category, date, merchant, note });

  return res.status(200).type('html').send(
    renderExpensesPage({
      expenses: expenseStore.listForCurrentPeriod(),
      total: expenseStore.totalForCurrentPeriod(),
    })
  );
});

router.get('/expenses/:id/edit', requireExpense, (req, res) => {
  return res.type('html').send(renderEditExpensePage({ id: req.expense.id, values: req.expense }));
});

router.post('/expenses/:id', requireExpense, (req, res) => {
  const expense = req.expense;
  const { errors, amount, category, date, merchant, note } = validateExpense(req.body || {});

  if (errors.length > 0) {
    return res
      .status(400)
      .type('html')
      .send(
        renderEditExpensePage({
          id: expense.id,
          errors,
          values: { amount, category, date, merchant, note },
        })
      );
  }

  const changedFields = ['amount', 'category', 'date', 'merchant', 'note'].filter(
    (field) => expense[field] !== { amount, category, date, merchant, note }[field]
  );
  const startedAt = Date.now();
  console.info(`[expenses] update starting: id=${expense.id} changedFields=${changedFields.join(',') || 'none'}`);

  expenseStore.update(expense.id, { amount, category, date, merchant, note });

  console.info(`[expenses] update succeeded: id=${expense.id} durationMs=${Date.now() - startedAt}`);

  return res.status(200).type('html').send(
    renderExpensesPage({
      expenses: expenseStore.listForCurrentPeriod(),
      total: expenseStore.totalForCurrentPeriod(),
    })
  );
});

router.get('/expenses/:id/delete-confirm', requireExpense, (req, res) => {
  return res.type('html').send(renderDeleteConfirmPage({ expense: req.expense }));
});

router.post('/expenses/:id/delete', requireExpense, (req, res) => {
  const expense = req.expense;
  const startedAt = Date.now();
  console.info(
    `[expenses] delete starting: id=${expense.id} amount=${expense.amount} category=${expense.category} date=${expense.date} merchant=${expense.merchant || ''} note=${expense.note || ''}`
  );

  expenseStore.remove(expense.id);

  console.info(`[expenses] delete succeeded: id=${expense.id} durationMs=${Date.now() - startedAt}`);

  return res.status(200).type('html').send(
    renderExpensesPage({
      expenses: expenseStore.listForCurrentPeriod(),
      total: expenseStore.totalForCurrentPeriod(),
    })
  );
});

router.get('/game', requireGameSession, (req, res) => {
  res.type('html').send(renderGamePage());
});

module.exports = router;
