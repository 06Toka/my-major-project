import React from "react";
import { FaChartLine, FaMapMarkerAlt, FaMoneyBillWave } from "react-icons/fa"; // Icons
import LineGraph from "./LineGraph"; // Line graph component

const TrendingProducts = ({ trendingProducts }) => {
  return (
    <div className="trending-products">
      <h2>Trending Products</h2>
      {trendingProducts.length > 0 ? (
        <div className="big-card">
          <div className="small-cards">
            {trendingProducts.map((product, index) => (
              <div key={index} className="small-card">
                <div className="card-header">
                  <h3>
                    <FaChartLine /> {product.name}
                  </h3>
                  <p>
                    <FaMoneyBillWave /> Appeared {product.count} times
                  </p>
                </div>
                <div className="card-body">
                  <LineGraph
                    prices={product.prices}
                    dates={product.dates}
                    productName={product.name} // Pass product name to the graph
                  />
                </div>
                <div className="card-footer">
                  <ul>
                    {product.prices.map((price, i) => (
                      <li key={i}>
                        <FaMapMarkerAlt /> Price: M{price} - Location: {product.locations[i]}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p>No trending products found.</p>
      )}
    </div>
  );
};

export default TrendingProducts;