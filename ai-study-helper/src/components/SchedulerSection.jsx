import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PiPaperPlaneRightFill, PiSparkleFill, PiChatCircleText } from 'react-icons/pi';
import { sendMessageStream } from '@/services/geminiServices';
import './SchedulerSection.css';
import { ScheduleComponent, Day, Week, WorkWeek, Month, Agenda, Inject } from '@syncfusion/ej2-react-schedule';




const SchedulerSection = () => {

  const [data, setData] = useState([
    {
      Id: 1,
      Subject: 'Meeting',
      StartTime: new Date(2025, 11, 3, 13, 0),
      EndTime: new Date(2025, 11, 3, 14, 30),
    },
  ]);

  useEffect(()=>{
    let badDiv = document.querySelector("body > script + div");
    if(badDiv) {
      badDiv.hidden=true
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg p-6">
    <ScheduleComponent
      selectedDate={new Date(2025, 11, 3)}
      eventSettings={{
        dataSource: data,
      }}
    >
      <Inject services={[Day, Week, WorkWeek, Month, Agenda]} />
    </ScheduleComponent>
    </div>
  );
};

export default SchedulerSection;
