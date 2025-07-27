import React from 'react';
import Footer from './footer';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <Navbar /> 
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;