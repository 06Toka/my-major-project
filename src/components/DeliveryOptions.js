import React, { useState } from 'react';
import { FaTruck, FaMotorcycle, FaStore, FaShippingFast, FaArrowLeft, FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './DeliveryOptions.css';

const DeliveryOptions = ({ cart, onBackToCheckout, onConfirmDelivery }) => {
  const [selectedOption, setSelectedOption] = useState('');
  const [deliveryDetails, setDeliveryDetails] = useState({
    address: '',
    contactNumber: '',
    instructions: ''
  });

  const deliveryOptions = [
    {
      id: 'pickup',
      title: 'Pick Up',
      icon: <FaStore size={24} />,
      description: 'Collect your order from the seller',
      price: 0,
      estimatedTime: 'Flexible',
      features: ['No delivery fee', 'Coordinate pickup time'],
      color: '#4CAF50'
    },
    {
      id: 'local',
      title: 'Local Delivery',
      icon: <FaMotorcycle size={24} />,
      description: 'Same town/city delivery',
      price: 20,
      estimatedTime: '1-3 hours',
      features: ['Fast delivery', 'Track your order'],
      color: '#2196F3'
    },
    {
      id: 'long-distance',
      title: 'Long Distance',
      icon: <FaTruck size={24} />,
      description: 'Delivery to another town/city',
      price: 50,
      estimatedTime: '1-3 days',
      features: ['Secure packaging', 'Nationwide coverage'],
      color: '#FF9800'
    },
    {
      id: 'express',
      title: 'Express Delivery',
      icon: <FaShippingFast size={24} />,
      description: 'Priority next-day delivery',
      price: 80,
      estimatedTime: '24 hours',
      features: ['Guaranteed delivery', 'Priority handling'],
      color: '#9C27B0'
    }
  ];

  const handleConfirm = () => {
    const option = deliveryOptions.find(opt => opt.id === selectedOption);
    onConfirmDelivery({
      option: option.id,
      fee: option.price,
      details: option.id === 'pickup' ? null : deliveryDetails
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeliveryDetails(prev => ({ ...prev, [name]: value }));
  };

  const selectedOptionData = deliveryOptions.find(opt => opt.id === selectedOption);

  return (
    <motion.div 
      className="delivery-options-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="delivery-header">
        <motion.button 
          className="back-button"
          onClick={onBackToCheckout}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaArrowLeft /> Back to Checkout
        </motion.button>
        <h2>Choose Your Delivery</h2>
        <p className="subtitle">Select the best delivery option for your order</p>
      </div>

      <div className="delivery-content">
        <div className="option-selection">
          <div className="delivery-methods">
            {deliveryOptions.map(option => (
              <motion.div 
                key={option.id}
                className={`delivery-method ${selectedOption === option.id ? 'selected' : ''}`}
                onClick={() => setSelectedOption(option.id)}
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ borderLeft: `5px solid ${option.color}` }}
              >
                <div className="method-icon" style={{ color: option.color }}>
                  {option.icon}
                </div>
                <div className="method-info">
                  <h4>{option.title}</h4>
                  <p className="description">{option.description}</p>
                  <div className="method-features">
                    {option.features.map((feature, i) => (
                      <span key={i} className="feature-tag" style={{ backgroundColor: `${option.color}20` }}>
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="method-price" style={{ color: option.color }}>
                  {option.price > 0 ? `M${option.price.toFixed(2)}` : 'FREE'}
                </div>
                {selectedOption === option.id && (
                  <div className="selected-check" style={{ backgroundColor: option.color }}>
                    <FaCheck color="white" size={14} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {selectedOption && (
            <motion.div 
              className="delivery-details-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="selected-method-summary" style={{ borderColor: selectedOptionData.color }}>
                <h3 style={{ color: selectedOptionData.color }}>{selectedOptionData.title} Summary</h3>
                <div className="summary-row">
                  <span>Delivery Fee:</span>
                  <span className="price">{selectedOptionData.price > 0 ? `M${selectedOptionData.price.toFixed(2)}` : 'Free'}</span>
                </div>
                <div className="summary-row">
                  <span>Estimated Delivery:</span>
                  <span>{selectedOptionData.estimatedTime}</span>
                </div>
              </div>

              {selectedOption !== 'pickup' && (
                <motion.div 
                  className="delivery-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3>Delivery Information</h3>
                  <div className="form-group">
                    <label>Delivery Address</label>
                    <input
                      type="text"
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
                      rows="3"
                    />
                  </div>
                </motion.div>
              )}

              <motion.button
                className="confirm-delivery-btn"
                onClick={handleConfirm}
                disabled={selectedOption !== 'pickup' && !deliveryDetails.address}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ backgroundColor: selectedOptionData.color }}
              >
                Confirm {selectedOptionData.title} Delivery
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default DeliveryOptions;