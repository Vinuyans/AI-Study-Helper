import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PiPaperPlaneRightFill, PiSparkleFill, PiChatCircleText } from 'react-icons/pi';
import { generateNewSchedule, optimizeSchedule } from '@/services/geminiServices';
import './SchedulerSection.css';
import { ScheduleComponent, Day, Week, WorkWeek, Month, Agenda, Inject } from '@syncfusion/ej2-react-schedule';




const SchedulerSection = () => {

  const [dataHasChanged, setDataHasChanged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [data, setData] = useState(() => {
    let oldSchedule = JSON.parse(localStorage.getItem("schedule"));
    if (oldSchedule) {
      return oldSchedule;
    } else {
      return [
        {
          Id: 1,
          Subject: 'Meeting',
          StartTime: new Date(2025, 11, 3, 13, 0),
          EndTime: new Date(2025, 11, 3, 14, 30),
        },
      ]
    }
  });

  const handleActionComplete = (event) => {
    if (event.requestType === "eventCreated") {
      setDataHasChanged(!dataHasChanged);
    } else if (event.requestTypy === "eventChanged") {
      setDataHasChanged(!dataHasChanged);
    } else if (event.requestType === "eventRemoved") {
      setDataHasChanged(!dataHasChanged);
    }
  }

  const handleGenerateNewSchedule = async () => {
    setLoading(true);
    try {
      let newSchedule;
      newSchedule = await generateNewSchedule();
      if (newSchedule) {
        setData(newSchedule);
        setDataHasChanged(!dataHasChanged);
        console.log(newSchedule)
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const handleOptimizeSchedule = async () => {
    setLoading(true);
    try {
      let newSchedule;
      // newSchedule = await optimizeSchedule(prompt, data);
      if (newSchedule) {
        setData(newSchedule);
        setDataHasChanged(!dataHasChanged);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  //This gets rid of a free trial popup
  useEffect(() => {
    let badDiv = document.querySelector("body > script + div");
    if (badDiv) {
      badDiv.hidden = true
    }
    badDiv = document.querySelector("body > script + div + span + div");
    if (badDiv) {
      badDiv.parentElement.removeChild(badDiv);
    }
  }, []);

  useEffect(() => {
    if (data) {
      localStorage.setItem("schedule", JSON.stringify(data));
    }
  }, [data, dataHasChanged]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg p-6 container">
      <div className="mb-6 border-b border-gray-200 pb-6">
        <textarea
          id="prompt-textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 mb-4 flex-1 resize-y"
          placeholder="Type any specific schedule requests here (for optimizing only)."
          disabled={loading}
          aria-label="Schedule AI prompt"
        ></textarea>
        <button
          onClick={handleGenerateNewSchedule}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
        >
          Generate New Schedule
        </button>
        <button
          onClick={handleOptimizeSchedule}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
        >
          Optimize Schedule
        </button>
      </div>
      <ScheduleComponent
        selectedDate={new Date()}
        eventSettings={{
          dataSource: data
        }}
        actionComplete={(event) => {
          handleActionComplete(event);
        }}
      >
        <Inject services={[Day, Week, WorkWeek, Month, Agenda]} />
      </ScheduleComponent>
    </div>
  );
};

export default SchedulerSection;
