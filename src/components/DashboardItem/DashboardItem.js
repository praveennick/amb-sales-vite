import React from 'react';
import MultipleRadialbar from '../charts/MultipleRadialbar';
import './DashboardItem.css';
import StackedColumn from '../charts/StackedColumn';

function DashboardItem({
    title,
    totalReport,
    total,
    color = 'black',
    stackedColumnSeries,
    stackedColumnOptions,
    isYesterdayReport,
    beforeYesterdayReport
}) {
    const labels = totalReport ? Object.keys(totalReport) : [];
    const series = totalReport ? labels.map((store) => totalReport[store]) : [];

    const formatNumber = (number) => {
        return number != null ? number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
    };

    const calculateTotal = (reportData) => {
        return Object.values(reportData).reduce((total, amount) => total + amount, 0);
    };

    const calculatePercentageChange = (current, previous) => {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    };

    return (
        <div className='dashboard-item-container'>
            <div className='dashboard-item-title'>
                <span style={{
                    width: '16px',
                    height: '32px',
                    top: "16px",
                    left: '10px',
                    backgroundColor: color,
                    borderRadius: '4px',
                    position: 'absolute',
                }}></span>
                {title}
            </div>

            {!isYesterdayReport && (
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
            )}

            {isYesterdayReport && labels.map((store, index) => {
                const displayStoreName = store === 'Bubble Tea N Cotton Candy' ? 'Bubble Tea' : store;
                const percentageChange = calculatePercentageChange(
                    totalReport[store],
                    beforeYesterdayReport ? beforeYesterdayReport[store] : 0
                );
                const icon = percentageChange >= 0 ? "fa-arrow-up" : "fa-arrow-down";
                const iconColor = percentageChange >= 0 ? "up" : "down";

                return (
                    <div key={index} className="total-amount">
                        <str>{displayStoreName} : <span className="amount-bg">₹{formatNumber(totalReport[store])}</span></str>
                        <span className={`percentage-change ${iconColor}`}>
                            <i className={`fa ${icon}`} aria-hidden="true"></i>
                            {Math.abs(percentageChange).toFixed(2)}%
                        </span>
                    </div>
                );
            })}

            {isYesterdayReport && (
                <div className="total-amount">
                    <strong>Total:</strong> <span className="amount-bg">₹{formatNumber(total)}</span>
                </div>
            )}

            {!isYesterdayReport && stackedColumnSeries && stackedColumnSeries.map((series, index) => (
                <div key={index} className="total-amount">
                    <strong>{series.name}</strong>  ₹{formatNumber(calculateTotal(series.data))}
                </div>
            ))}

            {!isYesterdayReport && stackedColumnSeries && (
                <div className="total-amount">
                    <strong>Total:</strong><span className="amount-bg">₹{formatNumber(calculateTotal(stackedColumnSeries.flatMap((s) => s.data)))}</span>
                </div>
            )}
        </div>
    );
}

export default DashboardItem;
