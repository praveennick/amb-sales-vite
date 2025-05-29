import React, { useEffect, useState } from "react";
import { db, doc, getDoc } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";
import moment from "moment";
import Chart from "react-apexcharts";
import { debounce } from "lodash";
import * as XLSX from "xlsx";
import "./Dashboard.css";
import DashboardItem from "./components/DashboardItem/DashboardItem";
import LoadingSpinner from "./components/common/LoadingSpinner/LoadingSpinner";

const Dashboard = () => {
  const [user] = useAuthState(auth);
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState(moment().startOf("week"));
  const [endDate, setEndDate] = useState(moment().endOf("week"));
  const [focusedInput, setFocusedInput] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("Last 7 days"); // State for dropdown selection
  const [individualReportType, setIndividualReportType] = useState("Last 7 days"); // State for the new DashboardItem dropdown
  const [individualData, setIndividualData] = useState([]); // Data for the new DashboardItem
  const [individualTotal, setIndividualTotal] = useState(0); // Total for the individual report
  const [totalReport, setTotalReport] = useState({
    "The Juice Hut": 0,
    "Bubble Tea N Cotton Candy": 0,
    "Coffee N Candy": 0,
  });
  const [yesterdayReport, setYesterdayReport] = useState({
    "The Juice Hut": 0,
    "Bubble Tea N Cotton Candy": 0,
    "Coffee N Candy": 0,
    total: 0,
  });
  const [beforeYesterdayReport, setBeforeYesterdayReport] = useState({
    "The Juice Hut": 0,
    "Bubble Tea N Cotton Candy": 0,
    "Coffee N Candy": 0,
    total: 0,
  });

  // Function to fetch data for individual DashboardItem based on dropdown selection
  const fetchIndividualReport = async (reportType) => {
    if (!user) return;

    setLoading(true);
    try {
      let start, end;
      switch (reportType) {
        case "Last 7 days":
          start = moment().subtract(6, "days");
          end = moment();
          break;
        case "This month":
          start = moment().startOf("month");
          end = moment();
          break;
        // case "All time":
        //   start = moment("2020-01-01");
        //   end = moment();
        //   break;
        default:
          start = moment().startOf("week");
          end = moment().endOf("week");
      }

      const shops = ["The Juice Hut", "Bubble Tea N Cotton Candy", "Coffee N Candy"];
      const allData = [];
      let total = 0;
      let currentDate = moment(start);

      while (currentDate.isSameOrBefore(end)) {
        const dateStr = currentDate.format("DD-MM-YYYY");
        const datePromises = shops.map((shopName) =>
          fetchDataForDate(shopName, dateStr)
        );
        const dateResults = await Promise.all(datePromises);
        dateResults.forEach((result) => {
          if (result) {
            allData.push(result);
            total += parseFloat(result.totalSale) || 0;
          }
        });
        currentDate.add(1, "day");
      }

      setIndividualData(allData);
      setIndividualTotal(total);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndividualReport(individualReportType);
  }, [individualReportType, user]);

  const handleIndividualReportTypeChange = (event) => {
    setIndividualReportType(event.target.value);
  };

  // Fetch data for yesterday and the day before
  const fetchPreviousData = async () => {
    if (!user) return;

    const shops = ["The Juice Hut", "Bubble Tea N Cotton Candy", "Coffee N Candy"];
    const yesterday = moment().subtract(1, "days").format("DD-MM-YYYY");
    const dayBeforeYesterday = moment().subtract(2, "days").format("DD-MM-YYYY");

    const yesterdayData = {
      "The Juice Hut": 0,
      "Bubble Tea N Cotton Candy": 0,
      "Coffee N Candy": 0,
      total: 0,
    };

    const beforeYesterdayData = {
      "The Juice Hut": 0,
      "Bubble Tea N Cotton Candy": 0,
      "Coffee N Candy": 0,
      total: 0,
    };

    try {
      for (const shop of shops) {
        // Fetch yesterday's data
        const yesterdayDocRef = doc(db, "shops", shop, yesterday, "data");
        const yesterdayDocSnap = await getDoc(yesterdayDocRef);
        if (yesterdayDocSnap.exists()) {
          const totalSale = parseFloat(yesterdayDocSnap.data().totalSale) || 0;
          yesterdayData[shop] = totalSale;
          yesterdayData.total += totalSale;
        }

        // Fetch the day before yesterday's data
        const beforeYesterdayDocRef = doc(db, "shops", shop, dayBeforeYesterday, "data");
        const beforeYesterdayDocSnap = await getDoc(beforeYesterdayDocRef);
        if (beforeYesterdayDocSnap.exists()) {
          const totalSale = parseFloat(beforeYesterdayDocSnap.data().totalSale) || 0;
          beforeYesterdayData[shop] = totalSale;
          beforeYesterdayData.total += totalSale;
        }
      }

      setYesterdayReport(yesterdayData);
      setBeforeYesterdayReport(beforeYesterdayData);
    } catch (error) {
      console.error("Error fetching previous data: ", error);
    }
  };


  const fetchDataForDate = async (shopName, date) => {
    try {
      const docRef = doc(db, "shops", shopName, date, "data");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { shopName, date, ...docSnap.data() };
      }
    } catch (error) {
      console.error(`Error fetching data for ${shopName} on ${date}:`, error);
    }
    return null;
  };

  const fetchData = async (start, end) => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    setLoading(true);
    try {
      const shops = [
        "The Juice Hut",
        "Bubble Tea N Cotton Candy",
        "Coffee N Candy",
      ];
      const allData = [];
      const totalReport = {
        "The Juice Hut": 0,
        "Bubble Tea N Cotton Candy": 0,
        "Coffee N Candy": 0,
      };
      let currentDate = moment(start);

      while (currentDate.isSameOrBefore(end)) {
        const dateStr = currentDate.format("DD-MM-YYYY");
        const datePromises = shops.map((shopName) =>
          fetchDataForDate(shopName, dateStr)
        );
        const dateResults = await Promise.all(datePromises);
        dateResults.forEach((result) => {
          if (result) {
            allData.push(result);
            totalReport[result.shopName] += parseFloat(result.totalSale) || 0;
          }
        });
        currentDate.add(1, "day");
      }

      setData(allData);
      setTotalReport(totalReport);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced version of fetchData to avoid excessive calls
  const debouncedFetchData = debounce(
    (start, end) => fetchData(start, end),
    300
  );

  useEffect(() => {
    fetchPreviousData();
  }, [user]);

  useEffect(() => {
    debouncedFetchData(startDate, endDate);
  }, [startDate, endDate, user]);

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const generateChartOptions = (categories, title) => ({
    chart: {
      type: "bar",
      height: 350,
      stacked: true,
      stackType: "100%",
      zoom: {
        enabled: true,
        type: "x",
        autoScaleYaxis: true,
      },
      toolbar: {
        show: false // Disables the toolbar which includes the download button
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 5,
      },
    },
    xaxis: {
      categories,
      labels: {
        formatter: function (value) {
          const date = moment(value, "DD-MM-YYYY");
          return date.isValid()
            ? `${date.format("ddd")} ${date.date()} ${date.format("MMM")}`
            : value;
        },
      },
    },
    yaxis: {
      title: {
        // text: 'Amount (₹)'
      },
    },
    fill: {
      opacity: 1,
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      //   offsetX: 40,
      offsetY: -10,
    },
    tooltip: {
      y: {
        formatter: (value) => `₹${value.toLocaleString()}`,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => `₹${value.toLocaleString()}`,
      style: {
        fontSize: "12px",
        colors: ["#fff"],
      },
    },
    title: {
      text: title,
      align: "center",
      margin: 20,
      offsetY: 20,
      style: {
        fontSize: "24px",
      },
    },
  });

  const processDataForChart = (data, key) => {
    const groupedData = {};
    data.forEach((item) => {
      const date = item.date;
      const shopName = item.shopName;
      if (!groupedData[date]) {
        groupedData[date] = {
          "The Juice Hut": 0,
          "Bubble Tea N Cotton Candy": 0,
          "Coffee N Candy": 0,
        };
      }
      groupedData[date][shopName] += parseFloat(item[key]) || 0;
    });
    return groupedData;
  };

  const prepareChartData = (data, key) => {
    const groupedData = processDataForChart(data, key);
    const categories = Object.keys(groupedData);
    const series = [
      {
        name: "The Juice Hut",
        data: categories.map((date) => groupedData[date]["The Juice Hut"]),
      },
      {
        name: "Bubble Tea N Cotton Candy",
        data: categories.map(
          (date) => groupedData[date]["Bubble Tea N Cotton Candy"]
        ),
      },
      {
        name: "Coffee N Candy",
        data: categories.map((date) => groupedData[date]["Coffee N Candy"]),
      },
    ];
    return { categories, series };
  };

  const chartData = {
    totalSales: prepareChartData(data, "totalSale"),
    posSales: prepareChartData(data, "posSale"),
    cashSales: prepareChartData(data, "cash"),
    upiSales: prepareChartData(data, "upi"),
    cardSales: prepareChartData(data, "card"),
    cashGiven: prepareChartData(data, "cashGiven"),
    remaining: prepareChartData(data, "remaining"),
  };

  const formatNumber = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const calculateTotal = (reportData) => {
    return Object.values(reportData).reduce(
      (total, amount) => total + amount,
      0
    );
  };

  const downloadReport = () => {
    // Format data
    const formattedData = data.map((item) => ({
      date: item.date,
      shopName: item.shopName,
      posSale: item.posSale,
      upi: item.upi,
      card: item.card,
      cashGiven: item.cashGiven,
      remaining: item.remaining,
      cash: item.cash,
      totalSale: item.totalSale,
      submittedBy: item.submittedBy,
      submissionDate: item.submissionDate,
    }));

    // Calculate totals
    const totals = {
      date: "Total",
      shopName: "",
      posSale: formattedData.reduce(
        (sum, record) => sum + (parseFloat(record.posSale) || 0),
        0
      ),
      upi: formattedData.reduce(
        (sum, record) => sum + (parseFloat(record.upi) || 0),
        0
      ),
      card: formattedData.reduce(
        (sum, record) => sum + (parseFloat(record.card) || 0),
        0
      ),
      cashGiven: formattedData.reduce(
        (sum, record) => sum + (parseFloat(record.cashGiven) || 0),
        0
      ),
      remaining: formattedData.reduce(
        (sum, record) => sum + (parseFloat(record.remaining) || 0),
        0
      ),
      cash: formattedData.reduce(
        (sum, record) => sum + (parseFloat(record.cash) || 0),
        0
      ),
      totalSale: formattedData.reduce(
        (sum, record) => sum + (parseFloat(record.totalSale) || 0),
        0
      ),
      submittedBy: "",
      submissionDate: "",
    };

    formattedData.push(totals); // Add totals row

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");

    // Define column widths
    ws["!cols"] = [
      { wch: 15 }, // date
      { wch: 25 }, // shopName
      { wch: 10 }, // posSale
      { wch: 10 }, // upi
      { wch: 10 }, // card
      { wch: 10 }, // cashGiven
      { wch: 10 }, // remaining
      { wch: 10 }, // cash
      { wch: 10 }, // totalSale
      { wch: 25 }, // submittedBy
      { wch: 20 }, // submissionDate
    ];

    // Define styles
    const headerCellStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F81BD" } },
      alignment: { horizontal: "center", vertical: "center" },
    };

    const totalRowStyle = {
      font: { bold: true, color: { rgb: "FF0000" } }, // Red color for total
      fill: { fgColor: { rgb: "FFFFE0" } }, // Light yellow background
      alignment: { horizontal: "center", vertical: "center" },
    };

    const headerRange = XLSX.utils.decode_range(ws["!ref"]);
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({
        r: headerRange.s.r,
        c: col,
      });
      if (ws[cellAddress]) {
        ws[cellAddress].s = headerCellStyle;
      }
    }

    const totalRowNumber = formattedData.length + 1; // Total row is at the end
    Object.keys(ws).forEach((cell) => {
      const cellAddress = XLSX.utils.decode_cell(cell);
      if (cellAddress.r === totalRowNumber - 1) {
        ws[cell].s = totalRowStyle;
      }
    });

    XLSX.writeFile(wb, "Report.xlsx");
  };
  // Update date range based on selected report type
  useEffect(() => {
    switch (reportType) {
      case "Last 7 days":
        setStartDate(moment().subtract(6, "days"));
        setEndDate(moment());
        break;
      case "This month":
        setStartDate(moment().startOf("month"));
        setEndDate(moment());
        break;
      // case "All time":
      //   setStartDate(moment("2020-01-01")); // Assuming data starts from 2020
      //   setEndDate(moment());
      //   break;
      default:
        setStartDate(moment().startOf("week"));
        setEndDate(moment().endOf("week"));
    }
  }, [reportType]);
  const individualChartData = prepareChartData(individualData, "totalSale");

  return (
    <>
      <div className="app-title">Dashboard</div>
      {/* Dropdown for selecting report type */}
      <div className="report-container">
        <div className="report-dropdown">
          <label className="report-label">Select Report</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="report-select"
          >
            <option value="Last 7 days">Last 7 days</option>
            <option value="This month">This month</option>
          </select>
        </div>
        <div className="report-dates">

          <input
            type="date"
            value={startDate.format("YYYY-MM-DD")}
            onChange={(e) => setStartDate(moment(e.target.value))}
            className="report-date"
          />

          <input
            type="date"
            value={endDate.format("YYYY-MM-DD")}
            onChange={(e) => setEndDate(moment(e.target.value))}
            className="report-date"
          />
        </div>
      </div>

      {data.length > 0 && (
        <div className="button-container">
          <button className="button" onClick={downloadReport}>
            <svg
              className="saveicon"
              stroke="currentColor"
              stroke-width="1.7"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                stroke-linejoin="round"
                stroke-linecap="round"
              ></path>
            </svg>
            download
          </button>
        </div>
      )}
      {loading ? (
        <LoadingSpinner />
      ) : data.length === 0 ? (
        <div className="no-data">
          No data available for the selected date range.
        </div>
      ) : (
        <div className="dashboard-content">
          <DashboardItem
            title={"Yesterday's Sales Report"}
            totalReport={yesterdayReport}
            total={yesterdayReport.total}
            color={"#FFD88D"}
            isYesterdayReport={true} // Pass this prop to conditionally render the report
            beforeYesterdayReport={beforeYesterdayReport} // Pass previous day's report for comparison
          />

          <DashboardItem title={"Selected Date Report"} color={"#b5e4ca"} totalReport={totalReport} total={formatNumber(calculateTotal(totalReport))} />
          {/* New Individual Report Type Dropdown */}
          {/* <div className="report-type-dropdown">
            <label htmlFor="individualReportType">Select Report for Individual Card: </label>
            <select
              id="individualReportType"
              value={individualReportType}
              onChange={handleIndividualReportTypeChange}
              className="dropdown-select"
            >
              <option value="Last 7 days">Last 7 days</option>
              <option value="This month">This month</option>
              <option value="All time">All time</option>
            </select>
          </div> */}

          {/* New DashboardItem for Individual Report */}
          {/* <DashboardItem
            title={"Individual Report"}
            color={"#CABDFF"}
            totalReport={individualTotal}
            stackedColumnSeries={individualChartData.series}
            stackedColumnOptions={generateChartOptions(individualChartData.categories)}
          /> */}

          <DashboardItem title={"Total Sales"} color={"#CABDFF"} stackedColumnSeries={chartData.totalSales.series} stackedColumnOptions={generateChartOptions(chartData.totalSales.categories, "")} />

          <DashboardItem title={"POS Sales"} color={"#FFBC99"} stackedColumnSeries={chartData.posSales.series} stackedColumnOptions={generateChartOptions(chartData.posSales.categories, "")} />

          <DashboardItem title={"Cash Sales"} color={"#B1E5FC"} stackedColumnSeries={chartData.cashSales.series} stackedColumnOptions={generateChartOptions(chartData.cashSales.categories, "")} />

          <DashboardItem title={"UPI Sales"} color={"#FFD88D"} stackedColumnSeries={chartData.upiSales.series} stackedColumnOptions={generateChartOptions(chartData.upiSales.categories, "")} />

          <DashboardItem title={"Card Sales"} color={"#CABDFF"} stackedColumnSeries={chartData.cardSales.series} stackedColumnOptions={generateChartOptions(chartData.cardSales.categories, "")} />

          <DashboardItem title={"Cash Given"} color={"#b5e4ca"} stackedColumnSeries={chartData.cashGiven.series} stackedColumnOptions={generateChartOptions(chartData.cashGiven.categories, "")} />

          <DashboardItem title={"Remaining"} color={"#FFBC99"} stackedColumnSeries={chartData.remaining.series} stackedColumnOptions={generateChartOptions(chartData.remaining.categories, "")} />


        </div>
      )}
    </>
  );
};

export default Dashboard;
