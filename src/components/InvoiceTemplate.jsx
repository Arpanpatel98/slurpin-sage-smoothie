import React from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const InvoiceTemplate = ({ order, onClose }) => {
  const generatePDF = async () => {
    const invoice = document.querySelector('.invoice-container_invoiceTemplate');
    const nutritionalSummary = document.querySelector('.nutritional-summary_invoiceTemplate');

    // Ensure consistent rendering
    invoice.style.width = '800px';
    invoice.style.transform = 'scale(1)';
    invoice.style.transformOrigin = 'top left';
    nutritionalSummary.style.backgroundColor = '#e6f4ea';
    nutritionalSummary.style.overflow = 'visible';

    try {
      // Render the nutritional summary separately for clarity
      const nutritionalCanvas = await html2canvas(nutritionalSummary, {
        scale: 4,
        useCORS: true,
        backgroundColor: '#e6f4ea',
        logging: true
      });

      // Render the full invoice
      const canvas = await html2canvas(invoice, {
        scale: 4,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        windowHeight: invoice.offsetHeight,
        logging: true
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 190; // A4 width (210mm) minus 10mm margins
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      // Add the invoice image
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;

      // Handle multi-page content
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`SlurpinSage_Receipt_${order.orderId}.pdf`);

      // Reset styles
      invoice.style.width = '';
      invoice.style.transform = '';
      nutritionalSummary.style.backgroundColor = '';
      nutritionalSummary.style.overflow = '';
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('An error occurred while generating the PDF. Please check the console for details and try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50_invoiceTemplate">
      <div className="bg-white p-4 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto_invoiceTemplate">
        <div className="flex justify-between items-center mb-4_invoiceTemplate">
          <h2 className="text-2xl font-bold text-gray-900_invoiceTemplate">Invoice Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700_invoiceTemplate"
          >
            <svg className="w-6 h-6_invoiceTemplate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="invoice-container_invoiceTemplate rounded-lg overflow-hidden">
          {/* Background Pattern */}
          {/* <div className="leaf-pattern top-0 left-0 w-full h-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 800 800">
              <pattern id="leaf-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M50,0 C60,20 80,20 100,10 C80,40 80,60 100,90 C80,80 60,80 50,100 C40,80 20,80 0,90 C20,60 20,40 0,10 C20,20 40,20 50,0" fill="#1a4d2e"></path>
              </pattern>
              <rect width="100%" height="100%" fill="url(#leaf-pattern)"></rect>
            </svg>
          </div> */}

          <div className="content-wrapper_invoiceTemplate">
            {/* Invoice Header */}
            <div className="invoice-header_invoiceTemplate flex justify-between items-center bg-[#2F6A3D] text-white p-8">
              <div className="flex items-center_invoiceTemplate">
                <div className="mr-4_invoiceTemplate">
                  <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                </div>
                <div>
                  <div className="logo-text_invoiceTemplate text-4xl font-bold">SlurpinSage</div>
                  <div className="text-sm opacity-80_invoiceTemplate">Nourish Your Journey</div>
                </div>
              </div>
              <div className="text-right_invoiceTemplate">
                <div className="text-4xl font-bold_invoiceTemplate">INVOICE</div>
                <div className="text-sm opacity-80_invoiceTemplate">#INV-{order.orderId}</div>
              </div>
            </div>

            {/* Invoice Body */}
            <div className="invoice-body_invoiceTemplate">
              {/* Business & Customer Info */}
              <div className="grid grid-cols-2 gap-8 mb-8_invoiceTemplate">
                <div>
                  <h3 className="section-title_invoiceTemplate">Our Information</h3>
                  <p className="font-medium_invoiceTemplate">SlurpinSage Health Beverages</p>
                  <p>123 Green Avenue</p>
                  <p>Wellness District, CA 90210</p>
                  <p>Phone: (555) 123-4567</p>
                  <p>Email: orders@slurpinsage.com</p>
                  <p>Tax ID: 12-3456789</p>
                </div>
                <div>
                  <h3 className="section-title_invoiceTemplate">Order Information</h3>
                  <p className="font-medium_invoiceTemplate">Order #{order.orderId}</p>
                  <p>{new Date(order.timestamp).toLocaleString()}</p>
                  <p>{order.orderDetails?.location}</p>
                  <p>{order.orderDetails?.address}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-8_invoiceTemplate">
                <h3 className="section-title_invoiceTemplate">Order Items</h3>
                <table className="w-full mb-4_invoiceTemplate">
                  <thead>
                    <tr className="bg-gray-100 text-left_invoiceTemplate">
                      <th className="py-2 px-4 font-semibold_invoiceTemplate">Item</th>
                      <th className="py-2 px-4 font-semibold_invoiceTemplate">Details</th>
                      <th className="py-2 px-4 font-semibold text-right_invoiceTemplate">Qty</th>
                      <th className="py-2 px-4 font-semibold text-right_invoiceTemplate">Price</th>
                      <th className="py-2 px-4 font-semibold text-right_invoiceTemplate">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item, index) => (
                      <tr key={index} className="item-row_invoiceTemplate border-b">
                        <td className="py-3 px-4_invoiceTemplate">
                          <div className="font-medium_invoiceTemplate">{item.name}</div>
                          <div className="text-xs text-gray-500_invoiceTemplate">{item.size}</div>
                        </td>
                        <td className="py-3 px-4_invoiceTemplate">
                          <div className="text-xs text-gray-600_invoiceTemplate">{item.milk}</div>
                          {item.addons && item.addons.length > 0 && (
                            <div className="mt-1_invoiceTemplate">
                              {item.addons.map((addon, idx) => (
                                <span key={idx} className="nutritional-badge_invoiceTemplate vegan mr-1">{addon}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right_invoiceTemplate">{item.quantity}</td>
                        <td className="py-3 px-4 text-right_invoiceTemplate">₹{item.price}</td>
                        <td className="py-3 px-4 text-right font-medium_invoiceTemplate">₹{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Order Totals */}
                <div className="flex justify-end_invoiceTemplate">
                  <div className="w-64_invoiceTemplate">
                    <div className="flex justify-between py-2_invoiceTemplate">
                      <div className="text-gray-600_invoiceTemplate">Subtotal:</div>
                      <div className="font-medium_invoiceTemplate">₹{order.total?.toFixed(2)}</div>
                    </div>
                    <div className="flex justify-between py-2_invoiceTemplate">
                      <div className="text-gray-600_invoiceTemplate">Add-ins:</div>
                      <div className="font-medium_invoiceTemplate">₹{order.addInsTotal?.toFixed(2)}</div>
                    </div>
                    <div className="flex justify-between py-2_invoiceTemplate">
                      <div className="text-gray-600_invoiceTemplate">Tax:</div>
                      <div className="font-medium_invoiceTemplate">₹{order.tax?.toFixed(2)}</div>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between py-2_invoiceTemplate">
                        <div className="text-gray-600_invoiceTemplate">Loyalty Discount:</div>
                        <div className="font-medium text-green-600_invoiceTemplate">-₹{order.discount?.toFixed(2)}</div>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-t border-gray-300 mt-2_invoiceTemplate">
                      <div className="text-lg font-bold_invoiceTemplate">Total:</div>
                      <div className="text-lg font-bold_invoiceTemplate">
                        ₹{((order.total + order.addInsTotal + order.tax - (order.discount || 0)).toFixed(2))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 pt-6 flex justify-between items-center_invoiceTemplate">
                <div>
                  <p className="font-medium text-green-800_invoiceTemplate">Thank you for choosing SlurpinSage!</p>
                  <p className="text-sm text-gray-600_invoiceTemplate">Your health journey is our priority.</p>
                  <div className="flex items-center mt-2_invoiceTemplate">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-1_invoiceTemplate" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                    </svg>
                    <span className="text-sm_invoiceTemplate">slurpinsage.com</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Graphic */}
            <div className="footer-graphic_invoiceTemplate flex items-center justify-center">
              <div className="text-white text-sm font-medium_invoiceTemplate">
                Printed on 100% recycled paper • Please recycle or compost this receipt
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end_invoiceTemplate">
          <button
            onClick={generatePDF}
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500_invoiceTemplate"
          >
            <svg
              className="-ml-1 mr-3 h-5 w-5_invoiceTemplate"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplate; 