import "./App.css";
import Navbar from "./components/Navbar";
import Transactions from "./components/Transactions";
import Footer from "./components/Footer";
import Welcome from "./components/Welcome";
import Services from "./components/Services";

function App() {
  return (
    <div className="min-h-screen">
      <div className="gradient-bg-welcome">
        <Navbar />
        <Welcome />
      </div>
      <Services />
      <Transactions />
      <Footer />
    </div>
  );
}

export default App;
