import { useState } from "react";
import "./App.css";
import LandingPage from "./components/LandingPage";
import FileUploader from "./components/FileUploader";

function App() {
  const [startLearning, setStartLearning] = useState(false);

  const onStartLearning = () => {
    setStartLearning(true);
  };

  return (
    <>
      {startLearning ? (
        <FileUploader />
      ) : (
        <LandingPage startLearning={onStartLearning} />
      )}
    </>
  );
}

export default App;
