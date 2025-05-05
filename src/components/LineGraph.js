import React, { useRef, useEffect } from "react";
import Chart from "chart.js/auto";

const LineGraph = ({ prices, dates, productName }) => {
  const chartRef = useRef(null); // Ref for the canvas element
  const chartInstance = useRef(null); // Ref to store the Chart instance

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext("2d");

      // Destroy the previous chart instance if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Create a new Chart instance and store it in the ref
      chartInstance.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: dates || prices.map((_, index) => `Day ${index + 1}`), // Use dates if available, else fallback to "Day X"
          datasets: [
            {
              label: `Price Trend for ${productName}`, // Dynamic label based on product name
              data: prices, // Y-axis data
              borderColor: "#4CAF50", // Green line
              backgroundColor: "rgba(76, 175, 80, 0.1)", // Light green fill
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: "#4CAF50",
              fill: true, // Fill under the line
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `Price Trend for ${productName}`, // Dynamic title based on product name
              font: {
                size: 16, // Title font size
              },
            },
            tooltip: {
              enabled: true,
              mode: "index",
              intersect: false,
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || "";
                  const value = context.raw || 0;
                  return `${label}: M${value}`; // Display price in tooltip
                },
              },
            },
            legend: {
              display: true, // Show legend
              position: "bottom", // Position legend at the bottom
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Time", // X-axis label
                font: {
                  size: 14, // Label font size
                },
              },
              grid: {
                display: false, // Hide X-axis grid
              },
            },
            y: {
              title: {
                display: true,
                text: "Price (M)", // Y-axis label
                font: {
                  size: 14, // Label font size
                },
              },
              beginAtZero: true, // Start Y-axis from 0
              grid: {
                color: "#e0e0e0", // Light gray grid lines
              },
            },
          },
        },
      });
    }

    // Cleanup function to destroy the chart instance when the component unmounts
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [prices, dates, productName]); // Re-run effect when these props change

  return <canvas ref={chartRef} />;
};

export default LineGraph;