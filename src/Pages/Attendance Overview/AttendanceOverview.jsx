import React, { useMemo, useState } from "react";
import "./AttendanceOverview.css";
import HOC from "../../Components/HOC/HOC";
import { MdCalendarMonth } from "react-icons/md";

const STATUS_FILTERS = [
  "All",
  "Complete Lecture",
  "Not Started",
  "Pending",
  "Incomplete",
];

const AttendanceOverview = () => {
  const [filter, setFilter] = useState("All");

  const attendanceData = useMemo(
    () => [
      {
        date: "29 July 2023",
        day: "Monday",
        startTime: "09:00",
        closeTime: "18:00",
        watchTime: "10h 2m",
        status: "Complete Lecture",
      },
      {
        date: "30 July 2023",
        day: "Tuesday",
        startTime: "09:00",
        closeTime: "18:00",
        watchTime: "08h 45m",
        status: "Not Started",
      },
      {
        date: "31 July 2023",
        day: "Wednesday",
        startTime: "09:00",
        closeTime: "18:00",
        watchTime: "06h 10m",
        status: "Pending",
      },
      {
        date: "01 Aug 2023",
        day: "Thursday",
        startTime: "09:00",
        closeTime: "18:00",
        watchTime: "09h 30m",
        status: "Incomplete",
      },
      {
        date: "02 Aug 2023",
        day: "Friday",
        startTime: "09:00",
        closeTime: "18:00",
        watchTime: "09h 10m",
        status: "Complete Lecture",
      },
      {
        date: "03 Aug 2023",
        day: "Saturday",
        startTime: "09:00",
        closeTime: "18:00",
        watchTime: "05h 55m",
        status: "Pending",
      },
    ],
    []
  );

  const filteredRows = useMemo(() => {
    if (filter === "All") {
      return attendanceData;
    }

    return attendanceData.filter((item) => item.status === filter);
  }, [attendanceData, filter]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Complete Lecture":
        return { backgroundColor: "#E6EFFC", color: "#0764E6" };
      case "Not Started":
        return { backgroundColor: "#FFE5EE", color: "#AA0000" };
      case "Pending":
        return { backgroundColor: "#FFF8E7", color: "#D5B500" };
      case "Incomplete":
        return { backgroundColor: "#EFEFEF", color: "#8A8A8A" };
      default:
        return {};
    }
  };

  const downloadCsv = () => {
    const header = [
      "Date",
      "Day",
      "Start Time",
      "Close Time",
      "Watch Time",
      "Status",
    ];
    const rows = filteredRows.map((row) =>
      [row.date, row.day, row.startTime, row.closeTime, row.watchTime, row.status]
        .map((cell) => `"${cell}"`)
        .join(",")
    );
    const csvContent = [header.join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "attendance.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="attendance">
      <div className="attendance1">
        <div className="attendance2">
          <h6>Attendance Overview</h6>
          <div className="attendance3">
            <div className="attendance4">
              {STATUS_FILTERS.map((status) => (
                <label className="attendance5" key={status}>
                  <input
                    type="radio"
                    name="status-filter"
                    checked={filter === status}
                    onChange={() => setFilter(status)}
                  />
                  <span>{status}</span>
                </label>
              ))}
            </div>
            <div className="attendance6">
              <MdCalendarMonth color="#9295AB" />
              <p>29 July 2023</p>
            </div>
            <button type="button" onClick={downloadCsv} className="attendance7">
              <p>Download CSV</p>
            </button>
          </div>
        </div>

        <div className="attendance9">
          <div className="attendance10">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Start Time</th>
                  <th></th>
                  <th>Close Time</th>
                  <th>Watch Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((item, index) => (
                  <tr key={`${item.date}-${index}`}>
                    <td>{item.date}</td>
                    <td>{item.day}</td>
                    <td style={{ color: "#0043FF", fontWeight: 700 }}>
                      {item.startTime}
                    </td>
                    <td>
                      <div className="attendance12" />
                    </td>
                    <td style={{ color: "#D5B500", fontWeight: 700 }}>
                      {item.closeTime}
                    </td>
                    <td style={{ color: "#AA0000", fontWeight: 700 }}>
                      {item.watchTime}
                    </td>
                    <td>
                      <div
                        className="attendance11"
                        style={getStatusStyle(item.status)}
                      >
                        <p>{item.status}</p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HOC(AttendanceOverview);

