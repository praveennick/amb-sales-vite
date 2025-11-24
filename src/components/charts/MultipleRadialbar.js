import React, { useState } from 'react';
import ReactApexChart from 'react-apexcharts';

const MultipleRadialbar = ({ labels, series, total }) => {
    // Calculate the sum of the series to normalize the values
    const totalValue = series.reduce((acc, val) => acc + val, 0);
    const normalizedSeries = series.map(value => (value / totalValue) * 100);
    const formatNumber = (x) => {
        if (x == null || isNaN(x)) return "0";
        const parts = x.toString().split(".");
        const integerPart = parts[0];
        const decimalPart = parts[1] ? `.${parts[1]}` : "";
        const lastThree = integerPart.substring(integerPart.length - 3);
        const otherNumbers = integerPart.substring(0, integerPart.length - 3);
        const formatted =
            otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") +
            (otherNumbers ? "," : "") +
            lastThree;
        return formatted + decimalPart;
    };

    const [options,] = useState({
        chart: {
            height: 500,
            type: 'radialBar',
        },
        plotOptions: {
            radialBar: {
                hollow: {
                    size: '15%',  // Adjust hollow size
                },
                track: {
                    strokeWidth: '100%',  // Adjust track width
                },
                dataLabels: {
                    show: false, // Disable value labels inside the chart
                },
                barHeight: '90%',  // Increase bar width
            },
        },
        labels: labels,
        tooltip: {
            enabled: true,
            y: {
                formatter: function (val) {
                    return typeof val === 'number' ? Math.round(val) + '%' : val;
                }
            }
        },
        legend: {
            show: true,
            position: 'right',
            offsetX: -10,  // Adjust the horizontal distance between the chart and the legends
            height: 430,
            formatter: function (seriesName, opts) {
                return `<span style="font-size:15px;color:"#606770">${seriesName} </span> <span style="font-size:15px;font-weight:bold;">₹${formatNumber(series[opts.seriesIndex])}</span>`;
            }

        },
    });

    return (
        <div id="chart" style={{ textAlign: 'center' }}>
            <ReactApexChart options={options} series={normalizedSeries} type="radialBar" height={500} />
        </div>
    );
};

export default MultipleRadialbar;
