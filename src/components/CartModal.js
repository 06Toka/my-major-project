import React from 'react';
import CheckoutPage from './CheckoutPage';

const CartModal = ({
  cart,
  showCart,
  setShowCart,
  proceedToCheckout,
  setProceedToCheckout,
  paymentMethod,
  setPaymentMethod,
  handleCheckout,
  removeFromCart,
  addToCart
}) => {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className={`cart-modal ${showCart ? 'visible' : ''}`}>
      <div className="cart-content">
        {proceedToCheckout ? (
          <CheckoutPage 
            cart={cart}
            onBackToCart={() => setProceedToCheckout(false)}
            onConfirmOrder={handleCheckout}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
          />
        ) : (
          <>
            <div className="cart-header">
              <h3>Your Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})</h3>
              <button onClick={() => setShowCart(false)}>×</button>
            </div>
            
            <div className="cart-items">
              {cart.length > 0 ? (
                <>
                  {cart.map(item => (
                    <div key={`${item.id}-${item.addedAt}`} className="cart-item">
                      <div className="cart-item-image">
                        {item.mediaUrl ? (
                          <img src={item.mediaUrl} alt={item.name} />
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                      </div>
                      <div className="cart-item-details">
                        <h4>{item.name}</h4>
                        <p className="price">M{item.price.toFixed(2)} each</p>
                        <div className="quantity-controls">
                          <button onClick={() => removeFromCart(item.id)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => addToCart(item)}>+</button>
                        </div>
                      </div>
                      <div className="cart-item-subtotal">
                        <p>M{(item.price * item.quantity).toFixed(2)}</p>
                        <button 
                          className="remove-item"
                          onClick={() => removeFromCart(item.id, true)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="cart-summary">
                    <div className="summary-row">
                      <span>Subtotal:</span>
                      <span>M{total.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Delivery:</span>
                      <span>Free</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total:</span>
                      <span>M{total.toFixed(2)}</span>
                    </div>
                  </div>
                  <button 
                    className="checkout-btn" 
                    onClick={() => setProceedToCheckout(true)}
                  >
                    Proceed to Checkout
                  </button>
                </>
              ) : (
                <div className="empty-cart">
                  <p>Your cart is empty</p>
                  <button 
                    className="continue-shopping-btn"
                    onClick={() => setShowCart(false)}
                  >
                    Continue Shopping
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartModal;