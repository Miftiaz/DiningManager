import React, { useEffect, useState } from 'react';
import { borderAPI } from '../utils/api';
import '../styles/Transactions.css';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await borderAPI.getAllTransactions();
      setTransactions(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load transactions');
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

  if (loading) return <div className="loading">Loading transactions...</div>;

  const totals = calculateTotals();

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <h1>Transaction History</h1>
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
