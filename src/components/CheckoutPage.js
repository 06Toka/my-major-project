import React from 'react';
import { FaArrowLeft } from 'react-icons/fa';

const CheckoutPage = ({ 
  cart, 
  onBackToCart, 
  onConfirmOrder,
  paymentMethod, 
  setPaymentMethod,
  deliveryOptions,
  deliveryOption,
  setDeliveryOption,
  deliveryFee,
  setDeliveryFee,
  deliveryDetails,
  setDeliveryDetails
}) => {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeliveryDetails(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="checkout-page">
      <button className="back-button" onClick={onBackToCart}>
        <FaArrowLeft /> Back to Cart
      </button>
      <h2>Checkout Summary</h2>
      
      <div className="checkout-items">
        {cart.map(item => (
          <div key={`${item.id}-${item.addedAt}`} className="checkout-item">
            <div className="item-info">
              <h4>{item.name}</h4>
              <p>{item.quantity} × M{item.price.toFixed(2)}</p>
            </div>
            <p className="item-total">M{(item.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="payment-section">
        <h3>Payment Method</h3>
        <div className="payment-options">
          <label className={`payment-option ${paymentMethod === 'mobile' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="payment"
              value="mobile"
              checked={paymentMethod === 'mobile'}
              onChange={() => setPaymentMethod('mobile')}
            />
            <div className="payment-details">
              <span>Mobile Money ({cart[0]?.mobileMoneyProvider || 'Mpesa'})</span>
              <small>Pay to: {cart[0]?.mobileMoneyNumber || 'Not specified'}</small>
            </div>
          </label>

          <label className={`payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="payment"
              value="cash"
              checked={paymentMethod === 'cash'}
              onChange={() => setPaymentMethod('cash')}
            />
            <div className="payment-details">
              <span>Cash on Delivery</span>
              <small>Pay when you receive</small>
            </div>
          </label>
        </div>
      </div>

      <div className="delivery-section">
        <h3>Delivery Method</h3>
        {deliveryOption ? (
          <div className="selected-delivery">
            <div className="delivery-info">
              <h5>{deliveryOptions.find(opt => opt.id === deliveryOption)?.title}</h5>
              <p>{deliveryOptions.find(opt => opt.id === deliveryOption)?.description}</p>
              <div className="delivery-meta">
                <span>Fee: {deliveryFee > 0 ? `M${deliveryFee.toFixed(2)}` : 'Free'}</span>
                <span>Est: {deliveryOptions.find(opt => opt.id === deliveryOption)?.estimatedTime}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="delivery-options">
            {deliveryOptions.map(option => (
              <div 
                key={option.id}
                className={`delivery-option ${deliveryOption === option.id ? 'selected' : ''}`}
                onClick={() => {
                  setDeliveryOption(option.id);
                  setDeliveryFee(option.price);
                }}
              >
                <div className="option-icon">{option.icon}</div>
                <div className="option-details">
                  <h5>{option.title}</h5>
                  <p>{option.description}</p>
                  <div className="option-meta">
                    <span>{option.price > 0 ? `M${option.price.toFixed(2)}` : 'Free'}</span>
                    <span>{option.estimatedTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deliveryOption && deliveryOption !== 'pickup' && (
        <div className="delivery-details-form">
          <h3>Delivery Information</h3>
          <div className="form-group">
            <label>Delivery Address</label>
            <textarea
              name="address"
              value={deliveryDetails.address}
              onChange={handleInputChange}
              placeholder="Enter full delivery address"
              required
            />
          </div>
          <div className="form-group">
            <label>Contact Number</label>
            <input
              type="tel"
              name="contactNumber"
              value={deliveryDetails.contactNumber}
              onChange={handleInputChange}
              placeholder="Your phone number"
              required
            />
          </div>
          <div className="form-group">
            <label>Special Instructions (Optional)</label>
            <textarea
              name="instructions"
              value={deliveryDetails.instructions}
              onChange={handleInputChange}
              placeholder="Any special delivery instructions?"
            />
          </div>
        </div>
      )}

      <div className="checkout-total">
        <div className="total-row">
          <span>Subtotal:</span>
          <span>M{total.toFixed(2)}</span>
        </div>
        <div className="total-row">
          <span>Delivery:</span>
          <span>{deliveryFee > 0 ? `M${deliveryFee.toFixed(2)}` : 'Free'}</span>
        </div>
        <div className="total-row grand-total">
          <span>Total:</span>
          <span>M{(total + deliveryFee).toFixed(2)}</span>
        </div>
      </div>

      <button 
        className="confirm-order-btn"
        onClick={onConfirmOrder}
        disabled={!paymentMethod || !deliveryOption || (deliveryOption !== 'pickup' && !deliveryDetails.address)}
      >
        Confirm Order (M{(total + deliveryFee).toFixed(2)})
      </button>
    </div>
  );
};

export default CheckoutPage;