// File: src/pages/Dashboard.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";

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
                <h3>{new Date(appointment.date).toLocaleDateString()}</h3>
                <div className="appointment-actions">
                  <Link
                    to={`/appointments/edit/${appointment._id}`}
                    className="btn btn-small"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteAppointment(appointment._id)}
                    className="btn btn-small btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="appointment-times">
                <h4>Times:</h4>
                <ul>
                  {appointment.times.map((time, index) => (
                    <li key={index}>{time}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
