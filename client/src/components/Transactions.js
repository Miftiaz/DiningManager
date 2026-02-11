import React, { useEffect, useState } from 'react';
import { borderAPI, authAPI } from '../utils/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/Transactions.css';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transRes, dashRes] = await Promise.all([
        borderAPI.getAllTransactions(),
        authAPI.getDashboard()
      ]);
      setTransactions(transRes.data);
      setDashboardData(dashRes.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  const calculateDue = (amount, paidAmount) => {
    return Math.max(0, amount - paidAmount);
  };

  const calculateTotals = () => {
    return transactions.reduce(
      (acc, transaction) => ({
        days: acc.days + transaction.days,
        amount: acc.amount + transaction.amount,
        paidAmount: acc.paidAmount + transaction.paidAmount,
        due: acc.due + calculateDue(transaction.amount, transaction.paidAmount)
      }),
      { days: 0, amount: 0, paidAmount: 0, due: 0 }
    );
  };

  const downloadPDF = async () => {
    setDownloadLoading(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Header
      pdf.setFontSize(18);
      pdf.text('Transaction History Report', margin, yPosition);
      yPosition += 10;

      // Manager Info
      pdf.setFontSize(11);
      pdf.text(`Manager: ${dashboardData?.manager?.name || 'N/A'}`, margin, yPosition);
      yPosition += 7;

      const startDate = new Date(dashboardData?.activeDiningMonth?.startDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      const endDate = new Date(dashboardData?.activeDiningMonth?.endDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });

      pdf.text(`Dining Month: ${startDate} - ${endDate}`, margin, yPosition);
      yPosition += 7;

      pdf.text(`Feast Subscribers: ${dashboardData?.activeDiningMonth?.feastSubscribers || 0}`, margin, yPosition);
      yPosition += 12;

      // Table
      const totals = calculateTotals();
      const tableData = transactions.map(t => [
        t.studentId,
        formatDate(t.date),
        t.days,
        t.amount,
        t.paidAmount,
        calculateDue(t.amount, t.paidAmount),
        t.type
      ]);

      // Add totals row
      tableData.push([
        { content: 'Total', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: '', styles: { fillColor: [240, 240, 240] } },
        { content: totals.days, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: totals.amount, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: totals.paidAmount, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: totals.due, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: '-', styles: { fillColor: [240, 240, 240] } }
      ]);

      autoTable(pdf, {
        head: [['Student ID', 'Date', 'Days', 'Payable/Returnable', 'Paid/Refunded', 'Payment Due / Refund Due', 'Type']],
        body: tableData,
        startY: yPosition,
        margin: margin,
        styles: {
          fontSize: 9,
          cellPadding: 4
        },
        headStyles: {
          fillColor: [102, 126, 234],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });

      pdf.save(`Transaction_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
    } catch (err) {
      setError('Failed to download PDF');
      console.error(err);
    } finally {
      setDownloadLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading transactions...</div>;

  const totals = calculateTotals();

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <h1>Transaction History</h1>
        <button 
          className="download-btn"
          onClick={downloadPDF}
          disabled={downloadLoading || transactions.length === 0}
        >
          {downloadLoading ? 'Generating PDF...' : 'Download PDF'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {transactions.length > 0 ? (
        <div className="table-wrapper">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Date</th>
                <th>Days</th>
                <th>Payable/Returnable</th>
                <th>Paid/Refunded</th>
                <th>Payment Due / Refund Due</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <tr key={index}>
                  <td>{transaction.studentId}</td>
                  <td>{formatDate(transaction.date)}</td>
                  <td>{transaction.days}</td>
                  <td>{transaction.amount}</td>
                  <td>{transaction.paidAmount}</td>
                  <td>{calculateDue(transaction.amount, transaction.paidAmount)}</td>
                  <td>
                    <span className={`type-badge type-${transaction.type.toLowerCase().replace(/\s+/g, '-')}`}>
                      {transaction.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2"><strong>Total</strong></td>
                <td><strong>{totals.days}</strong></td>
                <td><strong>{totals.amount} tk</strong></td>
                <td><strong>{totals.paidAmount} tk</strong></td>
                <td><strong>{totals.due} tk</strong></td>
                <td>-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="no-transactions">
          <p>No transactions found</p>
        </div>
      )}
    </div>
  );
}
