import React, { useState } from "react";

const NotificationSettings = ({ user, updateProfile }) => {
  const [formData, setFormData] = useState({
    phoneNumber: user.phoneNumber || "",
    enableTextNotifications: user.enableTextNotifications || false,
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    try {
      const result = await updateProfile({
        phoneNumber: formData.phoneNumber,
        enableTextNotifications: formData.enableTextNotifications,
      });

      if (result.success) {
        setSuccess("Notification settings updated successfully");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update notification settings"
      );
    }
  };

  return (
    <div className="profile-section">
      <h3>Text Notifications</h3>
      <p className="section-description">
        Enable text notifications to receive alerts when your appointments are
        successfully booked.
      </p>
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number</label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="(555) 555-5555"
            pattern="[0-9]{10}"
            title="Please enter a valid 10-digit phone number"
          />
          <small className="form-text text-muted">
            Enter your phone number to receive text notifications when
            appointments are booked.
          </small>
        </div>

        <div className="form-group">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="enableTextNotifications"
              name="enableTextNotifications"
              checked={formData.enableTextNotifications}
              onChange={handleChange}
              disabled={!formData.phoneNumber}
            />
            <label htmlFor="enableTextNotifications">
              Enable text notifications for appointment bookings
            </label>
          </div>
          <small className="form-text text-muted">
            You will receive a text message when any of your appointments are
            successfully booked.
          </small>
        </div>

        <button type="submit" className="btn btn-primary">
          Update Notification Settings
        </button>
      </form>
    </div>
  );
};

export default NotificationSettings;
