// Checkout controller for generated landing pages. Copied into every site by scripts/generate.mjs.
//
// Same flow as gitops-static (sites/confined-space.com/js/checkout.js):
//   1. Stripe.js tokenizes the card (createPaymentMethod). If that fails, the hazwoper API is never called.
//   2. POST {API_BASE_URL}/add_new_user creates or finds the buyer's LMS account.
//   3. POST {API_BASE_URL}/add_order places the order for the selected course(s). hazwoper-osha.com prices it,
//      creates the PaymentIntent and returns its clientSecret; the LMS enrolls the buyer.
//   4. stripe.confirmCardPayment(clientSecret) completes the payment, then the confirmation view is shown.
// The only differences: several courses can be bought in one order (a bundle), seats are chosen on the page,
// and Stripe.js loads once the buyer starts on the form (or the card field nears the screen) instead of with the page.
// Globals come from js/config.js: STRIPE_PUBLISHABLE_KEY, API_BASE_URL, ORDER_FROM, courses, tierForSeats,
// tierPrice, formatMoney.
document.addEventListener('DOMContentLoaded', function () {
  var stripeCheckoutForm = /** @type {HTMLFormElement} */ (document.getElementById('stripeCheckoutForm'));
  if (!stripeCheckoutForm) return;

  var apiBaseUrl = API_BASE_URL;
  var activeStripeKey = STRIPE_PUBLISHABLE_KEY;

  var stripe = null;
  var cardElement = null;

  var submitPaymentBtn = /** @type {HTMLButtonElement} */ (document.getElementById('submitPaymentBtn'));
  var paymentErrorAlert = document.getElementById('payment-error');
  var checkoutSuccessView = document.getElementById('checkoutSuccessView');
  var seatsInput = /** @type {HTMLInputElement} */ (document.getElementById('seatsInput'));
  var phoneInput = /** @type {HTMLInputElement} */ (document.getElementById('billingPhone'));
  var phoneErrorEl = document.getElementById('phone-error');

  // Helper to safely format string error messages (prevents [object Object])
  var getErrorMessage = function (err) {
    if (!err) return 'Payment failed. Please check your card details and try again.';
    if (typeof err === 'string') return err;
    if (err.message && typeof err.message === 'string') return err.message;
    if (err.error && typeof err.error === 'string') return err.error;
    if (err.error && err.error.message && typeof err.error.message === 'string') return err.error.message;
    try {
      return JSON.stringify(err);
    } catch {
      return 'An unexpected error occurred during payment processing.';
    }
  };

  var showError = function (message) {
    if (!paymentErrorAlert) return;
    paymentErrorAlert.textContent = message;
    paymentErrorAlert.hidden = false;
    paymentErrorAlert.focus();
  };

  // ?course=123 picks one course; ?course=123,137 (or repeated ?course=) picks a bundle; ?seats=5 presets seats.
  var urlParams = new URLSearchParams(window.location.search);
  var requestedIds = urlParams.getAll('course').join(',').split(',').map(function (id) { return id.trim(); }).filter(Boolean);
  var selectedCourses = courses.filter(function (c) { return requestedIds.indexOf(String(c.id)) !== -1; });
  // A course id this site doesn't sell (e.g. a link meant for another site) must never fall back to another course.
  if (requestedIds.length && selectedCourses.length !== requestedIds.length) {
    var unavailable = document.getElementById('checkout-unavailable');
    var layout = /** @type {HTMLElement} */ (document.querySelector('.checkout-layout'));
    if (layout) layout.hidden = true;
    if (unavailable) unavailable.hidden = false;
    return;
  }
  if (!selectedCourses.length) selectedCourses = [courses[0]];
  if (seatsInput) seatsInput.value = String(clampSeats(urlParams.get('seats')));

  function clampSeats(value) {
    var seats = parseInt(value || '1', 10);
    if (!isFinite(seats) || seats < 1) return 1;
    return Math.min(seats, 1000);
  }

  var getSeats = function () {
    return clampSeats(seatsInput ? seatsInput.value : '1');
  };

  var getStripe = function () {
    if (stripe) return stripe;
    if (window.Stripe && activeStripeKey) {
      stripe = window.Stripe(activeStripeKey);
    } else {
      console.warn('Stripe.js SDK not loaded or publishable key missing');
    }
    return stripe;
  };

  var setButtonLoading = function (isLoading) {
    if (!submitPaymentBtn) return;
    var btnText = /** @type {HTMLElement} */ (submitPaymentBtn.querySelector('.btn-text'));
    var btnSpinner = /** @type {HTMLElement} */ (submitPaymentBtn.querySelector('.btn-spinner'));
    submitPaymentBtn.disabled = isLoading;
    submitPaymentBtn.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    if (btnText) btnText.hidden = isLoading;
    if (btnSpinner) btnSpinner.hidden = !isLoading;
  };

  // Order summary. Display only: hazwoper-osha.com sets the amount actually charged in /add_order.
  var renderSummary = function () {
    var seats = getSeats();
    var tier = tierForSeats(seats);
    var list = document.getElementById('summaryLines');
    var total = 0;
    list.textContent = '';
    selectedCourses.forEach(function (course) {
      var perSeat = tierPrice(course.price, tier);
      var amount = Math.round(perSeat * seats * 100) / 100;
      total += amount;
      var line = document.createElement('div');
      line.className = 'summary-line';
      var name = document.createElement('span');
      name.className = 'name';
      name.textContent = course.name;
      var qty = document.createElement('span');
      qty.className = 'qty';
      qty.textContent = seats + (seats === 1 ? ' seat' : ' seats') + ' × $' + formatMoney(perSeat);
      name.appendChild(qty);
      var price = document.createElement('span');
      price.textContent = '$' + formatMoney(amount);
      line.appendChild(name);
      line.appendChild(price);
      list.appendChild(line);
    });
    document.getElementById('summaryTotal').textContent = '$' + formatMoney(Math.round(total * 100) / 100);
    var note = document.getElementById('summaryTierNote');
    if (note) {
      note.textContent = tier.discount > 0
        ? 'Team pricing applied: ' + Math.round(tier.discount * 100) + '% off each seat for ' + tierLabel(tier) + ' seats.'
        : 'Buying for 2 or more people? Team pricing starts at 2 seats.';
    }
  };

  // Loads https://js.stripe.com/v3/ once, then mounts the card field.
  var stripeLoading = false;
  var loadStripe = function () {
    if (stripeLoading) return;
    stripeLoading = true;
    if (window.Stripe) {
      mountCard();
      return;
    }
    var script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = mountCard;
    script.onerror = function () {
      stripeLoading = false;
      showError('The secure card form could not load. Check your connection and refresh the page.');
    };
    document.head.appendChild(script);
  };

  var mountCard = function () {
    var stripeInstance = getStripe();
    var container = document.getElementById('payment-element');
    if (!stripeInstance || !container) return;
    try {
      cardElement = stripeInstance.elements().create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#13221a',
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            '::placeholder': { color: '#6b7669' }
          },
          invalid: { color: '#a3261b' }
        }
      });
      container.textContent = '';
      cardElement.mount('#payment-element');
    } catch (err) {
      console.warn('Error mounting Stripe Card Element:', err);
    }
  };

  // E.164 for US/Canada numbers typed without a country code; anything else is sent as typed.
  var normalizePhone = function (raw) {
    var value = (raw || '').trim();
    var digits = value.replace(/\D/g, '');
    if (!digits) return '';
    if (value.charAt(0) === '+') return '+' + digits;
    if (digits.length === 10) return '+1' + digits;
    if (digits.length === 11 && digits.charAt(0) === '1') return '+' + digits;
    return value;
  };

  var phoneLooksValid = function (raw) {
    var digits = (raw || '').replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  };

  if (phoneInput) {
    phoneInput.addEventListener('blur', function () {
      if (!phoneErrorEl) return;
      phoneErrorEl.hidden = phoneInput.value.trim() === '' || phoneLooksValid(phoneInput.value);
      if (!phoneErrorEl.hidden) phoneErrorEl.textContent = 'Please enter a valid phone number.';
    });
  }
  if (seatsInput) seatsInput.addEventListener('input', renderSummary);

  var value = function (id) {
    var el = /** @type {HTMLInputElement | HTMLSelectElement} */ (document.getElementById(id));
    return el ? el.value.trim() : '';
  };

  // Handle Form Submit
  stripeCheckoutForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (paymentErrorAlert) {
      paymentErrorAlert.hidden = true;
      paymentErrorAlert.textContent = '';
    }
    if (phoneErrorEl) phoneErrorEl.hidden = true;
    if (!stripeCheckoutForm.reportValidity()) return;

    if (phoneInput && !phoneLooksValid(phoneInput.value)) {
      if (phoneErrorEl) {
        phoneErrorEl.textContent = 'Please enter a valid phone number before proceeding.';
        phoneErrorEl.hidden = false;
      }
      phoneInput.focus();
      return;
    }

    setButtonLoading(true);
    var seats = getSeats();
    var firstName = value('billingFirstName');
    var lastName = value('billingLastName');
    var company = value('billingCompany');
    var phone = normalizePhone(phoneInput ? phoneInput.value : '');
    var userEmail = value('billingEmail');
    var address1 = value('billingAddress');
    var address2 = value('billingAddress2');
    var city = value('billingCity');
    var state = value('billingState');
    var zip = value('billingZip');
    var country = value('billingCountry') || 'US';

    var stripeInstance = getStripe();
    if (!stripeInstance || !cardElement) {
      loadStripe();
      showError('Please enter your card details in the card field, then try again.');
      setButtonLoading(false);
      return;
    }

    // STEP 1: Tokenize the card with Stripe first; do not touch the hazwoper API if this fails
    var pmResult = await stripeInstance.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: firstName + ' ' + lastName,
        email: userEmail,
        phone: phone,
        address: { line1: address1, line2: address2, city: city, state: state, postal_code: zip, country: country }
      }
    });
    if (pmResult.error) {
      showError(getErrorMessage(pmResult.error));
      setButtonLoading(false);
      return;
    }
    var paymentMethodId = pmResult.paymentMethod ? pmResult.paymentMethod.id : '';

    // STEP 2: Create/find the customer on hazwoper-osha.com
    var customerId = 0;
    try {
      var addUserRes = await fetch(apiBaseUrl + '/add_new_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: userEmail,
          user_name: firstName + ' ' + lastName,
          user_role_id: 2,
          phone: phone
        })
      });
      if (addUserRes.ok) {
        var userData = await addUserRes.json();
        if (userData) {
          customerId = userData.user_id ||
            (userData.data && userData.data.user_id) ||
            (userData.success && userData.success.user_id) ||
            (userData.user && userData.user.user_id) ||
            (userData.existing_email && userData.existing_email) || 0;
        }
      }
    } catch (userErr) {
      console.warn('add_new_user API call notice:', userErr);
    }

    // STEP 3: Place the order; hazwoper-osha.com returns the PaymentIntent clientSecret
    var orderId = 'OTC-' + Math.floor(100000 + Math.random() * 900000);
    var buyer = { first_name: firstName, last_name: lastName, email: userEmail, user_name: '' };
    try {
      var addOrderRes = await fetch(apiBaseUrl + '/add_order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          payment_method: 'stripe',
          payment_method_id: paymentMethodId,
          order_type: 'normal',
          order_status: 'pending',
          order_form: ORDER_FROM,
          order_from: ORDER_FROM,
          billing_first_name: firstName,
          billing_last_name: lastName,
          billing_name: firstName + ' ' + lastName,
          billing_email: userEmail,
          billing_phone: phone,
          billing_company: company,
          billing_address_1: address1,
          billing_address_2: address2,
          billing_city: city,
          billing_state: state,
          billing_postcode: zip,
          billing_country: country,
          shipping_address_1: address1,
          shipping_address_2: address2,
          shipping_city: city,
          shipping_state: state,
          shipping_postcode: zip,
          shipping_country: country,
          courses: selectedCourses.map(function (course) {
            return { course_id: course.id, course_name: course.name, quantity: seats, users: [buyer] };
          })
        })
      });

      var orderData = null;
      try {
        orderData = await addOrderRes.json();
      } catch {
        orderData = null;
      }
      if (!addOrderRes.ok || !orderData || orderData.success === false || orderData.error) {
        showError(getErrorMessage(orderData && (orderData.error || orderData.message) ? (orderData.error || orderData) : 'We could not place your order. Please try again or call us.'));
        setButtonLoading(false);
        return;
      }
      if (orderData.order_id || orderData.id) orderId = '#' + (orderData.order_id || orderData.id);

      // STEP 4: Confirm the payment with the clientSecret from add_order
      if (orderData.clientSecret) {
        var confirmRes = await stripeInstance.confirmCardPayment(orderData.clientSecret, { payment_method: paymentMethodId });
        if (confirmRes && confirmRes.error) {
          showError(getErrorMessage(confirmRes.error));
          setButtonLoading(false);
          return;
        }
      }
    } catch (orderErr) {
      console.warn('Error executing add_order API:', orderErr);
      showError(getErrorMessage(orderErr));
      setButtonLoading(false);
      return;
    }

    // Render the confirmation view only after complete success
    stripeCheckoutForm.hidden = true;
    var pageHeader = /** @type {HTMLElement} */ (document.querySelector('.checkout-page-header'));
    if (pageHeader) pageHeader.hidden = true;
    if (checkoutSuccessView) {
      document.getElementById('successOrderId').textContent = String(orderId).charAt(0) === '#' ? orderId : '#' + orderId;
      document.getElementById('successUserEmail').textContent = userEmail || 'your email';
      checkoutSuccessView.hidden = false;
      checkoutSuccessView.focus();
      checkoutSuccessView.scrollIntoView({ block: 'center' });
    }
    setButtonLoading(false);
  });

  renderSummary();
  stripeCheckoutForm.addEventListener('focusin', loadStripe);
  stripeCheckoutForm.addEventListener('pointerdown', loadStripe);
  var paymentEl = document.getElementById('payment-element');
  if (paymentEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries, observer) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) {
        observer.disconnect();
        loadStripe();
      }
    }, { rootMargin: '600px 0px' }).observe(paymentEl);
  } else {
    loadStripe();
  }
});
