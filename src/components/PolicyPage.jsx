import React, { useState, useEffect } from 'react';
import './PolicyPage.css';

const PolicyPage = () => {
  const [activeSection, setActiveSection] = useState('terms');

  // Handle section change based on URL hash on initial load
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'terms' || hash === 'cancellation-refund' || hash === 'shipping-delivery') {
      setActiveSection(hash);
    } else {
      setActiveSection('terms'); // Default to Terms & Conditions
    }
  }, []);

  // Update active section and URL hash when a sidebar link is clicked
  const handleSectionChange = (section) => {
    setActiveSection(section);
    window.history.pushState(null, '', `#${section}`);
  };

  return (
    <div className="policy-page-container">
      {/* Sidebar */}
      <div className="policy-sidebar">
        <div className="sidebar-header">
          <div className="merchant-logo">
            <div className="logo-container">
              <span className="logo-text">P</span>
            </div>
          </div>
          <p className="header-text">PATEL PAYAL JAYESHBHAI</p>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${activeSection === 'terms' ? 'active' : ''}`}
            onClick={() => handleSectionChange('terms')}
          >
            Terms and Conditions
          </button>
          <button
            className={`sidebar-link ${activeSection === 'cancellation-refund' ? 'active' : ''}`}
            onClick={() => handleSectionChange('cancellation-refund')}
          >
            Cancellation and Refund Policy
          </button>
          <button
            className={`sidebar-link ${activeSection === 'shipping-delivery' ? 'active' : ''}`}
            onClick={() => handleSectionChange('shipping-delivery')}
          >
            Shipping and Delivery Policy
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="policy-content">
        <div className="content-container">
          {/* Terms & Conditions Section */}
          {activeSection === 'terms' && (
            <div className="policy-section">
              <p className="content-head">Terms & Conditions</p>
              <div className="content-seprater"></div>
              <p className="updated-date">Last updated on Jun 12th 2025</p>
              <p className="content-text">
                For the purpose of these Terms and Conditions, The term "we", "us", "our" used anywhere on this page shall mean <strong>Slurpin' Sage</strong>, whose registered/operational office is <strong>2081, 16C main 1st floor HAL 2nd stage Kodihalli, Indiranagar Bengaluru KARNATAKA 560008</strong>. "you", “your”, "user", “visitor” shall mean any natural or legal person who is visiting our website and/or agreed to purchase from us.
              </p>
              <p className="content-text">
                <strong>Your use of the website and/or purchase from us are governed by following Terms and Conditions:</strong>
              </p>
              <ul className="unorder-list">
                <li className="list-item">
                  <p className="content-text list-text">The content of the pages of this website is subject to change without notice.</p>
                </li>
                <li className="list-item">
                  <p className="content-text list-text">
                    Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials found or offered on this website for any particular purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.
                  </p>
                </li>
                <li className="list-item">
                  <p className="content-text list-text">
                    Your use of any information or materials on our website and/or product pages is entirely at your own risk, for which we shall not be liable. It shall be your own responsibility to ensure that any products, services or information available through our website and/or product pages meet your specific requirements.
                  </p>
                </li>
                <li className="list-item">
                  <p className="content-text list-text">
                    Our website contains material which is owned by or licensed to us. This material includes, but are not limited to, the design, layout, look, appearance and graphics. Reproduction is prohibited other than in accordance with the copyright notice, which forms part of these terms and conditions.
                  </p>
                </li>
                <li className="list-item">
                  <p className="content-text list-text">
                    All trademarks reproduced in our website which are not the property of, or licensed to, the operator are acknowledged on the website.
                  </p>
                </li>
                <li className="list-item">
                  <p className="content-text list-text">
                    Unauthorized use of information provided by us shall give rise to a claim for damages and/or be a criminal offense.
                  </p>
                </li>
                <li className="list-item">
                  <p className="content-text list-text">
                    From time to time our website may also include links to other websites. These links are provided for your convenience to provide further information.
                  </p>
                </li>
                <li className="list-item">
                  <p className="content-text list-text">
                    You may not create a link to our website from another website or document without Slurpin' Sage’s prior written consent.
                  </p>
                </li>
                <li className="list-item">
                  <p className="content-text list-text">
                    Any dispute arising out of use of our website and/or purchase with us and/or any engagement with us is subject to the laws of India.
                  </p>
                </li>
                <li className="list-item">
                  <p className="content-text list-text">
                    We, shall be under no liability whatsoever in respect of any loss or damage arising directly or indirectly out of the decline of authorization for any Transaction, on Account of the Cardholder having exceeded the preset limit mutually agreed by us with our acquiring bank from time to time.
                  </p>
                </li>
              </ul>
              <p className="content-text disclaimer">
                <strong>Disclaimer:</strong> The above content is created at PATEL PAYAL JAYESHBHAI's sole discretion. Razorpay shall not be liable for any content provided here and shall not be responsible for any claims and liability that may arise due to merchant’s non-adherence to it.
              </p>
            </div>
          )}

          {/* Cancellation & Refund Policy Section */}
          {activeSection === 'cancellation-refund' && (
            <div className="policy-section">
              <p className="content-head">Cancellation & Refund Policy</p>
              <div className="content-seprater"></div>
              <p className="updated-date">Last updated on Jun 12th 2025</p>
              <p className="content-text">No cancellations & refunds are entertained.</p>
              <p className="content-text disclaimer">
                <strong>Disclaimer:</strong> The above content is created at PATEL PAYAL JAYESHBHAI's sole discretion. Razorpay shall not be liable for any content provided here and shall not be responsible for any claims and liability that may arise due to merchant’s non-adherence to it.
              </p>
            </div>
          )}

          {/* Shipping & Delivery Policy Section */}
          {activeSection === 'shipping-delivery' && (
            <div className="policy-section">
              <p className="content-head">Shipping & Delivery Policy</p>
              <div className="content-seprater"></div>
              <p className="updated-date">Last updated on Jun 12th 2025</p>
              <p className="content-text">
                For International buyers, orders are shipped and delivered through registered international courier companies and/or International speed post only. For domestic buyers, orders are shipped through registered domestic courier companies and/or speed post only. Orders are shipped within 0-7 days or as per the delivery date agreed at the time of order confirmation and delivering of the shipment subject to Courier Company/post office norms.
              </p>
              <p className="content-text">
                Slurpin' Sage is not liable for any delay in delivery by the courier company/postal authorities and only guarantees to hand over the consignment to the courier company or postal authorities within 0-7 days from the date of the order and payment or as per the delivery date agreed at the time of order confirmation. Delivery of all orders will be to the address provided by the buyer. Delivery of our services will be confirmed on your mail ID as specified during registration. For any issues in utilizing our services you may contact our helpdesk on <a href="tel:8347459583">8347459583</a> or <a href="mailto:slurpinsage@gmail.com">slurpinsage@gmail.com</a>.
              </p>
              <p className="content-text disclaimer">
                <strong>Disclaimer:</strong> The above content is created at PATEL PAYAL JAYESHBHAI's sole discretion. Razorpay shall not be liable for any content provided here and shall not be responsible for any claims and liability that may arise due to merchant’s non-adherence to it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PolicyPage;