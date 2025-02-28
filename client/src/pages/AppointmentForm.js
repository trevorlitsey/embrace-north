// File: src/pages/AppointmentForm.js
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";

const OPTIONS = [
  "5:30 AM",
  "5:45 AM",
  "6:00 AM",
  "6:15 AM",
  "6:30 AM",
  "6:45 AM",
  "7:00 AM",
  "7:15 AM",
  "7:30 AM",
  "7:45 AM",
  "8:00 AM",
  "8:15 AM",
  "8:30 AM",
  "8:45 AM",
  "9:00 AM",
  "9:15 AM",
  "9:30 AM",
  "9:45 AM",
  "10:00 AM",
  "10:15 AM",
  "10:30 AM",
  "10:45 AM",
  "11:00 AM",
  "11:15 AM",
  "11:30 AM",
  "11:45 AM",
  "12:00 PM",
  "12:15 PM",
  "12:30 PM",
  "12:45 PM",
  "1:00 PM",
  "1:15 PM",
  "1:30 PM",
  "1:45 PM",
  "2:00 PM",
  "2:15 PM",
  "2:30 PM",
  "2:45 PM",
  "3:00 PM",
  "3:15 PM",
  "3:30 PM",
  "3:45 PM",
  "4:00 PM",
  "4:15 PM",
  "4:30 PM",
  "4:45 PM",
  "5:00 PM",
  "5:15 PM",
  "5:30 PM",
  "5:45 PM",
  "6:00 PM",
  "6:15 PM",
  "6:30 PM",
  "6:45 PM",
  "7:00 PM",
  "7:15 PM",
  "7:30 PM",
  "7:45 PM",
  "8:00 PM",
  "8:15 PM",
];

const AppointmentForm = () => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    times: [OPTIONS[0]],
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
    console.log(value);

    const updatedTimes = [...formData.times];
    updatedTimes[index] = value;
    setFormData({ ...formData, times: updatedTimes });
  };

  const addTimeSlot = () => {
    const lastTimesValue = formData.times[formData.times.length - 1];

    setFormData({
      ...formData,
      times: [
        ...formData.times,
        OPTIONS[OPTIONS.indexOf(lastTimesValue) + 1] || lastTimesValue,
      ],
    });
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
            min={new Date().toISOString().slice(0, 10)}
            value={formData.date}
            onChange={onChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Time Slots</label>
          <p>
            <small>
              Time slots to look for in order of preference. Only one time will
              be booked.
            </small>
          </p>
          {formData.times.map((time, index) => (
            <div key={index} className="time-slot">
              <select
                id="timeSelect"
                name="timeSelect"
                value={time}
                required
                onChange={(e) => onTimeChange(index, e.target.value)}
              >
                {OPTIONS.map((o) => (
                  <option disabled={formData.times.includes(o)} value={o}>
                    {o}
                  </option>
                ))}
              </select>
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
