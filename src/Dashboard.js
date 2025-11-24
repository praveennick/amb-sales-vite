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
  const [individualReportType, setIndividualReportType] =
    useState("Last 7 days"); // State for the new DashboardItem dropdown
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

      const shops = [
        "The Juice Hut",
        "Bubble Tea N Cotton Candy",
        "Coffee N Candy",
      ];
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

    const shops = [
      "The Juice Hut",
      "Bubble Tea N Cotton Candy",
      "Coffee N Candy",
    ];
    const yesterday = moment().subtract(1, "days").format("DD-MM-YYYY");
    const dayBeforeYesterday = moment()
      .subtract(2, "days")
      .format("DD-MM-YYYY");

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
        const beforeYesterdayDocRef = doc(
          db,
          "shops",
          shop,
          dayBeforeYesterday,
          "data"
        );
        const beforeYesterdayDocSnap = await getDoc(beforeYesterdayDocRef);
        if (beforeYesterdayDocSnap.exists()) {
          const totalSale =
            parseFloat(beforeYesterdayDocSnap.data().totalSale) || 0;
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

  const generateChartOptions = (categories, title, originalSeries) => ({
    chart: {
      type: "bar",
      height: 350,
      stacked: true,
      stackType: "100%",
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
    dataLabels: {
      enabled: true,
      formatter: function (val, opts) {
        const seriesIndex = opts.seriesIndex;
        const dataPointIndex = opts.dataPointIndex;
        const rawValue = originalSeries[seriesIndex].data[dataPointIndex];
        return `₹${rawValue.toLocaleString()}`;
      },
      style: {
        fontSize: "12px",
        colors: ["#fff"],
      },
    },
    tooltip: {
      y: {
        formatter: (value, opts) => {
          const seriesIndex = opts.seriesIndex;
          const dataPointIndex = opts.dataPointIndex;
          const rawValue = originalSeries[seriesIndex].data[dataPointIndex];
          return `₹${rawValue.toLocaleString()}`;
        },
      },
    },
    fill: {
      opacity: 1,
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      offsetY: -10,
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
      <div className="app-title"></div>
      {/* Dropdown for selecting report type */}
      <div className="report-container mb-4">
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
        {data.length > 0 && <button className="button-container bg-[#3B82F6] text-white p-3 rounded-md flex items-center justify-center gap-2 font-bold" onClick={downloadReport}>
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" /></svg> Download
        </button>}
      </div>

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
            color="#fcca03"
            icon={<path d="M320-414v-306h120v306l-60-56-60 56Zm200 60v-526h120v406L520-354ZM120-216v-344h120v224L120-216Zm0 98 258-258 142 122 224-224h-64v-80h200v200h-80v-64L524-146 382-268 232-118H120Z" />}
            isYesterdayReport={true} // Pass this prop to conditionally render the report
            beforeYesterdayReport={beforeYesterdayReport} // Pass previous day's report for comparison
          />

          <DashboardItem
            title={"Selected Date Report"}
            color="#08cf61"
            icon={<path d="M441-82Q287-97 184-211T81-480q0-155 103-269t257-129v120q-104 14-172 93t-68 185q0 106 68 185t172 93v120Zm80 0v-120q94-12 159-78t79-160h120q-14 143-114.5 243.5T521-82Zm238-438q-14-94-79-160t-159-78v-120q143 14 243.5 114.5T879-520H759Z" />}
            totalReport={totalReport}
            total={formatNumber(calculateTotal(totalReport))}
          />
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

          <DashboardItem
            title={"Total Sales"}
            icon={<path d="M200-120q-33 0-56.5-23.5T120-200v-640h80v640h640v80H200Zm40-120v-360h160v360H240Zm200 0v-560h160v560H440Zm200 0v-200h160v200H640Z" />}
            color={"#6e5db0"}
            stackedColumnSeries={chartData.totalSales.series}
            stackedColumnOptions={generateChartOptions(
              chartData.totalSales.categories,
              "",
              chartData.totalSales.series
            )}
          />

          <DashboardItem
            title={"POS Sales"}
            icon={<path d="M280-640q-33 0-56.5-23.5T200-720v-80q0-33 23.5-56.5T280-880h400q33 0 56.5 23.5T760-800v80q0 33-23.5 56.5T680-640H280Zm0-80h400v-80H280v80ZM160-80q-33 0-56.5-23.5T80-160v-40h800v40q0 33-23.5 56.5T800-80H160ZM80-240l139-313q10-22 30-34.5t43-12.5h376q23 0 43 12.5t30 34.5l139 313H80Zm260-80h40q8 0 14-6t6-14q0-8-6-14t-14-6h-40q-8 0-14 6t-6 14q0 8 6 14t14 6Zm0-80h40q8 0 14-6t6-14q0-8-6-14t-14-6h-40q-8 0-14 6t-6 14q0 8 6 14t14 6Zm0-80h40q8 0 14-6t6-14q0-8-6-14t-14-6h-40q-8 0-14 6t-6 14q0 8 6 14t14 6Zm120 160h40q8 0 14-6t6-14q0-8-6-14t-14-6h-40q-8 0-14 6t-6 14q0 8 6 14t14 6Zm0-80h40q8 0 14-6t6-14q0-8-6-14t-14-6h-40q-8 0-14 6t-6 14q0 8 6 14t14 6Zm0-80h40q8 0 14-6t6-14q0-8-6-14t-14-6h-40q-8 0-14 6t-6 14q0 8 6 14t14 6Zm120 160h40q8 0 14-6t6-14q0-8-6-14t-14-6h-40q-8 0-14 6t-6 14q0 8 6 14t14 6Zm0-80h40q8 0 14-6t6-14q0-8-6-14t-14-6h-40q-8 0-14 6t-6 14q0 8 6 14t14 6Zm0-80h40q8 0 14-6t6-14q0-8-6-14t-14-6h-40q-8 0-14 6t-6 14q0 8 6 14t14 6Z" />}
            color={"#ed712f"}
            stackedColumnSeries={chartData.posSales.series}
            stackedColumnOptions={generateChartOptions(
              chartData.posSales.categories,
              "",
              chartData.posSales.series
            )}
          />

          <DashboardItem
            title={"Cash Sales"}
            icon={<path d="M560-440q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35ZM280-320q-33 0-56.5-23.5T200-400v-320q0-33 23.5-56.5T280-800h560q33 0 56.5 23.5T920-720v320q0 33-23.5 56.5T840-320H280Zm80-80h400q0-33 23.5-56.5T840-480v-160q-33 0-56.5-23.5T760-720H360q0 33-23.5 56.5T280-640v160q33 0 56.5 23.5T360-400Zm440 240H120q-33 0-56.5-23.5T40-240v-440h80v440h680v80ZM280-400v-320 320Z" />}
            color={"#09a7ed"}
            stackedColumnSeries={chartData.cashSales.series}
            stackedColumnOptions={generateChartOptions(
              chartData.cashSales.categories,
              "",
              chartData.cashSales.series
            )}
          />

          <DashboardItem
            title={"UPI Sales"}
            color="#b8124f"
            icon={
              <path d="M440-360h60v-80h100q17 0 28.5-11.5T640-480v-80q0-17-11.5-28.5T600-600H440v240Zm240 0h60v-240h-60v240ZM500-500v-40h80v40h-80ZM240-360h120q17 0 28.5-11.5T400-400v-200h-60v180h-80v-180h-60v200q0 17 11.5 28.5T240-360Zm-80 200q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Z" />
            }
            stackedColumnSeries={chartData.upiSales.series}
            stackedColumnOptions={generateChartOptions(
              chartData.upiSales.categories,
              "",
              chartData.upiSales.series
            )}
          />

          <DashboardItem
            title={"Card Sales"}
            icon={<path d="M880-720v480q0 33-23.5 56.5T800-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720Zm-720 80h640v-80H160v80Zm0 160v240h640v-240H160Zm0 240v-480 480Z" />}
            color={"#bd20ad"}
            stackedColumnSeries={chartData.cardSales.series}
            stackedColumnOptions={generateChartOptions(
              chartData.cardSales.categories,
              "",
              chartData.cardSales.series
            )}
          />

          <DashboardItem
            title={"Cash Given"}
            icon={<path d="M531-260h96v-3L462-438l1-3h10q54 0 89.5-33t43.5-77h40v-47h-41q-3-15-10.5-28.5T576-653h70v-47H314v57h156q26 0 42.5 13t22.5 32H314v47h222q-6 20-23 34.5T467-502H367v64l164 178ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />}
            color={"#20d435"}
            stackedColumnSeries={chartData.cashGiven.series}
            stackedColumnOptions={generateChartOptions(
              chartData.cashGiven.categories,
              "",
              chartData.cashGiven.series
            )}
          />

          <DashboardItem
            title={"Remaining"}
            icon={<path d="M336-120q-91 0-153.5-62.5T120-336q0-38 13-74t37-65l142-171-97-194h530l-97 194 142 171q24 29 37 65t13 74q0 91-63 153.5T624-120H336Zm144-200q-33 0-56.5-23.5T400-400q0-33 23.5-56.5T480-480q33 0 56.5 23.5T560-400q0 33-23.5 56.5T480-320Zm-95-360h190l40-80H345l40 80Zm-49 480h288q57 0 96.5-39.5T760-336q0-24-8.5-46.5T728-423L581-600H380L232-424q-15 18-23.5 41t-8.5 47q0 57 39.5 96.5T336-200Z" />}
            color={"#f58207"}
            stackedColumnSeries={chartData.remaining.series}
            stackedColumnOptions={generateChartOptions(
              chartData.remaining.categories,
              "",
              chartData.remaining.series
            )}
          />
        </div>
      )}
    </>
  );
};

export default Dashboard;
