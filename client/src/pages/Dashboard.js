// File: src/pages/Dashboard.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { DateTime } from "luxon";

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await api.get("/api/appointments");
        setAppointments(res.data);
      } catch (err) {
        setError("Failed to fetch appointments");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const deleteAppointment = async (id) => {
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      try {
        await api.delete(`/api/appointments/${id}`);
        setAppointments(
          appointments.filter((appointment) => appointment._id !== id)
        );
      } catch (err) {
        setError("Failed to delete appointment");
        console.error(err);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Your Appointments</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <Link to="/appointments/new" className="btn btn-primary">
        Create New Appointment
      </Link>

      {appointments.length === 0 ? (
        <div className="no-appointments">
          <p>You haven't created any appointments yet.</p>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map((appointment) => (
            <div key={appointment._id} className="appointment-card">
              <div className="appointment-header">
                <h3>
                  {DateTime.fromISO(appointment.times[0]).toFormat(
                    "EEEE, MMMM d, yyyy",
                    { zone: "America/Chicago" }
                  )}
                </h3>
                <div className="appointment-actions">
                  {appointment.timeFulfilled ? null : (
                    <Link
                      to={`/appointments/edit/${appointment._id}`}
                      className="btn btn-small"
                    >
                      Edit
                    </Link>
                  )}
                  <button
                    onClick={() => deleteAppointment(appointment._id)}
                    className="btn btn-small btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="appointment-times" style={{ marginBottom: 15 }}>
                <h4>Looking For Times:</h4>
                <ul>
                  {appointment.times?.map((time, index) => (
                    <li key={index}>
                      {DateTime.fromISO(time).toFormat("h:mm a", {
                        zone: "America/Chicago",
                      })}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="appointment-times">
                <h4>Time Booked:</h4>
                {appointment.timeFulfilled ? (
                  DateTime.fromISO(appointment.timeFulfilled).toFormat(
                    "h:mm a",
                    { zone: "America/Chicago" }
                  )
                ) : (
                  <i>
                    No time booked yet.
                    {appointment.lastChecked ? (
                      <>
                        {" "}
                        <i style={{ marginTop: 5 }}>
                          Last checked at{" "}
                          {DateTime.fromISO(appointment.lastChecked).toFormat(
                            "hh:mm a",
                            { zone: "America/Chicago" }
                          )}
                          .
                        </i>
                      </>
                    ) : null}
                  </i>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
