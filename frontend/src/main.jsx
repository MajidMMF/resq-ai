import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import store from "./store";
import App from "./App";
import PremiumLoader from "./components/shared/PremiumLoader";
import "./index.css";

const Root = () => {
  const [loading, setLoading] = useState(true);

  return (
    <React.StrictMode>
      <Provider store={store}>
        <BrowserRouter>
          {loading && <PremiumLoader onComplete={() => setLoading(false)} />}
          <App />
          <Toaster
            position="top-right"
            theme="dark"
            richColors
            closeButton
            toastOptions={{
              style: {
                background: "#0F1626",
                border: "1px solid #242F3F",
                color: "#F8FAFC",
              },
            }}
          />
        </BrowserRouter>
      </Provider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
