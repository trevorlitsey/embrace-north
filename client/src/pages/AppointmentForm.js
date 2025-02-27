// File: src/pages/AppointmentForm.js
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";

const AppointmentForm = () => {
  const [formData, setFormData] = useState({
    date: "",
    times: [""],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      const fetchAppointment = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/api/appointments/${id}`);
          const { date, times } = res.data;

          setFormData({
            date: new Date(date).toISOString().split("T")[0],
            times: times,
          });
        } catch (err) {
          setError("Failed to fetch appointment details");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchAppointment();
    }
  }, [id, isEditMode]);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onTimeChange = (index, value) => {
    const updatedTimes = [...formData.times];
    updatedTimes[index] = value;
    setFormData({ ...formData, times: updatedTimes });
  };

  const addTimeSlot = () => {
    setFormData({ ...formData, times: [...formData.times, ""] });
  };

  const removeTimeSlot = (index) => {
    const updatedTimes = formData.times.filter((_, i) => i !== index);
    setFormData({ ...formData, times: updatedTimes });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Filter out empty time slots
      const filteredTimes = formData.times.filter((time) => time.trim() !== "");

      if (filteredTimes.length === 0) {
        setError("Please add at least one time slot");
        setLoading(false);
        return;
      }

      const appointmentData = {
        ...formData,
        times: filteredTimes,
      };

      if (isEditMode) {
        await api.put(`/api/appointments/${id}`, appointmentData);
      } else {
        await api.post("/api/appointments", appointmentData);
      }

      navigate("/dashboard");
    } catch (err) {
      setError("Failed to save appointment");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="appointment-form-container">
      <h1>{isEditMode ? "Edit Appointment" : "Create New Appointment"}</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={onChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Time Slots</label>
          {formData.times.map((time, index) => (
            <div key={index} className="time-slot">
              <input
                type="time"
                value={time}
                onChange={(e) => onTimeChange(index, e.target.value)}
                required
              />
              {formData.times.length > 1 && (
                <button
                  type="button"
                  className="btn-small btn-danger"
                  onClick={() => removeTimeSlot(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button type="button" className="btn-small" onClick={addTimeSlot}>
            Add Time Slot
          </button>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn"
            onClick={() => navigate("/dashboard")}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Save Appointment"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;
