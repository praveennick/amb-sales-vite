import React from 'react';
import MultipleRadialbar from '../charts/MultipleRadialbar';
import './DashboardItem.css';
import StackedColumn from '../charts/StackedColumn';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

function DashboardItem({
    title,
    totalReport,
    total,
    color = 'black',
    stackedColumnSeries,
    stackedColumnOptions,
    isYesterdayReport,
    beforeYesterdayReport,
    icon
}) {
    const labels = totalReport ? Object.keys(totalReport) : [];
    const series = totalReport ? labels.map((store) => totalReport[store]) : [];

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


    const calculateTotal = (reportData) => {
        if (!reportData || typeof reportData !== 'object') return 0;
        return Object.values(reportData).reduce((total, amount) => total + amount, 0);
    };


    const calculatePercentageChange = (current, previous) => {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    };

    return (
        <div className='dashboard-item-container p-4'>
            <div className="dashboard-item-header flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" fill={color}>
                    {icon}
                </svg>
                <div className='text-2xl font-semibold text-[#1f2937]'>{title}</div>
            </div>
            {/* Yesterday's Sales Report Design */}
            {isYesterdayReport ? (
                <>
                    {labels.map((store, index) => {
                        if (store === 'total') return null;

                        const current = totalReport[store] || 0;
                        const previous = beforeYesterdayReport?.[store] || 0;
                        const change = calculatePercentageChange(current, previous);
                        const isPositive = change >= 0;

                        return (
                            <div key={index} className="report-row">
                                <div className="store-info">
                                    <div className="store-name">{store}</div>
                                    <div className="store-value">₹{formatNumber(current)}</div>
                                </div>
                                <div className={`percentage-change ${isPositive ? "positive" : "negative"}`}>
                                    {isPositive ? <FaArrowUp /> : <FaArrowDown />}
                                    {Math.abs(change).toFixed(2)}%
                                </div>
                            </div>
                        );
                    })}

                    <div className="report-total-row">
                        <span>Total:</span>
                        <span className="report-total-value">₹{formatNumber(total)}</span>
                    </div>
                </>
            ) : (
                <>
                    {/* Card Design with Chart and Breakdown */}
                    <div className='dashboard-item-chart'>
                        {total && totalReport && (
                            <MultipleRadialbar
                                labels={['Juice Hut', 'Bubble Tea', 'Coffee Shop']}
                                series={series}
                                total={total}
                            />
                        )}
                        {stackedColumnSeries && stackedColumnOptions && (
                            <StackedColumn
                                series={stackedColumnSeries}
                                options={stackedColumnOptions}
                            />
                        )}
                    </div>

                    {/* Store-wise Breakdown */}
                    {stackedColumnSeries && stackedColumnSeries.map((series, index) => (
                        <div key={index} className="total-row">
                            <span className='text-[#606770]'>{series.name}</span>
                            <span>₹{formatNumber(calculateTotal(series.data))}</span>
                        </div>
                    ))}
                    {title !== "Selected Date Report" && (
                        <div className="report-total-row">
                            <span>Total:</span>
                            <span className="report-total-value">
                                ₹{formatNumber(
                                    calculateTotal(
                                        Array.isArray(stackedColumnSeries)
                                            ? stackedColumnSeries.flatMap((s) => s.data || [])
                                            : []
                                    )
                                )}
                            </span>
                        </div>
                    )}

                </>
            )}
        </div>
    );
}

export default DashboardItem;
