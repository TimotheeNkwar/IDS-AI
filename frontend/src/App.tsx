import { useEffect } from "react";
import Router from "./router/router";
import { useWsStore } from "./stores/wsStore";

function App() {
  const { connect } = useWsStore();
  useEffect(() => {
    connect();
  }, []);
  return (
    <div className="h-screen relative z-10">
      <Router />
    </div>
  );
}

export default App;
