import React from "react";
import "./Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-waves">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
      </div>
      <div className="footer-copyright">
        <p>&copy; {currentYear} T. Use at your own risk.</p>
      </div>
    </footer>
  );
};

export default Footer;
