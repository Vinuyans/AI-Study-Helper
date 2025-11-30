export default function LandingPage({startLearning}){
  return (
    <div className="flex flex-col gap-12 items-center">
      <div className="text-7xl">StudySensei</div>
      <div>
        <p>Welcome to StudySensoi, your new AI powered learning mate.</p>
        <p>Upload your files and let it do the job!</p>
      </div>
      <button className="w-fit" onClick={startLearning()}>Start Learning!</button>
    </div>
  );
}