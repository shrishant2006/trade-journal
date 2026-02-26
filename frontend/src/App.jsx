import "./App.css";
import { useState, useEffect } from "react";
import {
  getTrades,
  createTrade,
  deleteTradeApi
} from "./api/tApi";

function App() {
  const [trades, setTrades] = useState([]);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [tradingIndex, setTradingIndex] = useState("");

  const tradingPairs = [
    "XAUUSD",
    "US30",
    "NASDAQ",
    "SPX500",
    "GBPUSD",
    "NZDUSD",
    "USDCAD",
    "USDJPY"
  ];

  const [profit, setProfit] = useState("");
  const [loss, setLoss] = useState("");
  const [accountBalance, setAccountBalance] = useState(5000);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const DEFAULT_NET = 5000;

  // Fetch trades on load
  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const data = await getTrades();

      // Sort newest first (important for running balance logic)
      const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));

      setTrades(sorted);

      if (sorted.length > 0) {
        setAccountBalance(sorted[0].accountBalance);
      } else {
        setAccountBalance(DEFAULT_NET);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTrade = async () => {
    if (!date || !time || !tradingIndex) {
      alert("Please fill all required fields");
      return;
    }

    if (!profit && !loss) {
      alert("Enter either Profit or Loss");
      return;
    }

    if (profit && loss) {
      alert("You cannot enter both Profit and Loss");
      return;
    }

    // 🔥 Get last balance
    const previousBalance =
      trades.length > 0
        ? trades[0].accountBalance
        : DEFAULT_NET;

    // 🔥 Calculate running balance
    const newBalance =
      profit !== ""
        ? previousBalance + Number(profit)
        : previousBalance - Number(loss);

    try {
      const newTrade = await createTrade({
        date,
        time,
        tradingIndex,
        profit: Number(profit),
        loss: Number(loss),
        accountBalance: newBalance
      });

      setTrades([newTrade, ...trades]);
      setAccountBalance(newBalance);

      setDate("");
      setTime("");
      setTradingIndex("");
      setProfit("");
      setLoss("");

    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTrade = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this trade?"
    );

    if (!confirmDelete) return;

    try {
      await deleteTradeApi(id);

      const updatedTrades = trades.filter(t => t._id !== id);

      // 🔥 Recalculate balances after delete
      let runningBalance = DEFAULT_NET;

      const recalculated = updatedTrades
        .reverse()
        .map(trade => {
          runningBalance =
            runningBalance + (trade.profit || 0) - (trade.loss || 0);

          return {
            ...trade,
            accountBalance: runningBalance
          };
        })
        .reverse();

      setTrades(recalculated);

      if (recalculated.length > 0) {
        setAccountBalance(recalculated[0].accountBalance);
      } else {
        setAccountBalance(DEFAULT_NET);
      }

    } catch (err) {
      setError(err.message);
    }
  };

  // Summary
  const totalProfit = trades.reduce((acc, t) => acc + (t.profit || 0), 0);
  const totalLoss = trades.reduce((acc, t) => acc + (t.loss || 0), 0);
  const netAmount = DEFAULT_NET + totalProfit - totalLoss;

  const formatUSD = (value) => {
    return Number(value).toLocaleString("en-US", {
      style: "currency",
      currency: "USD"
    });
  };

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2>Error: {error}</h2>;

  return (
    <div className="container">
      <h1>Trade Journal App</h1>

      {/* Summary Card */}
      <div className="summary-card">
        <p>
          <strong>Total Profit:</strong>{" "}
          <span className="profit">{formatUSD(totalProfit)}</span>
        </p>
        <p>
          <strong>Total Loss:</strong>{" "}
          <span className="loss">{formatUSD(totalLoss)}</span>
        </p>
        <p>
          <strong>Net Amount:</strong>{" "}
          <span className={netAmount >= 0 ? "profit" : "loss"}>
            {formatUSD(netAmount)}
          </span>
        </p>
      </div>

      {/* Input Section */}
      <div className="input-group">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />

        <select
          value={tradingIndex}
          onChange={(e) => setTradingIndex(e.target.value)}
        >
          <option value="">Select Trading Pair</option>
          {tradingPairs.map((pair) => (
            <option key={pair} value={pair}>
              {pair}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Profit"
          value={profit}
          onChange={(e) => {
            setProfit(e.target.value);
            if (e.target.value !== "") setLoss("");
          }}
        />

        <input
          type="number"
          placeholder="Loss"
          value={loss}
          onChange={(e) => {
            setLoss(e.target.value);
            if (e.target.value !== "") setProfit("");
          }}
        />

        <input
          type="number"
          value={accountBalance}
          readOnly
        />

        <button onClick={addTrade}>Add Trade</button>
      </div>

      {/* Trade List */}
      <ul>
        {trades.map((trade) => (
          <li key={trade._id}>
            <p><strong>Date:</strong> {trade.date}</p>
            <p><strong>Time:</strong> {trade.time}</p>
            <p><strong>Index:</strong> {trade.tradingIndex}</p>

            {trade.profit ? (
              <p className="profit">
                <strong>Profit:</strong> {formatUSD(trade.profit)}
              </p>
            ) : (
              <p className="loss">
                <strong>Loss:</strong> {formatUSD(trade.loss)}
              </p>
            )}

            <p>
              <strong>Balance:</strong>{" "}
              {formatUSD(trade.accountBalance)}
            </p>

            <button onClick={() => deleteTrade(trade._id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
