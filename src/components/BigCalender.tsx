"use client";

import { Calendar, momentLocalizer, View, Views, Event } from "react-big-calendar"; 
import moment from "moment";
import "moment/locale/id";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";

moment.updateLocale('id', { week: { dow: 1 } });
const localizer = momentLocalizer(moment);

const messages = { 
  week: "Minggu ini", day: "Hari ini", previous: "<", next: ">", today: "Hari Ini", month: "Bulan", agenda: "Agenda", noEventsInRange: "Tidak ada jadwal"
};

interface BigCalendarProps {
  events: Event[]; 
}
const BigCalendar = ({ events }: BigCalendarProps) => { 
  const [view, setView] = useState<View>(Views.WEEK); 

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  return (
    <Calendar
      localizer={localizer}
      events={events} 
      startAccessor="start"
      endAccessor="end"
      views={[Views.WEEK, Views.DAY, Views.AGENDA]}
      defaultView={Views.WEEK} 
      view={view} 
      style={{ height: "600px" }} 
      onView={handleOnChangeView}
      min={moment().startOf('day').add(7, 'hours').toDate()} 
      max={moment().startOf('day').add(17, 'hours').toDate()}
      messages={messages}
      culture='id' 
      popup
      step={30}
      timeslots={2} 
    />
  );
};

export default BigCalendar;

