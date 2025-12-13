import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PiPaperPlaneRightFill, PiSparkleFill, PiChatCircleText } from 'react-icons/pi';
import { sendMessageStream } from '@/services/geminiServices';
import './SchedulerSection.css';
import { ScheduleComponent, Day, Week, WorkWeek, Month, Agenda, Inject } from '@syncfusion/ej2-react-schedule';




const SchedulerSection = () => {

  const [dataHasChanged, setDataHasChanged] = useState(false);
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

  //This gets rid of a free trial popup
  useEffect(()=>{
    let badDiv = document.querySelector("body > script + div");
    if(badDiv) {
      badDiv.hidden=true
    }
  }, []);

  useEffect(()=>{
    if (data) {
      console.log("saving data");
      localStorage.setItem("schedule", JSON.stringify(data));
    }
  }, [data, dataHasChanged]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg p-6">
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
