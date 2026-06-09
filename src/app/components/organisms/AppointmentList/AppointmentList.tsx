import AppointmentItem from "../../molecules/AppointmentItem/AppointmentItem";

export type Appointment = {
  id: string;
  doctor: string;
  specialty: string;
  date: Date;
  time?: string;
  description?: string;
};

type AppointmentListProps = {
  appointments: Appointment[];
  onEditAppointment: (appointment: Appointment) => void;
};

export default function AppointmentList({ appointments, onEditAppointment }: AppointmentListProps) {
  return (
    <div>
      {appointments.map((appointment) => (
        <AppointmentItem
          key={appointment.id}
          doctor={appointment.doctor}
          specialty={appointment.specialty}
          date={appointment.date}
          time={appointment.time}
          description={appointment.description}
          onEdit={() => onEditAppointment(appointment)}
        />
      ))}
    </div>
  );
}